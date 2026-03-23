import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationDto } from '../../common/dto';
import { PaginationUtil } from '../../common/utils';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  @OnEvent('audit.log')
  async handleAuditLog(data: Partial<AuditLog>): Promise<void> {
    try {
      const log = this.auditRepository.create(data);
      await this.auditRepository.save(log);
    } catch (error) {
      this.logger.error('Failed to save audit log', error);
    }
  }

  async log(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditRepository.create({ ...data, status: 'success' });
    return this.auditRepository.save(log);
  }

  async findAll(query: PaginationDto & { userId?: string; resource?: string; action?: string }) {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.auditRepository.createQueryBuilder('log');

    if (query.userId) qb.andWhere('log.userId = :userId', { userId: query.userId });
    if (query.resource) qb.andWhere('log.resource = :resource', { resource: query.resource });
    if (query.action) qb.andWhere('log.action = :action', { action: query.action });

    qb.orderBy(`log.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findByResource(resourceId: string, resource: string) {
    return this.auditRepository.find({
      where: { resourceId, resource },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
