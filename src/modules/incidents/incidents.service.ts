import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Incident } from './entities/incident.entity';
import {
  CreateIncidentDto,
  UpdateIncidentDto,
  ResolveIncidentDto,
  AssignIncidentDto,
  EscalateIncidentDto,
  IncidentFilterDto,
} from './dto/create-incident.dto';
import { PaginationDto } from '../../common/dto';
import { IncidentStatus, Priority, SlaStatus } from '../../common/enums';
import { EVENTS } from '../../common/constants';
import { TicketNumberUtil, PaginationUtil, DateUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';
import { PRIORITY_MATRIX } from '../../common/enums/priority.enum';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateIncidentDto, currentUser: ICurrentUser): Promise<Incident> {
    const incidentNumber = TicketNumberUtil.incident();

    // Tính priority từ impact x urgency matrix
    const priority =
      dto.impact && dto.urgency ? PRIORITY_MATRIX[dto.impact][dto.urgency] : Priority.MEDIUM;

    // Tính SLA deadline dựa theo priority
    const now = new Date();
    const responseDeadline = DateUtil.calculateSlaDeadline(priority, now, 'response');
    const resolutionDeadline = DateUtil.calculateSlaDeadline(priority, now, 'resolution');

    const incident = this.incidentRepository.create({
      ...dto,
      incidentNumber,
      priority,
      reporterId: currentUser.id,
      reporterName: currentUser.fullName,
      reporterEmail: currentUser.email,
      responseDeadline,
      resolutionDeadline,
      createdBy: currentUser.id,
      affectedCiIds: dto.affectedCiIds || [],
      tags: dto.tags || [],
      attachments: [],
    });

    const saved = await this.incidentRepository.save(incident);

    this.eventEmitter.emit(EVENTS.INCIDENT.CREATED, {
      incidentId: saved.id,
      incidentNumber: saved.incidentNumber,
      priority: saved.priority,
      reporterId: saved.reporterId,
      assigneeId: saved.assigneeId,
    });

    return saved;
  }

  async findAll(query: PaginationDto & IncidentFilterDto) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      status,
      priority,
      assigneeId,
      reporterId,
      category,
      startDate,
      endDate,
      slaBreached,
      isMajorIncident,
    } = query;

    const qb = this.incidentRepository.createQueryBuilder('incident');

    if (search) {
      qb.andWhere(
        '(incident.title ILIKE :search OR incident.incidentNumber ILIKE :search OR incident.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      qb.andWhere('incident.status IN (:...statuses)', { statuses });
    }

    if (priority) {
      const priorities = Array.isArray(priority) ? priority : [priority];
      qb.andWhere('incident.priority IN (:...priorities)', { priorities });
    }

    if (assigneeId) qb.andWhere('incident.assigneeId = :assigneeId', { assigneeId });
    if (reporterId) qb.andWhere('incident.reporterId = :reporterId', { reporterId });
    if (category) qb.andWhere('incident.category = :category', { category });

    if (startDate)
      qb.andWhere('incident.createdAt >= :startDate', { startDate: new Date(startDate) });
    if (endDate) qb.andWhere('incident.createdAt <= :endDate', { endDate: new Date(endDate) });

    if (slaBreached)
      qb.andWhere('incident.slaStatus = :slaStatus', { slaStatus: SlaStatus.BREACHED });
    if (isMajorIncident !== undefined)
      qb.andWhere('incident.isMajorIncident = :isMajorIncident', { isMajorIncident });

    qb.orderBy(`incident.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException(`Sự cố #${id} không tồn tại`);
    return incident;
  }

  async findByNumber(incidentNumber: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { incidentNumber } });
    if (!incident) throw new NotFoundException(`Sự cố ${incidentNumber} không tồn tại`);
    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto, currentUser: ICurrentUser): Promise<Incident> {
    const incident = await this.findOne(id);

    if ([IncidentStatus.CLOSED, IncidentStatus.CANCELLED].includes(incident.status)) {
      throw new BadRequestException('Không thể cập nhật sự cố đã đóng hoặc hủy');
    }

    const oldStatus = incident.status;

    // Recalculate priority if impact/urgency changed
    if (dto.impact || dto.urgency) {
      const impact = dto.impact || incident.impact;
      const urgency = dto.urgency || incident.urgency;
      (dto as any).priority = PRIORITY_MATRIX[impact][urgency];
    }

    Object.assign(incident, dto);
    incident.updatedBy = currentUser.id;

    const updated = await this.incidentRepository.save(incident);

    this.eventEmitter.emit(EVENTS.INCIDENT.UPDATED, {
      incidentId: id,
      oldStatus,
      newStatus: dto.status,
      updatedBy: currentUser.id,
    });

    return updated;
  }

  async assign(id: string, dto: AssignIncidentDto, currentUser: ICurrentUser): Promise<Incident> {
    const incident = await this.findOne(id);

    incident.assigneeId = dto.assigneeId;
    incident.assigneeGroupId = dto.assigneeGroupId;

    if (incident.status === IncidentStatus.NEW) {
      incident.status = IncidentStatus.ASSIGNED;
    }

    if (!incident.firstResponseAt) {
      incident.firstResponseAt = new Date();
    }

    incident.updatedBy = currentUser.id;
    const updated = await this.incidentRepository.save(incident);

    this.eventEmitter.emit(EVENTS.INCIDENT.ASSIGNED, {
      incidentId: id,
      assigneeId: dto.assigneeId,
      assignedBy: currentUser.id,
      note: dto.note,
    });

    return updated;
  }

  async escalate(
    id: string,
    dto: EscalateIncidentDto,
    currentUser: ICurrentUser,
  ): Promise<Incident> {
    const incident = await this.findOne(id);

    if (incident.escalationLevel >= 4) {
      throw new BadRequestException('Sự cố đã ở mức leo thang cao nhất (L4)');
    }

    incident.escalationLevel += 1;
    incident.escalatedAt = new Date();
    incident.escalatedTo = dto.escalateTo;
    incident.updatedBy = currentUser.id;

    const updated = await this.incidentRepository.save(incident);

    this.eventEmitter.emit(EVENTS.INCIDENT.ESCALATED, {
      incidentId: id,
      level: incident.escalationLevel,
      reason: dto.reason,
      escalatedBy: currentUser.id,
    });

    return updated;
  }

  async resolve(id: string, dto: ResolveIncidentDto, currentUser: ICurrentUser): Promise<Incident> {
    const incident = await this.findOne(id);

    if ([IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(incident.status)) {
      throw new BadRequestException('Sự cố đã được giải quyết hoặc đóng');
    }

    incident.status = IncidentStatus.RESOLVED;
    incident.resolution = dto.resolution;
    incident.rootCause = dto.rootCause;
    incident.closureCode = dto.closureCode;
    incident.knowledgeArticleId = dto.knowledgeArticleId;
    incident.resolvedAt = new Date();
    incident.resolvedBy = currentUser.id;
    incident.slaStatus = incident.isBreachingSla ? SlaStatus.BREACHED : SlaStatus.COMPLETED;
    incident.updatedBy = currentUser.id;

    const updated = await this.incidentRepository.save(incident);

    this.eventEmitter.emit(EVENTS.INCIDENT.RESOLVED, {
      incidentId: id,
      resolvedBy: currentUser.id,
      resolution: dto.resolution,
    });

    return updated;
  }

  async close(id: string, currentUser: ICurrentUser): Promise<Incident> {
    const incident = await this.findOne(id);

    if (incident.status !== IncidentStatus.RESOLVED) {
      throw new BadRequestException('Chỉ có thể đóng sự cố đã được giải quyết');
    }

    incident.status = IncidentStatus.CLOSED;
    incident.closedAt = new Date();
    incident.closedBy = currentUser.id;
    incident.updatedBy = currentUser.id;

    const updated = await this.incidentRepository.save(incident);
    this.eventEmitter.emit(EVENTS.INCIDENT.CLOSED, { incidentId: id });
    return updated;
  }

  async reopen(id: string, reason: string, currentUser: ICurrentUser): Promise<Incident> {
    const incident = await this.findOne(id);

    if (![IncidentStatus.RESOLVED, IncidentStatus.CLOSED].includes(incident.status)) {
      throw new BadRequestException('Chỉ có thể mở lại sự cố đã giải quyết hoặc đóng');
    }

    incident.status = IncidentStatus.REOPENED;
    incident.resolution = null;
    incident.resolvedAt = null;
    incident.resolvedBy = null;
    incident.updatedBy = currentUser.id;

    return this.incidentRepository.save(incident);
  }

  async getStats(filters?: { startDate?: Date; endDate?: Date }) {
    const qb = this.incidentRepository.createQueryBuilder('incident');

    if (filters?.startDate)
      qb.andWhere('incident.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters?.endDate)
      qb.andWhere('incident.createdAt <= :endDate', { endDate: filters.endDate });

    const [total, byStatus, byPriority, slaBreached, majorIncidents] = await Promise.all([
      qb.clone().getCount(),
      qb
        .clone()
        .select('incident.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('incident.status')
        .getRawMany(),
      qb
        .clone()
        .select('incident.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .groupBy('incident.priority')
        .getRawMany(),
      qb
        .clone()
        .andWhere('incident.slaStatus = :slaStatus', { slaStatus: SlaStatus.BREACHED })
        .getCount(),
      qb.clone().andWhere('incident.isMajorIncident = true').getCount(),
    ]);

    return { total, byStatus, byPriority, slaBreached, majorIncidents };
  }

  async getDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [open, todayCreated, slaWarning, slaBreached, unassigned, critical] = await Promise.all([
      this.incidentRepository.count({
        where: {
          status: In([IncidentStatus.NEW, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS]),
        },
      }),
      this.incidentRepository.count({ where: { createdAt: Between(today, now) } as any }),
      this.incidentRepository.count({ where: { slaStatus: SlaStatus.WARNING } }),
      this.incidentRepository.count({ where: { slaStatus: SlaStatus.BREACHED } }),
      this.incidentRepository.count({
        where: {
          assigneeId: IsNull(),
          status: In([IncidentStatus.NEW, IncidentStatus.REOPENED]),
        } as any,
      }),
      this.incidentRepository.count({
        where: {
          priority: Priority.CRITICAL,
          status: In([IncidentStatus.NEW, IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS]),
        },
      }),
    ]);

    return { open, todayCreated, slaWarning, slaBreached, unassigned, critical };
  }
}
