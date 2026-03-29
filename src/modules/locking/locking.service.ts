import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ObjectLockingConfig } from './entities/object-locking-config.entity';
import { ObjectLock } from './entities/object-lock.entity';
import { CreateLockingConfigDto } from './dto/create-locking-config.dto';
import { UpdateLockingConfigDto } from './dto/update-locking-config.dto';
import { LockConditions, LockInfo, ConditionRule } from './interfaces/locking.interface';
import { LockingMode, ObjectType, ConditionOperator, LogicalOperator } from './enums/locking.enum';
import { LOCKING_EVENTS, OBJECT_TYPE_TABLE_MAP } from './locking.constants';
import { ICurrentUser } from '@common/interfaces';

@Injectable()
export class LockingService {
  constructor(
    @InjectRepository(ObjectLockingConfig)
    private readonly configRepo: Repository<ObjectLockingConfig>,
    @InjectRepository(ObjectLock)
    private readonly lockRepo: Repository<ObjectLock>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ============================================================
  // Admin Config CRUD
  // ============================================================

  async findAllConfigs(): Promise<ObjectLockingConfig[]> {
    return this.configRepo.find({ order: { objectType: 'ASC' } });
  }

  async findConfigByObjectType(objectType: ObjectType): Promise<ObjectLockingConfig | null> {
    return this.configRepo.findOne({ where: { objectType } });
  }

  async createConfig(dto: CreateLockingConfigDto, user: ICurrentUser): Promise<ObjectLockingConfig> {
    const existing = await this.configRepo.findOne({ where: { objectType: dto.objectType } });
    if (existing) {
      throw new ConflictException(
        `Đã có cấu hình locking cho object type "${dto.objectType}". Hãy cập nhật config hiện có.`,
      );
    }

    const config = this.configRepo.create({
      ...dto,
      createdBy: user.id,
      updatedBy: user.id,
    });
    const saved = await this.configRepo.save(config);

    this.eventEmitter.emit(LOCKING_EVENTS.CONFIG_CREATED, {
      objectType: dto.objectType,
      createdBy: user.id,
    });

    return saved;
  }

  async updateConfig(
    id: string,
    dto: UpdateLockingConfigDto,
    user: ICurrentUser,
  ): Promise<ObjectLockingConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Không tìm thấy cấu hình locking với id: ${id}`);
    }

    if (dto.version !== undefined && dto.version !== config.version) {
      throw new ConflictException(
        'Cấu hình đã bị thay đổi bởi người khác. Vui lòng tải lại trang và thử lại.',
      );
    }

    const { version: _version, ...updateData } = dto;
    Object.assign(config, updateData, { updatedBy: user.id });

    const saved = await this.configRepo.save(config);

    this.eventEmitter.emit(LOCKING_EVENTS.CONFIG_UPDATED, {
      objectType: config.objectType,
      updatedBy: user.id,
    });

    return saved;
  }

  async deleteConfig(id: string, userId: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Không tìm thấy cấu hình locking với id: ${id}`);
    }

    await this.configRepo.softRemove(config);

    this.eventEmitter.emit(LOCKING_EVENTS.CONFIG_DELETED, {
      objectType: config.objectType,
      deletedBy: userId,
    });
  }

  // ============================================================
  // Lock Operations
  // ============================================================

  /**
   * Acquire lock khi user mở form edit.
   * FE gọi khi user bấm nút "Edit" — trước khi hiển thị form.
   */
  async acquireLock(
    objectType: ObjectType,
    objectId: string,
    user: ICurrentUser,
    sessionId?: string,
  ): Promise<LockInfo> {
    const config = await this.findConfigByObjectType(objectType);

    if (!config || !config.isEnabled || config.lockingMode === LockingMode.NONE) {
      return { isLocked: false };
    }

    if (config.lockingMode === LockingMode.OPTIMISTIC) {
      return { isLocked: false };
    }

    // Kiểm tra role có bị áp dụng locking không
    if (config.applyToRoles?.length && !user.roles.some((r) => config.applyToRoles!.includes(r))) {
      return { isLocked: false };
    }

    // Evaluate conditions dựa trên data thực tế của bản ghi
    if (config.conditions) {
      const record = await this.fetchRecord(objectType, objectId);
      if (!record) {
        throw new NotFoundException(`Bản ghi ${objectType}/${objectId} không tồn tại`);
      }
      const shouldLock = this.evaluateConditions(record, config.conditions);
      if (!shouldLock) return { isLocked: false };
    }

    // Xóa lock đã hết hạn trước khi tạo mới
    await this.deleteExpiredLocks(objectType, objectId);

    const expiresAt = new Date(Date.now() + config.lockTimeoutMins * 60 * 1000);
    const existingLock = await this.lockRepo.findOne({ where: { objectType, objectId } });

    if (existingLock) {
      if (existingLock.lockedBy === user.id) {
        existingLock.expiresAt = expiresAt;
        if (sessionId) existingLock.sessionId = sessionId;
        await this.lockRepo.save(existingLock);

        return {
          isLocked: true,
          lockedBy: existingLock.lockedBy,
          lockedByName: existingLock.lockedByName,
          lockedAt: existingLock.lockedAt,
          expiresAt: existingLock.expiresAt,
          isOwnLock: true,
        };
      }

      // Bản ghi đang bị lock bởi người khác
      throw new HttpException(
        {
          statusCode: 423,
          message: `Bản ghi đang được chỉnh sửa bởi ${existingLock.lockedByName}. Vui lòng thử lại sau.`,
          data: {
            isLocked: true,
            lockedBy: existingLock.lockedBy,
            lockedByName: existingLock.lockedByName,
            lockedAt: existingLock.lockedAt,
            expiresAt: existingLock.expiresAt,
            isOwnLock: false,
          },
        },
        423,
      );
    }

    const lock = this.lockRepo.create({
      objectType,
      objectId,
      lockedBy: user.id,
      lockedByName: user.fullName,
      expiresAt,
      sessionId,
    });

    await this.lockRepo.save(lock);

    this.eventEmitter.emit(LOCKING_EVENTS.LOCK_ACQUIRED, {
      objectType,
      objectId,
      userId: user.id,
      expiresAt,
    });

    return {
      isLocked: true,
      lockedBy: user.id,
      lockedByName: user.fullName,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      isOwnLock: true,
    };
  }

  /**
   * Release lock khi user Save hoặc Cancel form.
   * Admin có thể force-release lock của người khác.
   */
  async releaseLock(
    objectType: ObjectType,
    objectId: string,
    user: ICurrentUser,
  ): Promise<void> {
    const lock = await this.lockRepo.findOne({ where: { objectType, objectId } });
    if (!lock) return;

    const isAdmin = user.roles.some((r) => ['super_admin', 'admin'].includes(r));

    if (lock.lockedBy !== user.id && !isAdmin) {
      throw new ForbiddenException(
        `Bạn không thể release lock của người khác. Lock đang được giữ bởi ${lock.lockedByName}.`,
      );
    }

    await this.lockRepo.delete({ id: lock.id });

    this.eventEmitter.emit(LOCKING_EVENTS.LOCK_RELEASED, {
      objectType,
      objectId,
      userId: user.id,
    });
  }

  /**
   * Kiểm tra trạng thái lock của một bản ghi.
   * FE gọi trước khi hiển thị/ẩn nút Edit.
   */
  async checkLockStatus(
    objectType: ObjectType,
    objectId: string,
    requestingUserId?: string,
  ): Promise<LockInfo> {
    await this.deleteExpiredLocks(objectType, objectId);

    const lock = await this.lockRepo.findOne({ where: { objectType, objectId } });
    if (!lock) return { isLocked: false };

    return {
      isLocked: true,
      lockedBy: lock.lockedBy,
      lockedByName: lock.lockedByName,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      isOwnLock: requestingUserId ? lock.lockedBy === requestingUserId : undefined,
    };
  }

  /**
   * Gia hạn lock để tránh bị tự động expire khi user đang làm việc.
   * FE gọi định kỳ (mỗi 5 phút) trong khi form đang mở.
   */
  async heartbeat(
    objectType: ObjectType,
    objectId: string,
    userId: string,
  ): Promise<LockInfo> {
    const [config, lock] = await Promise.all([
      this.findConfigByObjectType(objectType),
      this.lockRepo.findOne({ where: { objectType, objectId } }),
    ]);

    if (!lock) {
      throw new NotFoundException('Lock không tồn tại hoặc đã hết hạn. Hãy acquire lại.');
    }

    if (lock.lockedBy !== userId) {
      throw new ForbiddenException('Bạn không phải người giữ lock này.');
    }

    const timeoutMins = config?.lockTimeoutMins ?? 30;
    lock.expiresAt = new Date(Date.now() + timeoutMins * 60 * 1000);
    await this.lockRepo.save(lock);

    return {
      isLocked: true,
      lockedBy: lock.lockedBy,
      lockedByName: lock.lockedByName,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      isOwnLock: true,
    };
  }

  // ============================================================
  // Guard Helper — dùng bởi LockingGuard
  // ============================================================

  /**
   * Kiểm tra xem user hiện tại có bị chặn bởi lock của người khác không.
   * Trả về thông tin lock nếu bị chặn, null nếu được phép tiếp tục.
   */
  async checkCanEdit(
    objectType: ObjectType,
    objectId: string,
    userId: string,
  ): Promise<LockInfo | null> {
    const config = await this.findConfigByObjectType(objectType);

    if (
      !config ||
      !config.isEnabled ||
      config.lockingMode === LockingMode.NONE ||
      config.lockingMode === LockingMode.OPTIMISTIC
    ) {
      return null;
    }

    await this.deleteExpiredLocks(objectType, objectId);

    const lock = await this.lockRepo.findOne({ where: { objectType, objectId } });
    if (!lock || lock.lockedBy === userId) return null;

    return {
      isLocked: true,
      lockedBy: lock.lockedBy,
      lockedByName: lock.lockedByName,
      lockedAt: lock.lockedAt,
      expiresAt: lock.expiresAt,
      isOwnLock: false,
    };
  }

  // ============================================================
  // Scheduled Cleanup
  // ============================================================

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupAllExpiredLocks(): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(ObjectLock)
      .where('expires_at < NOW()')
      .execute();
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private async deleteExpiredLocks(objectType: ObjectType, objectId: string): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(ObjectLock)
      .where(
        'object_type = :objectType AND object_id = :objectId AND expires_at < NOW()',
        { objectType, objectId },
      )
      .execute();
  }

  private async fetchRecord(
    objectType: ObjectType,
    objectId: string,
  ): Promise<Record<string, unknown> | null> {
    const tableName = OBJECT_TYPE_TABLE_MAP[objectType];
    if (!tableName) return null;

    const results = await this.dataSource.query(
      `SELECT * FROM ${tableName} WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [objectId],
    );

    return results[0] ?? null;
  }

  private evaluateConditions(
    record: Record<string, unknown>,
    conditions: LockConditions,
  ): boolean {
    if (!conditions?.rules?.length) return true;

    const results = conditions.rules.map((rule) => {
      if ('operator' in rule && 'rules' in rule) {
        return this.evaluateConditions(record, rule as LockConditions);
      }
      return this.evaluateRule(record, rule as ConditionRule);
    });

    return conditions.operator === LogicalOperator.AND
      ? results.every((r) => r)
      : results.some((r) => r);
  }

  private evaluateRule(record: Record<string, unknown>, rule: ConditionRule): boolean {
    // Hỗ trợ cả camelCase (status) lẫn snake_case (incident_status)
    const snakeField = rule.field.replace(/([A-Z])/g, '_$1').toLowerCase();
    const fieldValue = record[rule.field] ?? record[snakeField];

    switch (rule.op) {
      case ConditionOperator.EQUALS:
        return fieldValue === rule.value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== rule.value;
      case ConditionOperator.IN:
        return Array.isArray(rule.value) && (rule.value as string[]).includes(fieldValue as string);
      case ConditionOperator.NOT_IN:
        return (
          Array.isArray(rule.value) && !(rule.value as string[]).includes(fieldValue as string)
        );
      case ConditionOperator.GREATER_THAN:
        return (fieldValue as number) > (rule.value as number);
      case ConditionOperator.LESS_THAN:
        return (fieldValue as number) < (rule.value as number);
      case ConditionOperator.IS_NULL:
        return fieldValue == null;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue != null;
      default:
        return true;
    }
  }
}
