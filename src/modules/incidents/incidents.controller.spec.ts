import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard';
import { RolesGuard } from '@core/guards/roles.guard';
import { ROLES_KEY } from '@core/decorators/roles.decorator';
import { IncidentStatus, Priority, Impact, Urgency } from '../../common/enums';
import { ICurrentUser } from '../../common/interfaces';

/** Guard no-op: unit test gọi thẳng method controller, không qua HTTP — override để module compile */
const passGuard = { canActivate: jest.fn(() => true) };

describe('IncidentsController', () => {
  let controller: IncidentsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    getStats: jest.Mock;
    assign: jest.Mock;
  };

  const mockUser: ICurrentUser = {
    id: 'user-1',
    email: 'u@test.com',
    username: 'u',
    fullName: 'Test User',
    roles: ['service_desk'],
    permissions: ['incidents:create'],
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      getStats: jest.fn(),
      assign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [{ provide: IncidentsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(passGuard)
      .overrideGuard(RolesGuard)
      .useValue(passGuard)
      .compile();

    controller = module.get(IncidentsController);
  });

  it('create forwards dto và user tới service', async () => {
    const dto = { title: 'A', description: 'B', impact: Impact.INDIVIDUAL, urgency: Urgency.LOW };
    const saved = {
      id: 'inc-1',
      incidentNumber: 'INC-1',
      title: 'A',
      status: IncidentStatus.NEW,
      priority: Priority.LOW,
    };
    service.create.mockResolvedValue(saved);

    const result = await controller.create(dto as any, mockUser);

    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
    expect(result).toEqual(saved);
  });

  it('findAll forwards query', async () => {
    const paginated = {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    };
    service.findAll.mockResolvedValue(paginated);

    const q = { page: 2, limit: 10 } as any;
    await expect(controller.findAll(q)).resolves.toEqual(paginated);
    expect(service.findAll).toHaveBeenCalledWith(q);
  });

  it('assign forwards id, dto, user', async () => {
    const assigneeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service.assign.mockResolvedValue({ id: 'inc-1', assigneeId } as any);

    const dto = { assigneeId };
    const out = await controller.assign('inc-uuid' as any, dto, mockUser);

    expect(service.assign).toHaveBeenCalledWith('inc-uuid', dto, mockUser);
    expect(out.assigneeId).toBe(assigneeId);
  });
});

describe('IncidentsController — auth / roles metadata', () => {
  it('class có JwtAuthGuard + RolesGuard (HTTP thật sẽ chạy sau khi authenticate)', () => {
    const guards = Reflect.getMetadata('__guards__', IncidentsController) as Array<new (...args: any[]) => any>;
    expect(Array.isArray(guards)).toBe(true);
    expect(guards.map((g) => g.name)).toEqual(
      expect.arrayContaining(['JwtAuthGuard', 'RolesGuard']),
    );
  });

  it('getStats có @Roles giới hạn super_admin, admin, service_desk, technician', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, IncidentsController.prototype.getStats) as string[];
    expect(roles).toEqual(['super_admin', 'admin', 'service_desk', 'technician']);
  });

  it('assign có @Roles giới hạn super_admin, admin, service_desk', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, IncidentsController.prototype.assign) as string[];
    expect(roles).toEqual(['super_admin', 'admin', 'service_desk']);
  });
});
