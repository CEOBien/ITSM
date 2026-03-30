import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident } from './entities/incident.entity';
import { IncidentStatus, Priority, Impact, Urgency, SlaStatus, AssignmentPractice } from '../../common/enums';
import { AssignmentGroup } from '../assignments/entities/assignment-group.entity';
import { EVENTS } from '../../common/constants';
import { ICurrentUser } from '../../common/interfaces';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { SEED_INCIDENT_REFERENCE } from '../../database/seeds/seed-reference-uuids';

const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const INCIDENT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ASSIGNEE_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const mockUser: ICurrentUser = {
  id: USER_ID,
  email: 'agent@itsm.com',
  username: 'agent',
  fullName: 'Agent User',
  roles: ['service_desk'],
  permissions: ['incidents:create', 'incidents:read'],
};

function baseIncident(overrides: Partial<Incident> = {}): Incident {
  const inc = {
    id: INCIDENT_ID,
    version: 1,
    createdAt: new Date('2026-01-01T08:00:00Z'),
    updatedAt: new Date('2026-01-01T08:00:00Z'),
    incidentNumber: 'INC-20260101-000001',
    title: 'Title',
    description: 'Description',
    status: IncidentStatus.NEW,
    priority: Priority.MEDIUM,
    impact: Impact.INDIVIDUAL,
    urgency: Urgency.MEDIUM,
    reporterId: USER_ID,
    escalationLevel: 1,
    slaStatus: SlaStatus.ACTIVE,
    slaPausedDuration: 0,
    affectedCiIds: [] as string[],
    tags: [] as string[],
    attachments: [] as Array<{ name: string; url: string; size: number; type: string }>,
    source: 'portal',
    isMajorIncident: false,
    responseDeadline: new Date('2026-01-02T08:00:00Z'),
    resolutionDeadline: new Date('2026-01-03T08:00:00Z'),
    ...overrides,
  } as Incident;
  return inc;
}

describe('IncidentsService', () => {
  let service: IncidentsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    count: jest.Mock;
  };
  let eventEmitter: { emit: jest.Mock };
  let assignmentGroupRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    assignmentGroupRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: SEED_INCIDENT_REFERENCE.ASSIGNMENT_GROUP_ID,
        isActive: true,
        practice: AssignmentPractice.INCIDENTS,
      } as AssignmentGroup),
    };
    repo = {
      create: jest.fn((x: any) => ({ ...x })),
      save: jest.fn((x: any) => Promise.resolve({ ...x, id: x.id || INCIDENT_ID })),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: getRepositoryToken(Incident), useValue: repo },
        { provide: getRepositoryToken(AssignmentGroup), useValue: assignmentGroupRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(IncidentsService);
  });

  describe('create', () => {
    it('maps reporter từ currentUser, emit INCIDENT.CREATED', async () => {
      const dto: CreateIncidentDto = {
        title: 'Mất mạng',
        description: 'Toàn floor 3',
        impact: Impact.DEPARTMENT,
        urgency: Urgency.HIGH,
        assigneeId: SEED_INCIDENT_REFERENCE.ASSIGNEE_USER_ID,
        assigneeGroupId: SEED_INCIDENT_REFERENCE.ASSIGNMENT_GROUP_ID,
        affectedCiIds: [SEED_INCIDENT_REFERENCE.CI_ERP_SERVER_ID],
      };
      repo.save.mockImplementation((x) => Promise.resolve({ ...x, id: INCIDENT_ID }));

      const result = await service.create(dto, mockUser);

      expect(repo.create).toHaveBeenCalled();
      const createdArg = (repo.create as jest.Mock).mock.calls[0][0];
      expect(createdArg.reporterId).toBe(USER_ID);
      expect(createdArg.reporterName).toBe(mockUser.fullName);
      expect(createdArg.reporterEmail).toBe(mockUser.email);
      expect(createdArg.createdBy).toBe(USER_ID);
      expect(createdArg.incidentNumber).toMatch(/^INC-/);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENTS.INCIDENT.CREATED,
        expect.objectContaining({ incidentId: INCIDENT_ID }),
      );
      expect(result.id).toBe(INCIDENT_ID);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException khi không có bản ghi', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(INCIDENT_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns incident khi tồn tại', async () => {
      const inc = baseIncident();
      repo.findOne.mockResolvedValue(inc);
      await expect(service.findOne(INCIDENT_ID)).resolves.toEqual(inc);
    });
  });

  describe('update', () => {
    it('throws BadRequestException khi đã closed', async () => {
      repo.findOne.mockResolvedValue(baseIncident({ status: IncidentStatus.CLOSED }));
      await expect(
        service.update(INCIDENT_ID, { title: 'x' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('emit UPDATED khi thành công', async () => {
      const inc = baseIncident({ status: IncidentStatus.NEW });
      repo.findOne.mockResolvedValue(inc);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      await service.update(INCIDENT_ID, { title: 'Updated' }, mockUser);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENTS.INCIDENT.UPDATED,
        expect.objectContaining({ incidentId: INCIDENT_ID, updatedBy: USER_ID }),
      );
      expect(repo.save).toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('chuyển NEW -> ASSIGNED và emit ASSIGNED', async () => {
      const inc = baseIncident({ status: IncidentStatus.NEW });
      repo.findOne.mockResolvedValue(inc);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      await service.assign(
        INCIDENT_ID,
        { assigneeId: ASSIGNEE_ID, note: 'L1 assign' },
        mockUser,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assigneeId: ASSIGNEE_ID,
          status: IncidentStatus.ASSIGNED,
          updatedBy: USER_ID,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENTS.INCIDENT.ASSIGNED,
        expect.objectContaining({ assigneeId: ASSIGNEE_ID, assignedBy: USER_ID }),
      );
    });
  });

  describe('escalate', () => {
    it('throws khi escalationLevel >= 4', async () => {
      repo.findOne.mockResolvedValue(baseIncident({ escalationLevel: 4 }));
      await expect(
        service.escalate(INCIDENT_ID, { reason: 'test' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('tăng level và emit ESCALATED', async () => {
      const inc = baseIncident({ escalationLevel: 2 });
      repo.findOne.mockResolvedValue(inc);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      await service.escalate(
        INCIDENT_ID,
        { reason: 'Cần L3', escalateTo: ASSIGNEE_ID },
        mockUser,
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          escalationLevel: 3,
          escalatedTo: ASSIGNEE_ID,
          updatedBy: USER_ID,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        EVENTS.INCIDENT.ESCALATED,
        expect.objectContaining({ incidentId: INCIDENT_ID, escalatedBy: USER_ID }),
      );
    });
  });

  describe('resolve / close / reopen', () => {
    it('resolve throws khi đã RESOLVED', async () => {
      repo.findOne.mockResolvedValue(baseIncident({ status: IncidentStatus.RESOLVED }));
      await expect(
        service.resolve(INCIDENT_ID, { resolution: 'ok' }, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('close throws khi chưa RESOLVED', async () => {
      repo.findOne.mockResolvedValue(baseIncident({ status: IncidentStatus.NEW }));
      await expect(service.close(INCIDENT_ID, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('close thành công khi RESOLVED', async () => {
      const inc = baseIncident({ status: IncidentStatus.RESOLVED });
      repo.findOne.mockResolvedValue(inc);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      await service.close(INCIDENT_ID, mockUser);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: IncidentStatus.CLOSED,
          closedBy: USER_ID,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(EVENTS.INCIDENT.CLOSED, {
        incidentId: INCIDENT_ID,
      });
    });

    it('reopen throws khi đang NEW', async () => {
      repo.findOne.mockResolvedValue(baseIncident({ status: IncidentStatus.NEW }));
      await expect(service.reopen(INCIDENT_ID, 'sai sót', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('dùng query builder và PaginationUtil', async () => {
      const inc = baseIncident();
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[inc], 1]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 20 } as any);

      expect(repo.createQueryBuilder).toHaveBeenCalledWith('incident');
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getDashboard', () => {
    it('gọi count 6 lần và trả object dashboard', async () => {
      repo.count.mockResolvedValue(7);

      const result = await service.getDashboard();

      expect(repo.count).toHaveBeenCalledTimes(6);
      expect(result.open).toBe(7);
      expect(result.critical).toBe(7);
    });
  });
});
