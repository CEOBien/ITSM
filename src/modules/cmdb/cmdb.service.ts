import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigurationItem } from './entities/configuration-item.entity';
import { CreateCiDto, UpdateCiDto, AddRelationshipDto } from './dto/create-ci.dto';
import { PaginationDto } from '../../common/dto';
import { CiStatus } from '../../common/enums';
import { PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

@Injectable()
export class CmdbService {
  private ciCounter = 0;

  constructor(
    @InjectRepository(ConfigurationItem)
    private readonly ciRepository: Repository<ConfigurationItem>,
  ) {}

  async create(dto: CreateCiDto, currentUser: ICurrentUser): Promise<ConfigurationItem> {
    const ciNumber = await this.generateCiNumber(dto.type);

    const ci = this.ciRepository.create({
      ...dto,
      ciNumber,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
      relationships: [],
      serviceIds: [],
      tags: dto.tags || [],
      currency: 'VND',
      createdBy: currentUser.id,
    });

    return this.ciRepository.save(ci);
  }

  async findAll(
    query: PaginationDto & {
      type?: string;
      status?: CiStatus;
      ownerId?: string;
      environment?: string;
    },
  ) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.ciRepository.createQueryBuilder('ci');

    if (search) {
      qb.andWhere(
        '(ci.name ILIKE :search OR ci.ciNumber ILIKE :search OR ci.hostname ILIKE :search OR ci.ipAddress ILIKE :search OR ci.serialNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (query.type) qb.andWhere('ci.type = :type', { type: query.type });
    if (query.status) qb.andWhere('ci.status = :status', { status: query.status });
    if (query.ownerId) qb.andWhere('ci.ownerId = :ownerId', { ownerId: query.ownerId });
    if (query.environment)
      qb.andWhere('ci.environment = :environment', { environment: query.environment });

    qb.orderBy(`ci.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<ConfigurationItem> {
    const ci = await this.ciRepository.findOne({ where: { id } });
    if (!ci) throw new NotFoundException(`CI #${id} không tồn tại`);
    return ci;
  }

  async findByCiNumber(ciNumber: string): Promise<ConfigurationItem> {
    const ci = await this.ciRepository.findOne({ where: { ciNumber } });
    if (!ci) throw new NotFoundException(`CI ${ciNumber} không tồn tại`);
    return ci;
  }

  async update(
    id: string,
    dto: UpdateCiDto,
    currentUser: ICurrentUser,
  ): Promise<ConfigurationItem> {
    const ci = await this.findOne(id);
    Object.assign(ci, dto);
    ci.updatedBy = currentUser.id;
    return this.ciRepository.save(ci);
  }

  async addRelationship(
    id: string,
    dto: AddRelationshipDto,
    currentUser: ICurrentUser,
  ): Promise<ConfigurationItem> {
    const ci = await this.findOne(id);
    await this.findOne(dto.relatedCiId);

    const exists = ci.relationships.some(
      r => r.relatedCiId === dto.relatedCiId && r.relationshipType === dto.relationshipType,
    );
    if (exists) throw new ConflictException('Mối quan hệ này đã tồn tại');

    ci.relationships = [...ci.relationships, dto];
    ci.updatedBy = currentUser.id;
    return this.ciRepository.save(ci);
  }

  async removeRelationship(
    id: string,
    relatedCiId: string,
    currentUser: ICurrentUser,
  ): Promise<ConfigurationItem> {
    const ci = await this.findOne(id);
    ci.relationships = ci.relationships.filter(r => r.relatedCiId !== relatedCiId);
    ci.updatedBy = currentUser.id;
    return this.ciRepository.save(ci);
  }

  async getImpactedCis(ciId: string): Promise<ConfigurationItem[]> {
    const ci = await this.findOne(ciId);
    const upstreamIds = ci.relationships
      .filter(r => r.direction === 'upstream')
      .map(r => r.relatedCiId);

    if (upstreamIds.length === 0) return [];
    return this.ciRepository.findBy(upstreamIds.map(id => ({ id })));
  }

  async retire(id: string, currentUser: ICurrentUser): Promise<ConfigurationItem> {
    const ci = await this.findOne(id);
    ci.status = CiStatus.RETIRED;
    ci.updatedBy = currentUser.id;
    return this.ciRepository.save(ci);
  }

  async getStats() {
    const byType = await this.ciRepository
      .createQueryBuilder('ci')
      .select('ci.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ci.type')
      .getRawMany();

    const byStatus = await this.ciRepository
      .createQueryBuilder('ci')
      .select('ci.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ci.status')
      .getRawMany();

    const total = await this.ciRepository.count();
    const expiringWarranty = await this.ciRepository
      .createQueryBuilder('ci')
      .where("ci.warrantyExpiry BETWEEN NOW() AND NOW() + INTERVAL '30 days'")
      .getCount();

    return { total, byType, byStatus, expiringWarranty };
  }

  private async generateCiNumber(type: string): Promise<string> {
    const prefix = type.substring(0, 3).toUpperCase();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.ciCounter++;
    return `${prefix}-${today}-${String(this.ciCounter).padStart(6, '0')}`;
  }
}
