import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeArticle } from './entities/knowledge-article.entity';
import { PaginationDto } from '../../common/dto';
import { KnowledgeStatus } from '../../common/enums';
import { PaginationUtil } from '../../common/utils';
import { ICurrentUser } from '../../common/interfaces';

export interface CreateArticleDto {
  title: string;
  content: string;
  summary?: string;
  type?: string;
  category?: string;
  subcategory?: string;
  service?: string;
  visibility?: string;
  tags?: string[];
  keywords?: string[];
  expiryDate?: string;
  reviewDate?: string;
}

@Injectable()
export class KnowledgeService {
  private articleCounter = 0;

  constructor(
    @InjectRepository(KnowledgeArticle)
    private readonly articleRepository: Repository<KnowledgeArticle>,
  ) {}

  async create(dto: CreateArticleDto, currentUser: ICurrentUser): Promise<KnowledgeArticle> {
    const articleNumber = `KB-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(++this.articleCounter).padStart(6, '0')}`;

    const article = this.articleRepository.create({
      ...dto,
      articleNumber,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : undefined,
      relatedArticleIds: [],
      relatedIncidentIds: [],
      tags: dto.tags || [],
      keywords: dto.keywords || [],
      attachments: [],
      createdBy: currentUser.id,
    });

    return this.articleRepository.save(article);
  }

  async findAll(
    query: PaginationDto & {
      status?: KnowledgeStatus;
      category?: string;
      type?: string;
      visibility?: string;
    },
  ) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    const qb = this.articleRepository.createQueryBuilder('article');

    if (search) {
      qb.andWhere(
        '(article.title ILIKE :search OR article.summary ILIKE :search OR article.articleNumber ILIKE :search OR :searchExact = ANY(article.keywords))',
        { search: `%${search}%`, searchExact: search },
      );
    }
    if (query.status) qb.andWhere('article.status = :status', { status: query.status });
    if (query.category) qb.andWhere('article.category = :category', { category: query.category });
    if (query.type) qb.andWhere('article.type = :type', { type: query.type });
    if (query.visibility)
      qb.andWhere('article.visibility = :visibility', { visibility: query.visibility });

    qb.orderBy(`article.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    const [data, total] = await qb.getManyAndCount();
    return PaginationUtil.paginate(data, total, page, limit);
  }

  async findOne(id: string): Promise<KnowledgeArticle> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException(`Bài viết #${id} không tồn tại`);
    return article;
  }

  async search(keyword: string, limit = 10): Promise<KnowledgeArticle[]> {
    return this.articleRepository
      .createQueryBuilder('article')
      .where('article.status = :status', { status: KnowledgeStatus.PUBLISHED })
      .andWhere(
        '(article.title ILIKE :kw OR article.summary ILIKE :kw OR article.content ILIKE :kw OR :kwExact = ANY(article.keywords) OR :kwExact = ANY(article.tags))',
        { kw: `%${keyword}%`, kwExact: keyword },
      )
      .orderBy('article.useCount', 'DESC')
      .addOrderBy('article.viewCount', 'DESC')
      .limit(limit)
      .getMany();
  }

  async update(
    id: string,
    dto: Partial<CreateArticleDto>,
    currentUser: ICurrentUser,
  ): Promise<KnowledgeArticle> {
    const article = await this.findOne(id);
    if ([KnowledgeStatus.ARCHIVED, KnowledgeStatus.DEPRECATED].includes(article.status)) {
      throw new BadRequestException('Không thể chỉnh sửa bài viết đã archive');
    }

    Object.assign(article, dto);
    article.status = KnowledgeStatus.DRAFT;
    article.updatedBy = currentUser.id;
    return this.articleRepository.save(article);
  }

  async submitForReview(id: string, currentUser: ICurrentUser): Promise<KnowledgeArticle> {
    const article = await this.findOne(id);
    article.status = KnowledgeStatus.REVIEW;
    article.updatedBy = currentUser.id;
    return this.articleRepository.save(article);
  }

  async publish(id: string, currentUser: ICurrentUser): Promise<KnowledgeArticle> {
    const article = await this.findOne(id);
    if (![KnowledgeStatus.REVIEW, KnowledgeStatus.DRAFT].includes(article.status)) {
      throw new BadRequestException('Bài viết phải ở trạng thái Draft hoặc Review để xuất bản');
    }

    article.status = KnowledgeStatus.PUBLISHED;
    article.publishedAt = new Date();
    article.publishedBy = currentUser.id;
    article.reviewerId = currentUser.id;
    article.reviewedAt = new Date();
    article.updatedBy = currentUser.id;

    return this.articleRepository.save(article);
  }

  async archive(id: string, currentUser: ICurrentUser): Promise<KnowledgeArticle> {
    const article = await this.findOne(id);
    article.status = KnowledgeStatus.ARCHIVED;
    article.archivedAt = new Date();
    article.updatedBy = currentUser.id;
    return this.articleRepository.save(article);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.articleRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementUseCount(id: string): Promise<void> {
    await this.articleRepository.increment({ id }, 'useCount', 1);
  }

  async rateHelpful(id: string, isHelpful: boolean): Promise<void> {
    if (isHelpful) {
      await this.articleRepository.increment({ id }, 'helpfulCount', 1);
    } else {
      await this.articleRepository.increment({ id }, 'notHelpfulCount', 1);
    }
  }

  async getFeatured(limit = 5): Promise<KnowledgeArticle[]> {
    return this.articleRepository.find({
      where: { isFeatured: true, status: KnowledgeStatus.PUBLISHED },
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }

  async getPopular(limit = 10): Promise<KnowledgeArticle[]> {
    return this.articleRepository.find({
      where: { status: KnowledgeStatus.PUBLISHED },
      order: { useCount: 'DESC', viewCount: 'DESC' },
      take: limit,
    });
  }
}
