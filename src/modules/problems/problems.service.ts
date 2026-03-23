import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Problem } from './entities/problem.entity';
import {
  CreateProblemDto,
  UpdateProblemDto,
  RegisterKnownErrorDto,
  ResolveProblemDto,
} from './dto/create-problem.dto';
import { PaginationDto } from '../../common/dto';
import { ProblemStatus } from '../../common/enums';
import { EVENTS } from '../../common/constants';
import { TicketNumberUtil, PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectRepository(Problem)
    private readonly problemRepository: Repository<Problem>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateProblemDto, currentUser: ICurrentUser): Promise<Problem> {
    const problem = this.problemRepository.create({
      ...dto,
      problemNumber: TicketNumberUtil.problem(),
      relatedIncidentIds: dto.relatedIncidentIds || [],
      affectedCiIds: dto.affectedCiIds || [],
      investigationNotes: [],
      attachments: [],
      tags: [],
      createdBy: currentUser.id,
    });

    const saved = await this.problemRepository.save(problem);
    this.eventEmitter.emit(EVENTS.PROBLEM.CREATED, { problemId: saved.id });
    return saved;
  }

  async findAll(query: PaginationDto & { status?: ProblemStatus; isKnownError?: boolean }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.problemRepository.createQueryBuilder('problem');

    if (search) {
      qb.andWhere('(problem.title ILIKE :search OR problem.problemNumber ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (query.status) qb.andWhere('problem.status = :status', { status: query.status });
    if (query.isKnownError !== undefined)
      qb.andWhere('problem.isKnownError = :isKnownError', { isKnownError: query.isKnownError });

    qb.orderBy(`problem.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<Problem> {
    const problem = await this.problemRepository.findOne({ where: { id } });
    if (!problem) throw new NotFoundException(`Vấn đề #${id} không tồn tại`);
    return problem;
  }

  async update(id: string, dto: UpdateProblemDto, currentUser: ICurrentUser): Promise<Problem> {
    const problem = await this.findOne(id);
    if ([ProblemStatus.CLOSED, ProblemStatus.CANCELLED].includes(problem.status)) {
      throw new BadRequestException('Không thể cập nhật vấn đề đã đóng');
    }

    Object.assign(problem, dto);
    problem.updatedBy = currentUser.id;

    if (dto.rootCause && !problem.rootCauseIdentifiedAt) {
      problem.rootCauseIdentifiedAt = new Date();
      problem.status = ProblemStatus.ROOT_CAUSE_IDENTIFIED;
    }

    const updated = await this.problemRepository.save(problem);
    this.eventEmitter.emit(EVENTS.PROBLEM.UPDATED, { problemId: id });
    return updated;
  }

  async registerKnownError(
    id: string,
    dto: RegisterKnownErrorDto,
    currentUser: ICurrentUser,
  ): Promise<Problem> {
    const problem = await this.findOne(id);

    problem.isKnownError = true;
    problem.knownErrorRegisteredAt = new Date();
    problem.errorDescription = dto.errorDescription;
    problem.workaround = dto.workaround;
    problem.permanentFix = dto.permanentFix;
    problem.status = ProblemStatus.KNOWN_ERROR;
    problem.updatedBy = currentUser.id;

    const updated = await this.problemRepository.save(problem);
    this.eventEmitter.emit(EVENTS.PROBLEM.KNOWN_ERROR_REGISTERED, {
      problemId: id,
      workaround: dto.workaround,
    });
    return updated;
  }

  async resolve(id: string, dto: ResolveProblemDto, currentUser: ICurrentUser): Promise<Problem> {
    const problem = await this.findOne(id);

    problem.status = ProblemStatus.RESOLVED;
    problem.resolution = dto.resolution;
    problem.rootCause = dto.rootCause || problem.rootCause;
    problem.relatedChangeId = dto.relatedChangeId;
    problem.resolvedAt = new Date();
    problem.resolvedBy = currentUser.id;
    problem.updatedBy = currentUser.id;

    const updated = await this.problemRepository.save(problem);
    this.eventEmitter.emit(EVENTS.PROBLEM.RESOLVED, { problemId: id });
    return updated;
  }

  async close(id: string, currentUser: ICurrentUser): Promise<Problem> {
    const problem = await this.findOne(id);
    if (problem.status !== ProblemStatus.RESOLVED) {
      throw new BadRequestException('Chỉ có thể đóng vấn đề đã được giải quyết');
    }

    problem.status = ProblemStatus.CLOSED;
    problem.closedAt = new Date();
    problem.updatedBy = currentUser.id;

    const updated = await this.problemRepository.save(problem);
    this.eventEmitter.emit(EVENTS.PROBLEM.CLOSED, { problemId: id });
    return updated;
  }

  async addInvestigationNote(
    id: string,
    content: string,
    currentUser: ICurrentUser,
  ): Promise<Problem> {
    const problem = await this.findOne(id);
    problem.investigationNotes = [
      ...problem.investigationNotes,
      { date: new Date(), author: currentUser.fullName, content },
    ];
    problem.updatedBy = currentUser.id;
    return this.problemRepository.save(problem);
  }

  async getKnownErrors(query: PaginationDto) {
    const { page = 1, limit = 20 } = query;
    const qb = this.problemRepository
      .createQueryBuilder('problem')
      .where('problem.isKnownError = true')
      .orderBy('problem.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }
}
