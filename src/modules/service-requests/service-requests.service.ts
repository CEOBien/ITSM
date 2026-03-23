import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ServiceRequest } from './entities/service-request.entity';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  ApproveRequestDto,
  FulfillRequestDto,
} from './dto/create-service-request.dto';
import { PaginationDto } from '../../common/dto';
import { RequestStatus } from '../../common/enums';
import { EVENTS } from '../../common/constants';
import { TicketNumberUtil, PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly requestRepository: Repository<ServiceRequest>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateServiceRequestDto, currentUser: ICurrentUser): Promise<ServiceRequest> {
    const request = this.requestRepository.create({
      ...dto,
      requestNumber: TicketNumberUtil.request(),
      requesterId: currentUser.id,
      requesterName: currentUser.fullName,
      requesterEmail: currentUser.email,
      approvals: [],
      attachments: [],
      tags: [],
      createdBy: currentUser.id,
    });

    const saved = await this.requestRepository.save(request);
    this.eventEmitter.emit(EVENTS.REQUEST.CREATED, {
      requestId: saved.id,
      requesterId: saved.requesterId,
    });
    return saved;
  }

  async findAll(query: PaginationDto & { status?: RequestStatus; requesterId?: string }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.requestRepository.createQueryBuilder('req');

    if (search) {
      qb.andWhere('(req.title ILIKE :search OR req.requestNumber ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (query.status) qb.andWhere('req.status = :status', { status: query.status });
    if (query.requesterId)
      qb.andWhere('req.requesterId = :requesterId', { requesterId: query.requesterId });

    qb.orderBy(`req.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<ServiceRequest> {
    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Yêu cầu dịch vụ #${id} không tồn tại`);
    return request;
  }

  async update(
    id: string,
    dto: UpdateServiceRequestDto,
    currentUser: ICurrentUser,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(id);
    const closedStatuses = [RequestStatus.FULFILLED, RequestStatus.CANCELLED, RequestStatus.CLOSED];
    if (closedStatuses.includes(request.status)) {
      throw new BadRequestException('Không thể cập nhật yêu cầu đã hoàn thành/hủy');
    }

    Object.assign(request, dto);
    request.updatedBy = currentUser.id;
    return this.requestRepository.save(request);
  }

  async approve(
    id: string,
    dto: ApproveRequestDto,
    currentUser: ICurrentUser,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Yêu cầu không ở trạng thái chờ duyệt');
    }

    const approval = request.approvals.find(a => a.approverId === currentUser.id);
    if (approval) {
      approval.status = dto.decision;
      approval.comment = dto.comment;
      approval.actionAt = new Date();
    } else {
      request.approvals.push({
        approverId: currentUser.id,
        approverName: currentUser.fullName,
        status: dto.decision,
        comment: dto.comment,
        actionAt: new Date(),
      });
    }

    request.status = dto.decision === 'approved' ? RequestStatus.APPROVED : RequestStatus.REJECTED;
    request.updatedBy = currentUser.id;

    const updated = await this.requestRepository.save(request);
    this.eventEmitter.emit(
      dto.decision === 'approved' ? EVENTS.REQUEST.APPROVED : EVENTS.REQUEST.REJECTED,
      { requestId: id },
    );
    return updated;
  }

  async fulfill(
    id: string,
    dto: FulfillRequestDto,
    currentUser: ICurrentUser,
  ): Promise<ServiceRequest> {
    const request = await this.findOne(id);
    const allowedStatuses = [
      RequestStatus.ASSIGNED,
      RequestStatus.IN_PROGRESS,
      RequestStatus.APPROVED,
    ];

    if (!allowedStatuses.includes(request.status)) {
      throw new BadRequestException('Yêu cầu chưa sẵn sàng để hoàn thành');
    }

    request.status = RequestStatus.FULFILLED;
    request.fulfillmentNotes = dto.fulfillmentNotes;
    request.fulfilledAt = new Date();
    request.fulfilledBy = currentUser.id;
    request.updatedBy = currentUser.id;

    const updated = await this.requestRepository.save(request);
    this.eventEmitter.emit(EVENTS.REQUEST.FULFILLED, { requestId: id });
    return updated;
  }

  async cancel(id: string, reason: string, currentUser: ICurrentUser): Promise<ServiceRequest> {
    const request = await this.findOne(id);
    const closedStatuses = [RequestStatus.FULFILLED, RequestStatus.CANCELLED, RequestStatus.CLOSED];

    if (closedStatuses.includes(request.status)) {
      throw new BadRequestException('Yêu cầu đã hoàn thành hoặc bị hủy');
    }

    request.status = RequestStatus.CANCELLED;
    request.cancelledReason = reason;
    request.updatedBy = currentUser.id;

    const updated = await this.requestRepository.save(request);
    this.eventEmitter.emit(EVENTS.REQUEST.CANCELLED, { requestId: id });
    return updated;
  }

  async getMyRequests(userId: string, query: PaginationDto) {
    return this.findAll({ ...query, requesterId: userId } as any);
  }
}
