import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogItem } from './entities/catalog-item.entity';
import { PaginationDto } from '../../common/dto';
import { PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

export interface CreateCatalogItemDto {
  code: string;
  name: string;
  category: string;
  shortDescription?: string;
  description?: string;
  subcategory?: string;
  requiresApproval?: boolean;
  fulfillmentGroupId?: string;
  slaResponseMinutes?: number;
  slaResolutionMinutes?: number;
  formFields?: any[];
  cost?: number;
  tags?: string[];
  sortOrder?: number;
}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CatalogItem)
    private readonly catalogRepository: Repository<CatalogItem>,
  ) {}

  async create(dto: CreateCatalogItemDto, currentUser: ICurrentUser): Promise<CatalogItem> {
    const existing = await this.catalogRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Mã dịch vụ ${dto.code} đã tồn tại`);

    const item = this.catalogRepository.create({
      ...dto,
      formFields: dto.formFields || [],
      knowledgeArticleIds: [],
      tags: dto.tags || [],
      currency: 'VND',
      createdBy: currentUser.id,
    });

    return this.catalogRepository.save(item);
  }

  async findAll(
    query: PaginationDto & { category?: string; isActive?: boolean; isVisibleToUsers?: boolean },
  ) {
    const { page = 1, limit = 20, search, sortBy = 'sortOrder', sortOrder = 'ASC' } = query;
    const qb = this.catalogRepository.createQueryBuilder('item');

    if (search) {
      qb.andWhere(
        '(item.name ILIKE :search OR item.code ILIKE :search OR item.shortDescription ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (query.category) qb.andWhere('item.category = :category', { category: query.category });
    if (query.isActive !== undefined)
      qb.andWhere('item.isActive = :isActive', { isActive: query.isActive });
    if (query.isVisibleToUsers !== undefined) {
      qb.andWhere('item.isVisibleToUsers = :visible', { visible: query.isVisibleToUsers });
    }

    qb.orderBy(`item.${sortBy}`, sortOrder)
      .addOrderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<CatalogItem> {
    const item = await this.catalogRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Dịch vụ #${id} không tồn tại`);
    return item;
  }

  async findByCode(code: string): Promise<CatalogItem> {
    const item = await this.catalogRepository.findOne({ where: { code } });
    if (!item) throw new NotFoundException(`Dịch vụ ${code} không tồn tại`);
    return item;
  }

  async getCategories(): Promise<string[]> {
    const result = await this.catalogRepository
      .createQueryBuilder('item')
      .select('DISTINCT item.category', 'category')
      .where('item.isActive = true')
      .orderBy('item.category')
      .getRawMany();
    return result.map(r => r.category);
  }

  async update(
    id: string,
    dto: Partial<CreateCatalogItemDto>,
    currentUser: ICurrentUser,
  ): Promise<CatalogItem> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    item.updatedBy = currentUser.id;
    return this.catalogRepository.save(item);
  }

  async toggleActive(id: string, currentUser: ICurrentUser): Promise<CatalogItem> {
    const item = await this.findOne(id);
    item.isActive = !item.isActive;
    item.updatedBy = currentUser.id;
    return this.catalogRepository.save(item);
  }

  async incrementRequestCount(id: string): Promise<void> {
    await this.catalogRepository.increment({ id }, 'requestCount', 1);
  }

  async getPopular(limit = 10): Promise<CatalogItem[]> {
    return this.catalogRepository.find({
      where: { isActive: true, isVisibleToUsers: true },
      order: { requestCount: 'DESC' },
      take: limit,
    });
  }
}
