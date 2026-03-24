import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Organization, OrgType, OrgLevel } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const existing = await this.orgRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Mã đơn vị "${dto.code}" đã tồn tại`);
    }

    let parentType: OrgType | undefined;
    let parent: Organization | undefined;

    if (dto.parentId) {
      parent = await this.orgRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException(`Đơn vị cấp cha không tồn tại`);
      parentType = parent.type;
      this.validateParentChild(dto.type, parent.type);
    } else {
      this.validateRootType(dto.type);
    }

    const level = Organization.computeLevel(dto.type, parentType);

    const org = this.orgRepo.create({
      ...dto,
      level,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return this.orgRepo.save(org);
  }

  async findAll(includeInactive = false): Promise<Organization[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.orgRepo.find({
      where,
      relations: ['parent', 'children'],
      order: { level: 'ASC', sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findTree(): Promise<Organization[]> {
    const roots = await this.orgRepo.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children', 'children.children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return roots;
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!org) throw new NotFoundException(`Đơn vị tổ chức không tồn tại`);
    return org;
  }

  async findByType(type: OrgType): Promise<Organization[]> {
    return this.orgRepo.find({
      where: { type, isActive: true },
      relations: ['parent'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findOne(id);

    if (dto.code && dto.code !== org.code) {
      const duplicate = await this.orgRepo.findOne({ where: { code: dto.code } });
      if (duplicate) throw new ConflictException(`Mã đơn vị "${dto.code}" đã tồn tại`);
    }

    let newLevel: OrgLevel = org.level;
    if (dto.parentId !== undefined || dto.type !== undefined) {
      const newType = dto.type ?? org.type;
      let newParentType: OrgType | undefined;

      if (dto.parentId) {
        const newParent = await this.orgRepo.findOne({ where: { id: dto.parentId } });
        if (!newParent) throw new NotFoundException(`Đơn vị cấp cha không tồn tại`);
        newParentType = newParent.type;
        this.validateParentChild(newType, newParent.type);
      } else if (dto.parentId === null) {
        this.validateRootType(newType);
      }

      newLevel = Organization.computeLevel(newType, newParentType);
    }

    Object.assign(org, dto, { level: newLevel });
    return this.orgRepo.save(org);
  }

  async remove(id: string): Promise<void> {
    const org = await this.findOne(id);
    const childCount = await this.orgRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException(
        `Không thể xóa đơn vị đang có ${childCount} đơn vị con. Hãy xóa hoặc chuyển các đơn vị con trước.`,
      );
    }
    await this.orgRepo.softRemove(org);
  }

  private validateParentChild(childType: OrgType, parentType: OrgType): void {
    const allowed: Partial<Record<OrgType, OrgType[]>> = {
      [OrgType.TRUNG_TAM]: [OrgType.KHOI],
      [OrgType.PHONG]: [OrgType.KHOI, OrgType.CHI_NHANH, OrgType.TRUNG_TAM],
    };

    if (childType === OrgType.KHOI || childType === OrgType.CHI_NHANH) {
      throw new BadRequestException(`Khối và Chi nhánh không được có đơn vị cấp cha`);
    }

    const allowedParents = allowed[childType] ?? [];
    if (!allowedParents.includes(parentType)) {
      throw new BadRequestException(
        `Loại đơn vị "${childType}" không thể là con của "${parentType}"`,
      );
    }
  }

  private validateRootType(type: OrgType): void {
    if (type !== OrgType.KHOI && type !== OrgType.CHI_NHANH) {
      throw new BadRequestException(
        `Đơn vị cấp gốc (không có cấp cha) chỉ được là Khối hoặc Chi nhánh`,
      );
    }
  }
}
