import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/users/entities/user.entity';
import { Sla } from '../../modules/sla/entities/sla.entity';
import { CatalogItem } from '../../modules/catalog/entities/catalog-item.entity';
import { UserRole, UserStatus } from '../../common/enums';

/**
 * Initial Data Seed - ITSM System Bootstrap Data
 * Tạo dữ liệu ban đầu: Admin user, SLA mặc định, Catalog items mẫu
 */
export async function runSeed(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding initial ITSM data...');

  await seedUsers(dataSource);
  await seedSlas(dataSource);
  await seedCatalogItems(dataSource);

  console.log('✅ Seeding completed!');
}

async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);

  const users = [
    {
      username: 'superadmin',
      email: 'superadmin@itsm.com',
      fullName: 'Super Administrator',
      password: await bcrypt.hash('Admin@123456', 12),
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      title: 'System Administrator',
    },
    {
      username: 'admin',
      email: 'admin@itsm.com',
      fullName: 'System Admin',
      password: await bcrypt.hash('Admin@123456', 12),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      title: 'IT Manager',
    },
    {
      username: 'servicedesk',
      email: 'servicedesk@itsm.com',
      fullName: 'Service Desk Agent',
      password: await bcrypt.hash('Admin@123456', 12),
      role: UserRole.SERVICE_DESK,
      status: UserStatus.ACTIVE,
      title: 'Service Desk Analyst',
    },
    {
      username: 'technician',
      email: 'technician@itsm.com',
      fullName: 'IT Technician',
      password: await bcrypt.hash('Admin@123456', 12),
      role: UserRole.TECHNICIAN,
      status: UserStatus.ACTIVE,
      title: 'Senior IT Technician',
    },
    {
      username: 'change.manager',
      email: 'changemanager@itsm.com',
      fullName: 'Change Manager',
      password: await bcrypt.hash('Admin@123456', 12),
      role: UserRole.CHANGE_MANAGER,
      status: UserStatus.ACTIVE,
      title: 'IT Change Manager',
    },
    {
      username: 'enduser',
      email: 'user@company.com',
      fullName: 'Nguyễn Văn End User',
      password: await bcrypt.hash('User@123456', 12),
      role: UserRole.END_USER,
      status: UserStatus.ACTIVE,
      title: 'Nhân viên Kinh doanh',
    },
  ];

  for (const userData of users) {
    const existing = await userRepo.findOne({ where: { username: userData.username } });
    if (!existing) {
      const user = userRepo.create({
        ...userData,
        notificationEmail: true,
        notificationPush: true,
        notificationSms: false,
        failedLoginAttempts: 0,
        isVip: userData.role === UserRole.SUPER_ADMIN,
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
      } as any);
      await userRepo.save(user);
      console.log(`  ✓ User created: ${userData.username} (${userData.role})`);
    }
  }
}

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
      const sla = slaRepo.create(slaData as any);
      await slaRepo.save(sla);
      console.log(`  ✓ SLA created: ${slaData.name}`);
    }
  }
}

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
        {
          name: 'system',
          label: 'Hệ thống cần truy cập',
          type: 'select',
          required: true,
          options: ['ERP', 'CRM', 'HRM', 'Email', 'VPN', 'SharePoint', 'Database', 'Other'],
        },
        {
          name: 'accessLevel',
          label: 'Mức độ truy cập',
          type: 'select',
          required: true,
          options: ['Read', 'Write', 'Admin', 'Full'],
        },
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
      shortDescription:
        'Yêu cầu cấp phát hoặc thay thế thiết bị IT (laptop, máy tính, màn hình...)',
      requiresApproval: true,
      slaResponseMinutes: 240,
      slaResolutionMinutes: 2880,
      formFields: [
        {
          name: 'deviceType',
          label: 'Loại thiết bị',
          type: 'select',
          required: true,
          options: [
            'Laptop',
            'Desktop',
            'Monitor',
            'Keyboard',
            'Mouse',
            'Headset',
            'Webcam',
            'Printer',
            'Other',
          ],
        },
        {
          name: 'reason',
          label: 'Lý do yêu cầu',
          type: 'select',
          required: true,
          options: ['New staff', 'Replacement (damaged)', 'Upgrade', 'Additional need', 'Other'],
        },
        {
          name: 'urgency',
          label: 'Mức độ khẩn cấp',
          type: 'select',
          required: true,
          options: ['Urgent (today)', 'High (1-2 days)', 'Normal (1 week)', 'Low (flexible)'],
        },
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
        {
          name: 'systemsNeeded',
          label: 'Hệ thống cần truy cập',
          type: 'multiselect',
          required: true,
          options: ['Active Directory', 'Email', 'ERP', 'CRM', 'VPN', 'SharePoint', 'HRM'],
        },
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
        {
          name: 'issueType',
          label: 'Loại vấn đề',
          type: 'select',
          required: true,
          options: [
            'Cannot connect to VPN',
            'WiFi issue',
            'Slow internet',
            'Network drive not accessible',
            'Port forwarding request',
            'Other',
          ],
        },
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
      } as any);
      await catalogRepo.save(item);
      console.log(`  ✓ Catalog item created: ${itemData.code} - ${itemData.name}`);
    }
  }
}
