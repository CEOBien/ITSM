import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Change } from './entities/change.entity';
import {
  CreateChangeDto,
  UpdateChangeDto,
  ApproveChangeDto,
  ImplementChangeDto,
  CloseChangeDto,
} from './dto/create-change.dto';
import { PaginationDto } from '../../common/dto';
import { ChangeStatus, ChangeType } from '../../common/enums';
import { EVENTS } from '../../common/constants';
import { TicketNumberUtil, PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

@Injectable()
export class ChangesService {
  constructor(
    @InjectRepository(Change)
    private readonly changeRepository: Repository<Change>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateChangeDto, currentUser: ICurrentUser): Promise<Change> {
    const change = this.changeRepository.create({
      ...dto,
      changeNumber: TicketNumberUtil.change(),
      requestorId: currentUser.id,
      scheduledStartDate: dto.scheduledStartDate ? new Date(dto.scheduledStartDate) : undefined,
      scheduledEndDate: dto.scheduledEndDate ? new Date(dto.scheduledEndDate) : undefined,
      affectedCiIds: dto.affectedCiIds || [],
      relatedIncidentIds: dto.relatedIncidentIds || [],
      approvals: [],
      attachments: [],
      tags: [],
      createdBy: currentUser.id,
    });

    // Standard changes are auto-approved
    if (dto.type === ChangeType.STANDARD) {
      change.status = ChangeStatus.APPROVED;
      change.cabRequired = false;
    } else {
      change.cabRequired = dto.type === ChangeType.NORMAL;
    }

    const saved = await this.changeRepository.save(change);
    this.eventEmitter.emit(EVENTS.CHANGE.CREATED, { changeId: saved.id, type: saved.type });
    return saved;
  }

  async findAll(query: PaginationDto & { status?: ChangeStatus; type?: ChangeType }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.changeRepository.createQueryBuilder('change');

    if (search) {
      qb.andWhere('(change.title ILIKE :search OR change.changeNumber ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (query.status) qb.andWhere('change.status = :status', { status: query.status });
    if (query.type) qb.andWhere('change.type = :type', { type: query.type });

    qb.orderBy(`change.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Change> {
    const change = await this.changeRepository.findOne({ where: { id } });
    if (!change) throw new NotFoundException(`Change request #${id} không tồn tại`);
    return change;
  }

  async update(id: string, dto: UpdateChangeDto, currentUser: ICurrentUser): Promise<Change> {
    const change = await this.findOne(id);
    const nonEditableStatuses = [
      ChangeStatus.IMPLEMENTED,
      ChangeStatus.CLOSED,
      ChangeStatus.CANCELLED,
    ];
    if (nonEditableStatuses.includes(change.status)) {
      throw new BadRequestException('Không thể cập nhật Change đã hoàn thành/đóng/hủy');
    }

    Object.assign(change, {
      ...dto,
      scheduledStartDate: dto.scheduledStartDate
        ? new Date(dto.scheduledStartDate)
        : change.scheduledStartDate,
      scheduledEndDate: dto.scheduledEndDate
        ? new Date(dto.scheduledEndDate)
        : change.scheduledEndDate,
    });
    change.updatedBy = currentUser.id;

    const updated = await this.changeRepository.save(change);
    this.eventEmitter.emit(EVENTS.CHANGE.UPDATED, { changeId: id });
    return updated;
  }

  async submit(id: string, currentUser: ICurrentUser): Promise<Change> {
    const change = await this.findOne(id);
    if (change.status !== ChangeStatus.DRAFT) {
      throw new BadRequestException('Chỉ có thể gửi duyệt Change ở trạng thái Draft');
    }

    if (!change.rollbackPlan) {
      throw new BadRequestException('Cần có kế hoạch rollback trước khi gửi duyệt');
    }

    change.status = ChangeStatus.SUBMITTED;
    change.updatedBy = currentUser.id;

    const updated = await this.changeRepository.save(change);
    this.eventEmitter.emit(EVENTS.CHANGE.SUBMITTED, { changeId: id });
    return updated;
  }

  async approve(id: string, dto: ApproveChangeDto, currentUser: ICurrentUser): Promise<Change> {
    const change = await this.findOne(id);

    if (![ChangeStatus.SUBMITTED, ChangeStatus.UNDER_REVIEW].includes(change.status)) {
      throw new BadRequestException('Change không ở trạng thái chờ duyệt');
    }

    // Update approval record
    const existingApproval = change.approvals.find(a => a.approverId === currentUser.id);
    if (existingApproval) {
      existingApproval.status = dto.decision;
      existingApproval.comment = dto.comment;
      existingApproval.actionAt = new Date();
    } else {
      change.approvals.push({
        approverId: currentUser.id,
        approverName: currentUser.fullName,
        status: dto.decision,
        comment: dto.comment,
        actionAt: new Date(),
        required: true,
      });
    }

    if (dto.decision === 'rejected') {
      change.status = ChangeStatus.REJECTED;
      this.eventEmitter.emit(EVENTS.CHANGE.REJECTED, { changeId: id, reason: dto.comment });
    } else if (change.isApproved) {
      change.status = ChangeStatus.APPROVED;
      this.eventEmitter.emit(EVENTS.CHANGE.APPROVED, { changeId: id });
    }

    change.updatedBy = currentUser.id;
    return this.changeRepository.save(change);
  }

  async implement(id: string, dto: ImplementChangeDto, currentUser: ICurrentUser): Promise<Change> {
    const change = await this.findOne(id);

    if (![ChangeStatus.APPROVED, ChangeStatus.SCHEDULED].includes(change.status)) {
      throw new BadRequestException('Change chưa được phê duyệt');
    }

    change.status = ChangeStatus.IN_PROGRESS;
    change.actualStartDate = new Date();
    change.implementationNotes = dto.implementationNotes;
    change.implementerId = currentUser.id;
    change.updatedBy = currentUser.id;

    return this.changeRepository.save(change);
  }

  async close(id: string, dto: CloseChangeDto, currentUser: ICurrentUser): Promise<Change> {
    const change = await this.findOne(id);

    if (change.status !== ChangeStatus.IN_PROGRESS && change.status !== ChangeStatus.IMPLEMENTED) {
      throw new BadRequestException('Change chưa được triển khai');
    }

    change.status =
      dto.closureCode === 'successful'
        ? ChangeStatus.IMPLEMENTED
        : dto.closureCode === 'unsuccessful'
          ? ChangeStatus.FAILED
          : ChangeStatus.CANCELLED;

    change.closureCode = dto.closureCode;
    change.postImplementationReview = dto.postImplementationReview;
    change.failureReason = dto.failureReason;
    change.actualEndDate = new Date();
    change.closedAt = new Date();
    change.closedBy = currentUser.id;
    change.updatedBy = currentUser.id;

    const updated = await this.changeRepository.save(change);

    if (change.status === ChangeStatus.IMPLEMENTED) {
      this.eventEmitter.emit(EVENTS.CHANGE.IMPLEMENTED, { changeId: id });
    } else if (change.status === ChangeStatus.FAILED) {
      this.eventEmitter.emit(EVENTS.CHANGE.FAILED, { changeId: id, reason: dto.failureReason });
    }

    return updated;
  }

  async getCalendar(startDate: Date, endDate: Date) {
    return this.changeRepository
      .createQueryBuilder('change')
      .where('change.scheduledStartDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('change.status NOT IN (:...statuses)', {
        statuses: [ChangeStatus.CANCELLED, ChangeStatus.DRAFT],
      })
      .orderBy('change.scheduledStartDate', 'ASC')
      .getMany();
  }
}
