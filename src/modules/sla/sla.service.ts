import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sla } from './entities/sla.entity';
import { PaginationDto } from '../../common/dto';
import { Priority } from '../../common/enums';
import { PaginationUtil, DateUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

export interface CreateSlaDto {
  name: string;
  description?: string;
  type?: string;
  appliesToTicketType?: string;
  targets?: Record<string, { responseTime: number; resolutionTime: number }>;
  businessHoursOnly?: boolean;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  warningThresholdPercent?: number;
  escalationRules?: any[];
  effectiveFrom?: string;
  effectiveTo?: string;
}

@Injectable()
export class SlaService {
  constructor(
    @InjectRepository(Sla)
    private readonly slaRepository: Repository<Sla>,
  ) {}

  async create(dto: CreateSlaDto, currentUser: ICurrentUser): Promise<Sla> {
    const sla = this.slaRepository.create({
      ...dto,
      effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      createdBy: currentUser.id,
    });
    return this.slaRepository.save(sla);
  }

  async findAll(query: PaginationDto & { type?: string; isActive?: boolean }) {
    const { page = 1, limit = 20, search } = query;
    const qb = this.slaRepository.createQueryBuilder('sla');

    if (search) qb.andWhere('sla.name ILIKE :search', { search: `%${search}%` });
    if (query.type) qb.andWhere('sla.type = :type', { type: query.type });
    if (query.isActive !== undefined)
      qb.andWhere('sla.isActive = :isActive', { isActive: query.isActive });

    qb.orderBy('sla.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Sla> {
    const sla = await this.slaRepository.findOne({ where: { id } });
    if (!sla) throw new NotFoundException(`SLA #${id} không tồn tại`);
    return sla;
  }

  async findActive(ticketType = 'incident'): Promise<Sla[]> {
    return this.slaRepository.find({
      where: [
        { isActive: true, appliesToTicketType: ticketType },
        { isActive: true, appliesToTicketType: 'all' },
      ],
      order: { name: 'ASC' },
    });
  }

  async update(id: string, dto: Partial<CreateSlaDto>, currentUser: ICurrentUser): Promise<Sla> {
    const sla = await this.findOne(id);
    Object.assign(sla, dto);
    sla.updatedBy = currentUser.id;
    return this.slaRepository.save(sla);
  }

  async toggleActive(id: string, currentUser: ICurrentUser): Promise<Sla> {
    const sla = await this.findOne(id);
    sla.isActive = !sla.isActive;
    sla.updatedBy = currentUser.id;
    return this.slaRepository.save(sla);
  }

  /**
   * Calculate SLA deadline for a ticket based on SLA configuration
   */
  async calculateDeadline(
    slaId: string,
    priority: Priority,
    startDate: Date,
  ): Promise<{
    responseDeadline: Date;
    resolutionDeadline: Date;
  }> {
    const sla = await this.findOne(slaId);
    const target = sla.targets[priority] || sla.targets.medium;

    return {
      responseDeadline: DateUtil.addBusinessMinutes(startDate, target.responseTime),
      resolutionDeadline: DateUtil.addBusinessMinutes(startDate, target.resolutionTime),
    };
  }

  /**
   * Get SLA performance report
   */
  async getPerformanceReport(slaId: string, startDate: Date, endDate: Date) {
    const sla = await this.findOne(slaId);
    return {
      sla,
      period: { startDate, endDate },
      metrics: {
        message: 'Tính năng báo cáo SLA chi tiết sẽ được tích hợp với module Incidents/Requests',
      },
    };
  }
}
