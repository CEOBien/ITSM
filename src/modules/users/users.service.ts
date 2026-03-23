import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../../common/dto';
import { UserStatus } from '../../common/enums';
import { EVENTS } from '../../common/constants';
import { PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto, currentUser?: ICurrentUser): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException(`Email ${dto.email} đã được sử dụng`);
      }
      throw new ConflictException(`Tên đăng nhập ${dto.username} đã được sử dụng`);
    }

    const saltRounds = this.configService.get<number>('app.bcryptSaltRounds') || 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
      createdBy: currentUser?.id,
    });

    const savedUser = await this.userRepository.save(user);

    this.eventEmitter.emit(EVENTS.USER.CREATED, {
      userId: savedUser.id,
      email: savedUser.email,
      fullName: savedUser.fullName,
      createdBy: currentUser?.id,
    });

    Reflect.deleteProperty(savedUser, 'password');
    return savedUser;
  }

  async findAll(query: PaginationDto & { role?: string; status?: string; departmentId?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.employeeId',
        'user.username',
        'user.email',
        'user.fullName',
        'user.role',
        'user.status',
        'user.phone',
        'user.title',
        'user.departmentId',
        'user.location',
        'user.isVip',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.username ILIKE :search OR user.employeeId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query.status) {
      queryBuilder.andWhere('user.status = :status', { status: query.status });
    }

    if (query.departmentId) {
      queryBuilder.andWhere('user.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    queryBuilder.orderBy(`user.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'employeeId',
        'username',
        'email',
        'fullName',
        'role',
        'status',
        'phone',
        'mobile',
        'avatar',
        'title',
        'departmentId',
        'location',
        'isVip',
        'notificationEmail',
        'notificationSms',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
        'timezone',
        'language',
      ],
    });

    if (!user) throw new NotFoundException(`Người dùng #${id} không tồn tại`);
    return user;
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
    });
  }

  async update(id: string, dto: UpdateUserDto, currentUser?: ICurrentUser): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, dto);
    user.updatedBy = currentUser?.id;

    const updated = await this.userRepository.save(user);
    this.eventEmitter.emit(EVENTS.USER.UPDATED, { userId: id, changes: dto });
    return updated;
  }

  async updateStatus(id: string, status: UserStatus, currentUser?: ICurrentUser): Promise<void> {
    await this.findOne(id);
    await this.userRepository.update(id, { status, updatedBy: currentUser?.id });
  }

  async remove(id: string, _currentUser?: ICurrentUser): Promise<void> {
    const user = await this.findOne(id);
    if (user.role === 'super_admin') {
      throw new BadRequestException('Không thể xóa tài khoản Super Admin');
    }
    await this.userRepository.softDelete(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<void> {
    await this.userRepository.update(id, { avatar: avatarUrl });
  }

  async getStats() {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const locked = await this.userRepository.count({ where: { status: UserStatus.LOCKED } });
    const inactive = await this.userRepository.count({ where: { status: UserStatus.INACTIVE } });

    const byRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return { total, active, locked, inactive, byRole };
  }
}
