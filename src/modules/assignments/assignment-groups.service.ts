import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentGroup } from './entities/assignment-group.entity';
import { AssignmentPractice } from '../../common/enums';

@Injectable()
export class AssignmentGroupsService {
  constructor(
    @InjectRepository(AssignmentGroup)
    private readonly repo: Repository<AssignmentGroup>,
  ) {}

  /** Danh sách nhóm đang hoạt động (dropdown form tạo sự cố, …) */
  async findActiveByPractice(practice: AssignmentPractice): Promise<AssignmentGroup[]> {
    return this.repo.find({
      where: { isActive: true, practice },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOneActive(id: string): Promise<AssignmentGroup> {
    const row = await this.repo.findOne({ where: { id, isActive: true } });
    if (!row) {
      throw new NotFoundException('Không tìm thấy nhóm giao việc hoặc nhóm đã vô hiệu');
    }
    return row;
  }
}
