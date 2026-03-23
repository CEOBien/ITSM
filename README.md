# 🏢 ITSM Platform - ITIL v4 Compliant

Hệ thống quản lý dịch vụ CNTT (IT Service Management) xây dựng theo chuẩn **ITIL v4** với **NestJS** và **Business Architecture**.

---

## 📋 Tính năng chính (ITIL v4 Management Practices)

| Module | ITIL Practice | Mô tả |
|--------|---------------|-------|
| 🚨 **Incidents** | Incident Management | Quản lý sự cố, escalation, SLA tracking |
| 🔍 **Problems** | Problem Management | RCA, Known Error Database (KEDB), 5 Whys |
| 🔄 **Changes** | Change Enablement | Normal/Standard/Emergency, CAB approval |
| 📋 **Service Requests** | Service Request Management | Catalog-based requests, approval workflow |
| 🗄️ **CMDB** | Service Configuration Management | CI lifecycle, relationships, impact analysis |
| 📊 **SLA** | Service Level Management | SLA/OLA/UC, business hours, escalation rules |
| 📚 **Knowledge** | Knowledge Management | KB articles, KEDB, workarounds |
| 🛒 **Catalog** | Service Catalogue Management | Self-service portal catalog |

---

## 🏗️ Business Architecture

```
src/
├── config/                    # App, DB, JWT, Redis, Mail configs
├── common/
│   ├── constants/             # ITIL constants, app constants
│   ├── enums/                 # Priority, Status, Role enums
│   ├── interfaces/            # API response, pagination interfaces
│   ├── entities/              # BaseEntity với audit fields
│   └── utils/                 # TicketNumber, Date (SLA), Priority Matrix
├── core/
│   ├── auth/                  # JWT + Local auth, strategies
│   ├── guards/                # JWT, Roles guards
│   ├── interceptors/          # Response, Logging, Audit
│   ├── filters/               # Global exception filter
│   └── decorators/            # Roles, CurrentUser, Public, ApiPaginated
├── modules/                   # Business Modules (ITIL Practices)
│   ├── users/                 # User management, RBAC
│   ├── incidents/             # 🚨 Incident Management
│   ├── problems/              # 🔍 Problem Management
│   ├── changes/               # 🔄 Change Enablement
│   ├── service-requests/      # 📋 Service Request Management
│   ├── cmdb/                  # 🗄️ Configuration Management DB
│   ├── sla/                   # 📊 Service Level Management
│   ├── knowledge/             # 📚 Knowledge Management
│   └── catalog/               # 🛒 Service Catalogue
└── shared/
    ├── audit/                 # Audit logging service
    ├── notification/          # Event-driven notifications
    └── workflow/              # Generic state machine engine
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### Installation

```bash
# Clone và cài đặt dependencies
npm install

# Copy env file
cp .env.example .env
# Chỉnh sửa .env theo môi trường của bạn

# Tạo database
createdb itsm_db

# Chạy migrations (nếu có)
npm run migration:run

# Seed dữ liệu ban đầu
npm run seed

# Chạy development
npm run start:dev
```

### Default Accounts (sau khi seed)

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `Admin@123456` | Super Admin |
| `admin` | `Admin@123456` | Admin |
| `servicedesk` | `Admin@123456` | Service Desk |
| `technician` | `Admin@123456` | Technician |
| `change.manager` | `Admin@123456` | Change Manager |
| `enduser` | `User@123456` | End User |

---

## 📖 API Documentation

Sau khi start server, truy cập Swagger UI tại:
```
http://localhost:3000/api/docs
```

---

## 🔑 ITIL v4 Key Concepts Implemented

### Priority Matrix (Impact x Urgency → Priority)
```
                 Urgency
                 Immediate | High  | Medium | Low
Impact Enterprise  P1        P1      P2      P2
       Department  P1        P2      P2      P3
       Group       P2        P3      P3      P4
       Individual  P3        P4      P4      P5
```

### SLA Targets (Default)
| Priority | Response | Resolution |
|----------|----------|------------|
| P1 Critical | 15 phút | 4 giờ |
| P2 High | 30 phút | 8 giờ |
| P3 Medium | 2 giờ | 1 ngày |
| P4 Low | 8 giờ | 3 ngày |
| P5 Planning | 1 ngày | 7 ngày |

### Change Types (ITIL Change Enablement)
- **Standard**: Pre-approved, low risk, repeatable → Auto-approved
- **Normal**: Full CAB review required → Submit → Review → CAB Approve → Implement
- **Emergency**: Urgent fix → Emergency CAB → Implement → Retrospective

### Incident Lifecycle
```
New → Assigned → In Progress → [Pending/On Hold] → Resolved → Closed
                                                  ↓
                                              Reopened
```

### Known Error Database (KEDB)
Problem Management tích hợp KEDB:
- Đăng ký Known Error với workaround
- Link từ Incident → Known Error để giải quyết nhanh
- Tự động gợi ý KB articles khi tạo Incident mới

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_DATABASE` | itsm_db | Database name |
| `JWT_SECRET` | (required) | JWT signing secret |
| `REDIS_HOST` | localhost | Redis host |
| `BUSINESS_HOURS_START` | 08:00 | Giờ bắt đầu làm việc |
| `BUSINESS_HOURS_END` | 17:30 | Giờ kết thúc làm việc |
| `BUSINESS_TIMEZONE` | Asia/Ho_Chi_Minh | Múi giờ |

---

## 👥 User Roles & Permissions

| Role | Description |
|------|-------------|
| `super_admin` | Toàn quyền hệ thống |
| `admin` | Quản trị viên IT |
| `service_desk` | Nhân viên Service Desk (L1) |
| `technician` | Kỹ thuật viên (L2/L3) |
| `change_manager` | Change Manager (CAB) |
| `problem_manager` | Problem Manager |
| `release_manager` | Release Manager |
| `asset_manager` | Quản lý tài sản/CMDB |
| `knowledge_manager` | Quản lý Knowledge Base |
| `approver` | Người phê duyệt |
| `end_user` | Người dùng cuối (self-service) |
| `report_viewer` | Xem báo cáo |

---

## 📊 Event-Driven Architecture

Hệ thống sử dụng NestJS EventEmitter cho kiến trúc event-driven:

```typescript
// Ví dụ: Khi incident được tạo
EVENTS.INCIDENT.CREATED   → Notification gửi email/push
EVENTS.INCIDENT.ESCALATED → Alert manager
EVENTS.INCIDENT.SLA_BREACHED → Escalation workflow
EVENTS.CHANGE.SUBMITTED   → Notify CAB members
EVENTS.USER.PASSWORD_RESET → Send reset email
```

---

## 🔒 Security Features

- **JWT Authentication** với access token + refresh token
- **RBAC** (Role-Based Access Control) với Guards
- **Rate Limiting** (Throttler)
- **Helmet** security headers
- **Audit Trail** - Ghi log toàn bộ thao tác
- **Soft Delete** - Không xóa dữ liệu thật
- **Optimistic Locking** - Version control cho entities
- **Account Lockout** - Khóa tài khoản sau 5 lần sai mật khẩu

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | ^10 | Framework |
| TypeORM | ^0.3 | ORM |
| PostgreSQL | ^14 | Database |
| Redis | ^6 | Cache, Queue |
| JWT | - | Authentication |
| Swagger | - | API Documentation |
| Bull | ^4 | Job Queue |
| Winston | ^3 | Logging |
| class-validator | ^0.14 | Validation |

---

## 📝 Contributing

1. Follow ITIL v4 naming conventions
2. Tất cả ticket types phải có ticket number (VD: INC-20240321-000001)
3. Mọi entity phải extend BaseEntity
4. Ghi audit log cho các thao tác quan trọng
5. Sử dụng EventEmitter cho side effects (notification, audit)

---

*Built with ❤️ for ITIL v4 compliance | NestJS + TypeORM + PostgreSQL*
