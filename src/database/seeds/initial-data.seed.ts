import { DataSource, IsNull, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Sla } from '../../modules/sla/entities/sla.entity';
import { CatalogItem } from '../../modules/catalog/entities/catalog-item.entity';
import { Organization, OrgType, OrgLevel } from '../../modules/organizations/entities/organization.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Permission } from '../../modules/roles/entities/permission.entity';
import { UserRole as UserRoleEntity } from '../../modules/roles/entities/user-role.entity';
import { UserStatus } from '../../common/enums';

export async function runSeed(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding initial ITSM data...');

  await seedOrganizations(dataSource);
  await seedPermissions(dataSource);
  await seedRoles(dataSource);
  await seedUsers(dataSource);
  await seedSlas(dataSource);
  await seedCatalogItems(dataSource);

  console.log('✅ Seeding completed!');
}

// ─── Organizations ─────────────────────────────────────────────────────────

async function seedOrganizations(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Organization);

  const orgsData = [
    // Level 1 — Khối
    { code: 'KHOI-CNTT', name: 'Khối Công nghệ thông tin', type: OrgType.KHOI, level: OrgLevel.L1, sortOrder: 1 },
    { code: 'KHOI-KD', name: 'Khối Kinh doanh', type: OrgType.KHOI, level: OrgLevel.L1, sortOrder: 2 },
    { code: 'KHOI-HS', name: 'Khối Hỗ trợ', type: OrgType.KHOI, level: OrgLevel.L1, sortOrder: 3 },
    // Level 1 — Chi nhánh
    { code: 'CN-HN', name: 'Chi nhánh Hà Nội', type: OrgType.CHI_NHANH, level: OrgLevel.L1, sortOrder: 10 },
    { code: 'CN-HCM', name: 'Chi nhánh TP. Hồ Chí Minh', type: OrgType.CHI_NHANH, level: OrgLevel.L1, sortOrder: 11 },
    { code: 'CN-DN', name: 'Chi nhánh Đà Nẵng', type: OrgType.CHI_NHANH, level: OrgLevel.L1, sortOrder: 12 },
  ];

  const savedLevel1: Record<string, Organization> = {};
  for (const data of orgsData) {
    let org = await repo.findOne({ where: { code: data.code } });
    if (!org) {
      org = repo.create({ ...data, isActive: true });
      org = await repo.save(org);
      console.log(`  ✓ Org L1 created: ${data.code}`);
    }
    savedLevel1[data.code] = org;
  }

  // Level 2 — Trung tâm thuộc Khối
  const level2Data = [
    { code: 'TT-HT', name: 'Trung tâm Hạ tầng', type: OrgType.TRUNG_TAM, parentCode: 'KHOI-CNTT', sortOrder: 1 },
    { code: 'TT-UD', name: 'Trung tâm Ứng dụng', type: OrgType.TRUNG_TAM, parentCode: 'KHOI-CNTT', sortOrder: 2 },
    { code: 'TT-ATTT', name: 'Trung tâm An toàn thông tin', type: OrgType.TRUNG_TAM, parentCode: 'KHOI-CNTT', sortOrder: 3 },
    // Phòng thuộc Khối
    { code: 'P-KHCNTT', name: 'Phòng Kế hoạch CNTT', type: OrgType.PHONG, parentCode: 'KHOI-CNTT', sortOrder: 10 },
    { code: 'P-KHKD', name: 'Phòng Kế hoạch Kinh doanh', type: OrgType.PHONG, parentCode: 'KHOI-KD', sortOrder: 1 },
    { code: 'P-TCHC', name: 'Phòng Tổ chức Hành chính', type: OrgType.PHONG, parentCode: 'KHOI-HS', sortOrder: 1 },
    // Phòng thuộc Chi nhánh
    { code: 'P-CNHN-KD', name: 'Phòng Kinh doanh HN', type: OrgType.PHONG, parentCode: 'CN-HN', sortOrder: 1 },
    { code: 'P-CNHN-HT', name: 'Phòng Hỗ trợ KH HN', type: OrgType.PHONG, parentCode: 'CN-HN', sortOrder: 2 },
    { code: 'P-CNHCM-KD', name: 'Phòng Kinh doanh HCM', type: OrgType.PHONG, parentCode: 'CN-HCM', sortOrder: 1 },
    { code: 'P-CNDN-KD', name: 'Phòng Kinh doanh ĐN', type: OrgType.PHONG, parentCode: 'CN-DN', sortOrder: 1 },
  ];

  const savedLevel2: Record<string, Organization> = {};
  for (const data of level2Data) {
    let org = await repo.findOne({ where: { code: data.code } });
    if (!org) {
      const parent = savedLevel1[data.parentCode];
      const level = data.type === OrgType.TRUNG_TAM ? OrgLevel.L2 : OrgLevel.L2;
      org = repo.create({
        code: data.code,
        name: data.name,
        type: data.type,
        level,
        parentId: parent?.id,
        isActive: true,
        sortOrder: data.sortOrder,
      });
      org = await repo.save(org);
      console.log(`  ✓ Org L2 created: ${data.code}`);
    }
    savedLevel2[data.code] = org;
  }

  // Level 3 — Phòng thuộc Trung tâm
  const level3Data = [
    { code: 'P-HT-SERVER', name: 'Phòng Quản lý Server', type: OrgType.PHONG, parentCode: 'TT-HT', sortOrder: 1 },
    { code: 'P-HT-NETWORK', name: 'Phòng Mạng & Kết nối', type: OrgType.PHONG, parentCode: 'TT-HT', sortOrder: 2 },
    { code: 'P-HT-DC', name: 'Phòng Data Center', type: OrgType.PHONG, parentCode: 'TT-HT', sortOrder: 3 },
    { code: 'P-UD-DEV', name: 'Phòng Phát triển Ứng dụng', type: OrgType.PHONG, parentCode: 'TT-UD', sortOrder: 1 },
    { code: 'P-UD-TEST', name: 'Phòng Kiểm thử', type: OrgType.PHONG, parentCode: 'TT-UD', sortOrder: 2 },
    { code: 'P-UD-PM', name: 'Phòng Quản lý Dự án', type: OrgType.PHONG, parentCode: 'TT-UD', sortOrder: 3 },
    { code: 'P-ATTT-SOC', name: 'Phòng SOC', type: OrgType.PHONG, parentCode: 'TT-ATTT', sortOrder: 1 },
    { code: 'P-ATTT-GRC', name: 'Phòng GRC & Tuân thủ', type: OrgType.PHONG, parentCode: 'TT-ATTT', sortOrder: 2 },
  ];

  for (const data of level3Data) {
    let org = await repo.findOne({ where: { code: data.code } });
    if (!org) {
      const parent = savedLevel2[data.parentCode];
      org = repo.create({
        code: data.code,
        name: data.name,
        type: data.type,
        level: OrgLevel.L3,
        parentId: parent?.id,
        isActive: true,
        sortOrder: data.sortOrder,
      });
      await repo.save(org);
      console.log(`  ✓ Org L3 created: ${data.code}`);
    }
  }
}

// ─── Permissions ───────────────────────────────────────────────────────────

async function seedPermissions(dataSource: DataSource): Promise<Map<string, Permission>> {
  const repo = dataSource.getRepository(Permission);

  const permDefs: Array<{ resource: string; actions: string[]; group: string }> = [
    { resource: 'incidents', actions: ['create', 'read', 'update', 'delete', 'assign', 'close', 'manage'], group: 'Quản lý Sự cố' },
    { resource: 'problems', actions: ['create', 'read', 'update', 'delete', 'assign', 'manage'], group: 'Quản lý Vấn đề' },
    { resource: 'changes', actions: ['create', 'read', 'update', 'delete', 'approve', 'assign', 'manage'], group: 'Quản lý Thay đổi' },
    { resource: 'service_requests', actions: ['create', 'read', 'update', 'delete', 'approve', 'assign', 'manage'], group: 'Yêu cầu Dịch vụ' },
    { resource: 'cmdb', actions: ['create', 'read', 'update', 'delete', 'manage'], group: 'CMDB' },
    { resource: 'sla', actions: ['read', 'manage'], group: 'SLA' },
    { resource: 'knowledge', actions: ['create', 'read', 'update', 'delete', 'publish', 'manage'], group: 'Cơ sở tri thức' },
    { resource: 'catalog', actions: ['create', 'read', 'update', 'delete', 'manage'], group: 'Danh mục Dịch vụ' },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'], group: 'Quản lý Người dùng' },
    { resource: 'roles', actions: ['create', 'read', 'update', 'delete', 'manage'], group: 'Quản lý Vai trò' },
    { resource: 'organizations', actions: ['create', 'read', 'update', 'delete', 'manage'], group: 'Sơ đồ Tổ chức' },
    { resource: 'reports', actions: ['read', 'export', 'manage'], group: 'Báo cáo' },
    { resource: 'audit', actions: ['read'], group: 'Nhật ký Kiểm toán' },
    { resource: 'settings', actions: ['read', 'manage'], group: 'Cấu hình Hệ thống' },
  ];

  const permMap = new Map<string, Permission>();

  for (const def of permDefs) {
    for (const action of def.actions) {
      const code = `${def.resource}:${action}`;
      let perm = await repo.findOne({ where: { code } });
      if (!perm) {
        perm = repo.create({
          code,
          resource: def.resource,
          action,
          groupName: def.group,
          description: `${def.group} — ${action}`,
        });
        perm = await repo.save(perm);
        console.log(`  ✓ Permission created: ${code}`);
      }
      permMap.set(code, perm);
    }
  }

  return permMap;
}

// ─── Roles ─────────────────────────────────────────────────────────────────

async function seedRoles(dataSource: DataSource): Promise<void> {
  const roleRepo = dataSource.getRepository(Role);
  const permRepo = dataSource.getRepository(Permission);

  const getPerms = async (codes: string[]): Promise<Permission[]> => {
    const perms: Permission[] = [];
    for (const c of codes) {
      const p = await permRepo.findOne({ where: { code: c } });
      if (p) perms.push(p);
    }
    return perms;
  };

  const allPerms = await permRepo.find();
  const all = allPerms;

  const rolesDefs = [
    {
      code: 'super_admin',
      name: 'Super Administrator',
      description: 'Toàn quyền hệ thống',
      isSystem: true,
      perms: all,
    },
    {
      code: 'admin',
      name: 'Quản trị viên',
      description: 'Quản trị hệ thống ITSM, quản lý người dùng và cấu hình',
      isSystem: true,
      perms: await getPerms([
        'users:create','users:read','users:update','users:delete','users:manage',
        'roles:read','organizations:read','organizations:create','organizations:update',
        'incidents:manage','problems:manage','changes:manage','service_requests:manage',
        'cmdb:manage','sla:manage','knowledge:manage','catalog:manage',
        'reports:read','reports:export','audit:read','settings:manage',
      ]),
    },
    {
      code: 'service_desk',
      name: 'Service Desk',
      description: 'Tiếp nhận và xử lý sự cố, yêu cầu dịch vụ',
      isSystem: true,
      perms: await getPerms([
        'incidents:create','incidents:read','incidents:update','incidents:assign','incidents:close',
        'service_requests:create','service_requests:read','service_requests:update','service_requests:assign',
        'problems:read',
        'cmdb:read',
        'knowledge:read',
        'catalog:read',
        'users:read',
        'reports:read',
      ]),
    },
    {
      code: 'technician',
      name: 'Kỹ thuật viên',
      description: 'Xử lý kỹ thuật cho sự cố và vấn đề',
      isSystem: true,
      perms: await getPerms([
        'incidents:read','incidents:update','incidents:close',
        'problems:read','problems:update',
        'changes:read',
        'cmdb:read','cmdb:update',
        'knowledge:read','knowledge:create','knowledge:update',
        'service_requests:read','service_requests:update',
        'reports:read',
      ]),
    },
    {
      code: 'change_manager',
      name: 'Quản lý Thay đổi',
      description: 'Quản lý và phê duyệt các thay đổi hệ thống',
      isSystem: true,
      perms: await getPerms([
        'changes:create','changes:read','changes:update','changes:delete','changes:approve','changes:assign','changes:manage',
        'incidents:read','problems:read',
        'cmdb:read',
        'knowledge:read',
        'reports:read',
      ]),
    },
    {
      code: 'problem_manager',
      name: 'Quản lý Vấn đề',
      description: 'Phân tích nguyên nhân gốc và quản lý vấn đề',
      isSystem: true,
      perms: await getPerms([
        'problems:create','problems:read','problems:update','problems:delete','problems:assign','problems:manage',
        'incidents:read',
        'changes:read',
        'cmdb:read',
        'knowledge:create','knowledge:read','knowledge:update','knowledge:publish',
        'reports:read',
      ]),
    },
    {
      code: 'release_manager',
      name: 'Quản lý Phát hành',
      description: 'Lập kế hoạch và thực hiện phát hành',
      isSystem: true,
      perms: await getPerms([
        'changes:read','changes:update','changes:approve',
        'cmdb:read','cmdb:update',
        'incidents:read','problems:read',
        'knowledge:read',
        'reports:read',
      ]),
    },
    {
      code: 'asset_manager',
      name: 'Quản lý Tài sản',
      description: 'Quản lý CMDB và tài sản CNTT',
      isSystem: true,
      perms: await getPerms([
        'cmdb:create','cmdb:read','cmdb:update','cmdb:delete','cmdb:manage',
        'incidents:read','changes:read',
        'reports:read',
      ]),
    },
    {
      code: 'knowledge_manager',
      name: 'Quản lý Tri thức',
      description: 'Quản lý cơ sở tri thức',
      isSystem: true,
      perms: await getPerms([
        'knowledge:create','knowledge:read','knowledge:update','knowledge:delete','knowledge:publish','knowledge:manage',
        'incidents:read','problems:read',
        'reports:read',
      ]),
    },
    {
      code: 'approver',
      name: 'Người phê duyệt',
      description: 'Phê duyệt thay đổi và yêu cầu dịch vụ',
      isSystem: true,
      perms: await getPerms([
        'changes:read','changes:approve',
        'service_requests:read','service_requests:approve',
        'incidents:read',
        'reports:read',
      ]),
    },
    {
      code: 'end_user',
      name: 'Người dùng cuối',
      description: 'Người dùng tự phục vụ — tạo ticket và theo dõi',
      isSystem: true,
      perms: await getPerms([
        'incidents:create','incidents:read',
        'service_requests:create','service_requests:read',
        'knowledge:read',
        'catalog:read',
      ]),
    },
    {
      code: 'report_viewer',
      name: 'Người xem Báo cáo',
      description: 'Chỉ xem báo cáo và dashboard',
      isSystem: true,
      perms: await getPerms([
        'reports:read',
        'incidents:read','problems:read','changes:read',
        'sla:read',
      ]),
    },
  ];

  for (const def of rolesDefs) {
    let role = await roleRepo.findOne({ where: { code: def.code }, relations: ['permissions'] });
    if (!role) {
      role = roleRepo.create({
        code: def.code,
        name: def.name,
        description: def.description,
        isSystem: def.isSystem,
        isActive: true,
        permissions: def.perms,
      });
      await roleRepo.save(role);
      console.log(`  ✓ Role created: ${def.code} (${def.perms.length} permissions)`);
    }
  }
}

// ─── Users ─────────────────────────────────────────────────────────────────

async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const userRoleRepo = dataSource.getRepository(UserRoleEntity);
  const orgRepo = dataSource.getRepository(Organization);

  const itOrg = await orgRepo.findOne({ where: { code: 'KHOI-CNTT' } });

  const usersData = [
    { username: 'superadmin', email: 'superadmin@itsm.com', fullName: 'Super Administrator', password: 'Admin@123456', roleCode: 'super_admin', title: 'System Administrator', isVip: true },
    { username: 'admin', email: 'admin@itsm.com', fullName: 'System Admin', password: 'Admin@123456', roleCode: 'admin', title: 'IT Manager', isVip: false },
    { username: 'servicedesk', email: 'servicedesk@itsm.com', fullName: 'Service Desk Agent', password: 'Admin@123456', roleCode: 'service_desk', title: 'Service Desk Analyst', isVip: false },
    { username: 'technician', email: 'technician@itsm.com', fullName: 'IT Technician', password: 'Admin@123456', roleCode: 'technician', title: 'Senior IT Technician', isVip: false },
    { username: 'change.manager', email: 'changemanager@itsm.com', fullName: 'Change Manager', password: 'Admin@123456', roleCode: 'change_manager', title: 'IT Change Manager', isVip: false },
    { username: 'enduser', email: 'user@company.com', fullName: 'Nguyễn Văn End User', password: 'User@123456', roleCode: 'end_user', title: 'Nhân viên Kinh doanh', isVip: false },
  ];

  for (const data of usersData) {
    let existingUser = await userRepo.findOne({ where: { username: data.username } });

    if (!existingUser) {
      const userPayload: DeepPartial<User> = {
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: await bcrypt.hash(data.password, 12),
        status: UserStatus.ACTIVE,
        title: data.title,
        isVip: data.isVip,
        organizationId: itOrg?.id,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        failedLoginAttempts: 0,
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
      };
      existingUser = await userRepo.save(userRepo.create(userPayload));
      console.log(`  ✓ User created: ${data.username}`);
    }

    const role = await roleRepo.findOne({ where: { code: data.roleCode } });
    if (role) {
      const existingAssignment = await userRoleRepo.findOne({
        where: { userId: existingUser.id, roleId: role.id, organizationId: IsNull() },
      });
      if (!existingAssignment) {
        await userRoleRepo.save(
          userRoleRepo.create({ userId: existingUser.id, roleId: role.id }),
        );
        console.log(`  ✓ Role "${data.roleCode}" assigned to ${data.username}`);
      }
    }
  }
}

// ─── SLAs ──────────────────────────────────────────────────────────────────

async function seedSlas(dataSource: DataSource): Promise<void> {
  const slaRepo = dataSource.getRepository(Sla);

  const slas = [
    {
      name: 'Standard IT SLA',
      description: 'SLA tiêu chuẩn cho tất cả người dùng nội bộ',
      type: 'sla',
      appliesToTicketType: 'incident',
      isActive: true,
      businessHoursOnly: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '17:30',
      workingDays: [1, 2, 3, 4, 5],
      timezone: 'Asia/Ho_Chi_Minh',
      warningThresholdPercent: 75,
      targets: {
        critical: { responseTime: 15, resolutionTime: 240 },
        high: { responseTime: 30, resolutionTime: 480 },
        medium: { responseTime: 120, resolutionTime: 1440 },
        low: { responseTime: 480, resolutionTime: 4320 },
        planning: { responseTime: 1440, resolutionTime: 10080 },
      },
      escalationRules: [
        { atPercent: 50, action: 'notify_assignee' },
        { atPercent: 75, action: 'notify_supervisor' },
        { atPercent: 90, action: 'escalate_manager' },
      ],
    },
    {
      name: 'VIP User SLA',
      description: 'SLA ưu tiên cao cho người dùng VIP và Ban lãnh đạo',
      type: 'sla',
      appliesToTicketType: 'incident',
      isActive: true,
      businessHoursOnly: false,
      businessHoursStart: '07:00',
      businessHoursEnd: '22:00',
      workingDays: [1, 2, 3, 4, 5, 6],
      timezone: 'Asia/Ho_Chi_Minh',
      warningThresholdPercent: 60,
      targets: {
        critical: { responseTime: 5, resolutionTime: 60 },
        high: { responseTime: 15, resolutionTime: 240 },
        medium: { responseTime: 30, resolutionTime: 480 },
        low: { responseTime: 120, resolutionTime: 1440 },
        planning: { responseTime: 480, resolutionTime: 4320 },
      },
      escalationRules: [
        { atPercent: 40, action: 'notify_assignee' },
        { atPercent: 60, action: 'escalate_team_lead' },
        { atPercent: 80, action: 'escalate_manager' },
      ],
    },
    {
      name: 'Service Request SLA',
      description: 'SLA cho yêu cầu dịch vụ thông thường',
      type: 'sla',
      appliesToTicketType: 'request',
      isActive: true,
      businessHoursOnly: true,
      businessHoursStart: '08:00',
      businessHoursEnd: '17:30',
      workingDays: [1, 2, 3, 4, 5],
      timezone: 'Asia/Ho_Chi_Minh',
      warningThresholdPercent: 75,
      targets: {
        high: { responseTime: 60, resolutionTime: 480 },
        medium: { responseTime: 240, resolutionTime: 1440 },
        low: { responseTime: 480, resolutionTime: 4320 },
      },
      escalationRules: [],
    },
  ];

  for (const slaData of slas) {
    const existing = await slaRepo.findOne({ where: { name: slaData.name } });
    if (!existing) {
      const sla = slaRepo.create(slaData as DeepPartial<Sla>);
      await slaRepo.save(sla);
      console.log(`  ✓ SLA created: ${slaData.name}`);
    }
  }
}

// ─── Catalog Items ─────────────────────────────────────────────────────────

async function seedCatalogItems(dataSource: DataSource): Promise<void> {
  const catalogRepo = dataSource.getRepository(CatalogItem);

  const items = [
    {
      code: 'IT-ACCESS-001',
      name: 'Yêu cầu cấp quyền truy cập hệ thống',
      category: 'Access Management',
      shortDescription: 'Cấp/thu hồi quyền truy cập vào các hệ thống nội bộ',
      requiresApproval: true,
      slaResponseMinutes: 60,
      slaResolutionMinutes: 480,
      formFields: [
        { name: 'system', label: 'Hệ thống cần truy cập', type: 'select', required: true, options: ['ERP', 'CRM', 'HRM', 'Email', 'VPN', 'SharePoint', 'Database', 'Other'] },
        { name: 'accessLevel', label: 'Mức độ truy cập', type: 'select', required: true, options: ['Read', 'Write', 'Admin', 'Full'] },
        { name: 'justification', label: 'Lý do yêu cầu', type: 'textarea', required: true },
        { name: 'startDate', label: 'Ngày cần truy cập', type: 'date', required: true },
        { name: 'endDate', label: 'Ngày kết thúc (nếu tạm thời)', type: 'date', required: false },
      ],
      sortOrder: 1,
    },
    {
      code: 'IT-HARDWARE-001',
      name: 'Yêu cầu thiết bị IT',
      category: 'Hardware',
      shortDescription: 'Yêu cầu cấp phát hoặc thay thế thiết bị IT (laptop, máy tính, màn hình...)',
      requiresApproval: true,
      slaResponseMinutes: 240,
      slaResolutionMinutes: 2880,
      formFields: [
        { name: 'deviceType', label: 'Loại thiết bị', type: 'select', required: true, options: ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Headset', 'Webcam', 'Printer', 'Other'] },
        { name: 'reason', label: 'Lý do yêu cầu', type: 'select', required: true, options: ['New staff', 'Replacement (damaged)', 'Upgrade', 'Additional need', 'Other'] },
        { name: 'urgency', label: 'Mức độ khẩn cấp', type: 'select', required: true, options: ['Urgent (today)', 'High (1-2 days)', 'Normal (1 week)', 'Low (flexible)'] },
        { name: 'specification', label: 'Yêu cầu kỹ thuật', type: 'textarea', required: false },
      ],
      sortOrder: 2,
    },
    {
      code: 'IT-SOFTWARE-001',
      name: 'Cài đặt phần mềm',
      category: 'Software',
      shortDescription: 'Yêu cầu cài đặt, nâng cấp phần mềm trên máy tính',
      requiresApproval: false,
      slaResponseMinutes: 120,
      slaResolutionMinutes: 480,
      formFields: [
        { name: 'softwareName', label: 'Tên phần mềm', type: 'text', required: true },
        { name: 'version', label: 'Phiên bản (nếu có)', type: 'text', required: false },
        { name: 'computerName', label: 'Tên máy tính / IP', type: 'text', required: true },
        { name: 'reason', label: 'Lý do cần cài', type: 'textarea', required: true },
        { name: 'hasLicense', label: 'Đã có license?', type: 'boolean', required: true },
      ],
      sortOrder: 3,
    },
    {
      code: 'IT-ACCOUNT-001',
      name: 'Tạo tài khoản mới / Onboarding',
      category: 'Account Management',
      shortDescription: 'Tạo tài khoản hệ thống cho nhân viên mới',
      requiresApproval: true,
      slaResponseMinutes: 60,
      slaResolutionMinutes: 1440,
      formFields: [
        { name: 'fullName', label: 'Họ và tên', type: 'text', required: true },
        { name: 'email', label: 'Email công ty', type: 'text', required: true },
        { name: 'department', label: 'Phòng ban', type: 'text', required: true },
        { name: 'position', label: 'Chức vụ', type: 'text', required: true },
        { name: 'startDate', label: 'Ngày bắt đầu làm việc', type: 'date', required: true },
        { name: 'systemsNeeded', label: 'Hệ thống cần truy cập', type: 'multiselect', required: true, options: ['Active Directory', 'Email', 'ERP', 'CRM', 'VPN', 'SharePoint', 'HRM'] },
        { name: 'managerId', label: 'Email quản lý trực tiếp', type: 'text', required: true },
      ],
      sortOrder: 4,
    },
    {
      code: 'IT-NETWORK-001',
      name: 'Yêu cầu kết nối mạng / VPN',
      category: 'Network',
      shortDescription: 'Hỗ trợ kết nối mạng, VPN, WiFi',
      requiresApproval: false,
      slaResponseMinutes: 60,
      slaResolutionMinutes: 240,
      formFields: [
        { name: 'issueType', label: 'Loại vấn đề', type: 'select', required: true, options: ['Cannot connect to VPN', 'WiFi issue', 'Slow internet', 'Network drive not accessible', 'Port forwarding request', 'Other'] },
        { name: 'location', label: 'Vị trí', type: 'text', required: true },
        { name: 'description', label: 'Mô tả chi tiết', type: 'textarea', required: true },
      ],
      sortOrder: 5,
    },
  ];

  for (const itemData of items) {
    const existing = await catalogRepo.findOne({ where: { code: itemData.code } });
    if (!existing) {
      const item = catalogRepo.create({
        ...itemData,
        isActive: true,
        isVisibleToUsers: true,
        requestCount: 0,
        knowledgeArticleIds: [],
        tags: [],
        currency: 'VND',
      } as DeepPartial<CatalogItem>);
      await catalogRepo.save(item);
      console.log(`  ✓ Catalog item created: ${itemData.code} - ${itemData.name}`);
    }
  }
}
