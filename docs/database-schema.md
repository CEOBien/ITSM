# ITSM ITIL v4 — Tài liệu Database Schema

> **Phiên bản:** 1.1 | **Cập nhật:** 2026-03-29
> Tài liệu mô tả toàn bộ bảng, trường dữ liệu, quan hệ và ví dụ sử dụng trong hệ thống ITSM.

---

## Mục lục

1. [BaseEntity — Nền chung](#1-baseentity--nền-chung)
2. [users — Người dùng](#2-users--người-dùng)
3. [organizations — Sơ đồ tổ chức](#3-organizations--sơ-đồ-tổ-chức)
4. [roles — Vai trò](#4-roles--vai-trò)
5. [permissions — Quyền hạn](#5-permissions--quyền-hạn)
6. [user_roles — Phân quyền người dùng](#6-user_roles--phân-quyền-người-dùng)
7. [incidents — Sự cố](#7-incidents--sự-cố)
8. [problems — Vấn đề](#8-problems--vấn-đề)
9. [changes — Thay đổi](#9-changes--thay-đổi)
10. [service_requests — Yêu cầu dịch vụ](#10-service_requests--yêu-cầu-dịch-vụ)
11. [configuration_items — CMDB](#11-configuration_items--cmdb)
12. [slas — Thỏa thuận mức dịch vụ](#12-slas--thỏa-thuận-mức-dịch-vụ)
13. [knowledge_articles — Cơ sở tri thức](#13-knowledge_articles--cơ-sở-tri-thức)
14. [catalog_items — Danh mục dịch vụ](#14-catalog_items--danh-mục-dịch-vụ)
15. [system_metrics — Giám sát server](#15-system_metrics--giám-sát-server)
16. [Object locking — Khóa chỉnh sửa đồng thời](#16-object-locking--khóa-chỉnh-sửa-đồng-thời)
17. [Enum Reference](#17-enum-reference)
18. [Sơ đồ quan hệ](#18-sơ-đồ-quan-hệ)

---

## 1. BaseEntity — Nền chung

Tất cả entity (trừ `user_roles`, `system_metrics`) đều extend `BaseEntity`. Các trường sau được cấp **miễn phí**:

| Trường TS | Cột DB | Kiểu | Mô tả |
|---|---|---|---|
| `id` | `id` | `uuid` PK | Khóa chính, tự sinh UUID v4 |
| `createdAt` | `created_at` | `timestamptz` | Thời điểm tạo, tự set |
| `updatedAt` | `updated_at` | `timestamptz` | Thời điểm sửa cuối, tự set |
| `deletedAt` | `deleted_at` | `timestamptz` nullable | Soft delete — set khi "xóa", không xóa thật |
| `createdBy` | `created_by` | `uuid` nullable | ID người tạo |
| `updatedBy` | `updated_by` | `uuid` nullable | ID người sửa cuối |
| `version` | `version` | `int` | Optimistic locking — tăng mỗi lần UPDATE |

> **Quy tắc:** Không bao giờ xóa record thật. `softDelete()` chỉ set `deleted_at`. TypeORM tự filter `WHERE deleted_at IS NULL`.

---

## 2. users — Người dùng

**Entity:** `User` | **Bảng:** `users`

### Trường dữ liệu

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `employeeId` | `employee_id` | `varchar` | ❌ | — | Mã nhân viên (index unique sparse) |
| `username` | `username` | `varchar` | ✅ | — | Tên đăng nhập, duy nhất |
| `email` | `email` | `varchar` | ✅ | — | Email, duy nhất |
| `fullName` | `full_name` | `varchar` | ✅ | — | Họ và tên |
| `firstName` | `first_name` | `varchar` | ❌ | — | Tên |
| `lastName` | `last_name` | `varchar` | ❌ | — | Họ |
| `password` | `password` | `varchar` | ✅ | — | Bcrypt hash, không select mặc định |
| `status` | `status` | `enum` | ✅ | `active` | Trạng thái tài khoản |
| `phone` | `phone` | `varchar` | ❌ | — | Điện thoại |
| `mobile` | `mobile` | `varchar` | ❌ | — | Di động |
| `avatar` | `avatar` | `varchar` | ❌ | — | URL avatar |
| `title` | `title` | `varchar` | ❌ | — | Chức danh (VD: "Kỹ sư IT Senior") |
| `organizationId` | `organization_id` | `uuid` FK | ❌ | — | Đơn vị tổ chức |
| `location` | `location` | `varchar` | ❌ | — | Địa điểm làm việc |
| `timezone` | `timezone` | `varchar` | ✅ | `Asia/Ho_Chi_Minh` | Múi giờ |
| `language` | `language` | `varchar` | ✅ | `vi` | Ngôn ngữ giao diện |
| `isVip` | `is_vip` | `boolean` | ✅ | `false` | User VIP — ưu tiên SLA cao hơn |
| `lastLoginAt` | `last_login_at` | `timestamptz` | ❌ | — | Lần đăng nhập cuối |
| `failedLoginAttempts` | `failed_login_attempts` | `int` | ✅ | `0` | Đếm login sai, ≥5 → LOCKED |
| `passwordChangedAt` | `password_changed_at` | `timestamptz` | ❌ | — | Lần đổi mật khẩu cuối |
| `passwordResetToken` | `password_reset_token` | `varchar` | ❌ | — | Token reset, không select |
| `passwordResetExpiry` | `password_reset_expiry` | `timestamptz` | ❌ | — | Hạn token reset |
| `notificationEmail` | `notification_email` | `boolean` | ✅ | `true` | Nhận thông báo email |
| `notificationSms` | `notification_sms` | `boolean` | ✅ | `false` | Nhận thông báo SMS |
| `notificationPush` | `notification_push` | `boolean` | ✅ | `true` | Nhận push notification |
| `managerId` | `manager_id` | `uuid` | ❌ | — | ID quản lý trực tiếp |
| `metadata` | `metadata` | `jsonb` | ❌ | — | Thông tin mở rộng tuỳ ý |

### Enum: UserStatus
```
active              → Hoạt động bình thường
inactive            → Ngừng hoạt động
suspended           → Tạm dừng
pending_activation  → Chờ kích hoạt
locked              → Bị khóa (sai mật khẩu ≥5 lần)
```

### Quan hệ
- `ManyToOne → organizations` (qua `organization_id`)
- `OneToMany → user_roles`

### Methods
```typescript
isActive()       → true nếu status === 'active'
isLocked()       → true nếu status === 'locked'
isAdmin()        → true nếu có role 'admin' hoặc 'super_admin'
hasRoleCode(...) → kiểm tra user có trong danh sách role codes
getDisplayName() → fullName ?? username
```

### Ví dụ JSON
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "nguyen.van.a",
  "email": "nguyen.van.a@company.com",
  "fullName": "Nguyễn Văn A",
  "title": "Kỹ sư IT Senior",
  "status": "active",
  "organizationId": "...",
  "isVip": false,
  "timezone": "Asia/Ho_Chi_Minh",
  "language": "vi"
}
```

---

## 3. organizations — Sơ đồ tổ chức

**Entity:** `Organization` | **Bảng:** `organizations`

### Cấu trúc 3 cấp

```
Level 1: Khối (khoi)          └── Ví dụ: Khối CNTT, Khối Kinh doanh
         Chi nhánh (chi_nhanh) └── Ví dụ: Chi nhánh Hà Nội

Level 2: Trung tâm (trung_tam) └── Con của Khối
         Phòng (phong)         └── Con của Khối hoặc Chi nhánh

Level 3: Phòng (phong)         └── Con của Trung tâm
```

### Trường dữ liệu

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `code` | `code` | `varchar` unique | ✅ | — | Mã đơn vị (VD: `KHOI-CNTT`) |
| `name` | `name` | `varchar` | ✅ | — | Tên đơn vị |
| `type` | `type` | `enum` | ✅ | — | `khoi` / `chi_nhanh` / `trung_tam` / `phong` |
| `level` | `level` | `int` | ✅ | — | Cấp tổ chức: 1, 2, hoặc 3 (tự tính) |
| `parentId` | `parent_id` | `uuid` FK self | ❌ | — | ID đơn vị cấp cha |
| `description` | `description` | `text` | ❌ | — | Mô tả |
| `phone` | `phone` | `varchar` | ❌ | — | Điện thoại |
| `address` | `address` | `varchar` | ❌ | — | Địa chỉ |
| `isActive` | `is_active` | `boolean` | ✅ | `true` | Đang hoạt động |
| `sortOrder` | `sort_order` | `int` | ✅ | `0` | Thứ tự hiển thị |

### Quan hệ
- `ManyToOne → organizations` (self: `parent`)
- `OneToMany → organizations` (self: `children`)

### Logic tính `level`
```
khoi, chi_nhanh            → level = 1
trung_tam (parent=khoi)    → level = 2
phong (parent=khoi/cn)     → level = 2
phong (parent=trung_tam)   → level = 3
```

### Ví dụ cây tổ chức
```
Khối CNTT (L1)
├── Trung tâm Hạ tầng (L2)
│   ├── Phòng Server (L3)
│   └── Phòng Network (L3)
├── Trung tâm Ứng dụng (L2)
│   ├── Phòng Dev (L3)
│   └── Phòng Test (L3)
└── Phòng Kế hoạch CNTT (L2)

Chi nhánh Hà Nội (L1)
└── Phòng Kinh doanh HN (L2)
```

---

## 4. roles — Vai trò

**Entity:** `Role` | **Bảng:** `roles`

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `code` | `code` | `varchar` unique | ✅ | — | Mã vai trò (VD: `service_desk`) |
| `name` | `name` | `varchar` | ✅ | — | Tên hiển thị |
| `description` | `description` | `text` | ❌ | — | Mô tả chi tiết |
| `isSystem` | `is_system` | `boolean` | ✅ | `false` | Vai trò hệ thống — **không xóa được** |
| `isActive` | `is_active` | `boolean` | ✅ | `true` | Đang hoạt động |

### Quan hệ
- `ManyToMany → permissions` (JoinTable: `role_permissions`)
- `OneToMany → user_roles`

### Roles hệ thống được seed sẵn

| Code | Tên | Quyền tiêu biểu |
|---|---|---|
| `super_admin` | Super Administrator | Tất cả quyền |
| `admin` | Quản trị viên | users:manage, tất cả modules |
| `service_desk` | Service Desk | incidents:*, service_requests:* |
| `technician` | Kỹ thuật viên | incidents:read/update, problems:read |
| `change_manager` | Quản lý Thay đổi | changes:manage, changes:approve |
| `problem_manager` | Quản lý Vấn đề | problems:manage, knowledge:publish |
| `release_manager` | Quản lý Phát hành | changes:approve, cmdb:update |
| `asset_manager` | Quản lý Tài sản | cmdb:manage |
| `knowledge_manager` | Quản lý Tri thức | knowledge:manage |
| `approver` | Người phê duyệt | changes:approve, service_requests:approve |
| `end_user` | Người dùng cuối | incidents:create/read, catalog:read |
| `report_viewer` | Xem Báo cáo | reports:read |

---

## 5. permissions — Quyền hạn

**Entity:** `Permission` | **Bảng:** `permissions`

| Trường TS | Cột DB | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|---|
| `code` | `code` | `varchar` unique | ✅ | Format `resource:action` (VD: `incidents:create`) |
| `resource` | `resource` | `varchar` | ✅ | Tài nguyên (VD: `incidents`, `users`) |
| `action` | `action` | `varchar` | ✅ | Hành động (VD: `create`, `read`, `approve`) |
| `description` | `description` | `varchar` | ❌ | Mô tả quyền |
| `groupName` | `group_name` | `varchar` | ❌ | Nhóm để hiển thị UI |

### Danh sách permissions được seed (98 quyền)

| Resource | Actions |
|---|---|
| `incidents` | create, read, update, delete, assign, close, manage |
| `problems` | create, read, update, delete, assign, manage |
| `changes` | create, read, update, delete, approve, assign, manage |
| `service_requests` | create, read, update, delete, approve, assign, manage |
| `cmdb` | create, read, update, delete, manage |
| `sla` | read, manage |
| `knowledge` | create, read, update, delete, publish, manage |
| `catalog` | create, read, update, delete, manage |
| `users` | create, read, update, delete, manage |
| `roles` | create, read, update, delete, manage |
| `organizations` | create, read, update, delete, manage |
| `reports` | read, export, manage |
| `audit` | read |
| `settings` | read, manage |

---

## 6. user_roles — Phân quyền người dùng

**Entity:** `UserRole` | **Bảng:** `user_roles`
> Không extends BaseEntity (junction table với metadata tối giản).

| Trường TS | Cột DB | Kiểu | Mô tả |
|---|---|---|---|
| `id` | `id` | `uuid` PK | Khóa chính |
| `userId` | `user_id` | `uuid` FK | Người dùng |
| `roleId` | `role_id` | `uuid` FK | Vai trò |
| `organizationId` | `organization_id` | `uuid` FK nullable | Phạm vi tổ chức (null = toàn hệ thống) |
| `createdAt` | `created_at` | `timestamptz` | Thời điểm gán |
| `createdBy` | `created_by` | `uuid` nullable | Ai gán |

**Index unique:** `(user_id, role_id, organization_id)` — mỗi user chỉ có 1 role trong 1 org.

### Ý nghĩa `organization_id`
- `null` → Vai trò áp dụng **toàn hệ thống** (VD: admin có quyền mọi nơi)
- `= org_id` → Vai trò chỉ có hiệu lực **trong đơn vị đó** (VD: manager của Phòng A)

### Ví dụ
```json
// User là admin toàn hệ thống
{ "userId": "...", "roleId": "admin-role-id", "organizationId": null }

// User là manager của Phòng Server
{ "userId": "...", "roleId": "technician-role-id", "organizationId": "phong-server-id" }
```

---

## 7. incidents — Sự cố

**Entity:** `Incident` | **Bảng:** `incidents`
**Mục tiêu ITIL:** Khôi phục dịch vụ nhanh nhất, giảm thiểu tác động.

### Trường dữ liệu

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `incidentNumber` | `incident_number` | `varchar` unique | ✅ | — | VD: `INC-20240321-000001` |
| `title` | `title` | `varchar` | ✅ | — | Tiêu đề ngắn |
| `description` | `description` | `text` | ✅ | — | Mô tả chi tiết |
| `status` | `status` | `enum IncidentStatus` | ✅ | `new` | Trạng thái xử lý |
| `priority` | `priority` | `enum Priority` | ✅ | `medium` | Ưu tiên (tính từ Impact × Urgency) |
| `impact` | `impact` | `enum Impact` | ✅ | `individual` | Mức ảnh hưởng |
| `urgency` | `urgency` | `enum Urgency` | ✅ | `medium` | Mức khẩn cấp |
| `category` | `category` | `varchar` | ❌ | — | Danh mục |
| `subcategory` | `subcategory` | `varchar` | ❌ | — | Danh mục con |
| `service` | `service` | `varchar` | ❌ | — | Dịch vụ bị ảnh hưởng |
| `reporterId` | `reporter_id` | `uuid` | ✅ | — | Người báo cáo |
| `reporterName` | `reporter_name` | `varchar` | ❌ | — | Tên người báo cáo |
| `reporterEmail` | `reporter_email` | `varchar` | ❌ | — | Email người báo cáo |
| `assigneeId` | `assignee_id` | `uuid` | ❌ | — | Người xử lý |
| `assigneeGroupId` | `assignee_group_id` | `uuid` | ❌ | — | Nhóm xử lý |
| `escalationLevel` | `escalation_level` | `int` | ✅ | `1` | Cấp leo thang: L1→L2→L3→L4 |
| `escalatedAt` | `escalated_at` | `timestamptz` | ❌ | — | Thời điểm leo thang |
| `escalatedTo` | `escalated_to` | `uuid` | ❌ | — | Leo thang đến ai |
| `slaId` | `sla_id` | `uuid` | ❌ | — | SLA áp dụng |
| `responseDeadline` | `response_deadline` | `timestamptz` | ❌ | — | Hạn phản hồi lần đầu |
| `resolutionDeadline` | `resolution_deadline` | `timestamptz` | ❌ | — | Hạn giải quyết |
| `firstResponseAt` | `first_response_at` | `timestamptz` | ❌ | — | Thời điểm phản hồi thực tế |
| `slaStatus` | `sla_status` | `enum SlaStatus` | ✅ | `active` | Trạng thái SLA |
| `slaPausedAt` | `sla_paused_at` | `timestamptz` | ❌ | — | Thời điểm tạm dừng SLA |
| `slaPausedDuration` | `sla_paused_duration` | `int` | ✅ | `0` | Tổng thời gian pause SLA (phút) |
| `resolution` | `resolution` | `text` | ❌ | — | Giải pháp đã áp dụng |
| `rootCause` | `root_cause` | `text` | ❌ | — | Nguyên nhân gốc rễ |
| `workaround` | `workaround` | `text` | ❌ | — | Giải pháp tạm thời |
| `resolvedAt` | `resolved_at` | `timestamptz` | ❌ | — | Thời điểm giải quyết |
| `resolvedBy` | `resolved_by` | `uuid` | ❌ | — | Ai giải quyết |
| `closedAt` | `closed_at` | `timestamptz` | ❌ | — | Thời điểm đóng |
| `closedBy` | `closed_by` | `uuid` | ❌ | — | Ai đóng |
| `closureCode` | `closure_code` | `varchar` | ❌ | — | Mã đóng (resolved/user_error/no_fault) |
| `problemId` | `problem_id` | `uuid` | ❌ | — | Problem liên quan |
| `changeId` | `change_id` | `uuid` | ❌ | — | Change gây ra sự cố |
| `knowledgeArticleId` | `knowledge_article_id` | `uuid` | ❌ | — | KB được áp dụng |
| `affectedCiIds` | `affected_ci_ids` | `uuid[]` | ✅ | `[]` | Danh sách CI bị ảnh hưởng |
| `customerSatisfaction` | `customer_satisfaction` | `smallint` | ❌ | — | Đánh giá 1-5 sao |
| `customerFeedback` | `customer_feedback` | `text` | ❌ | — | Phản hồi người dùng |
| `tags` | `tags` | `text[]` | ✅ | `[]` | Nhãn |
| `source` | `source` | `varchar` | ✅ | `portal` | Nguồn tiếp nhận |
| `isMajorIncident` | `is_major_incident` | `boolean` | ✅ | `false` | Sự cố nghiêm trọng |
| `pendingReason` | `pending_reason` | `varchar` | ❌ | — | Lý do tạm dừng |
| `attachments` | `attachments` | `jsonb` | ✅ | `[]` | File đính kèm |
| `metadata` | `metadata` | `jsonb` | ❌ | — | Dữ liệu mở rộng |

### Enum: IncidentStatus
```
new → assigned → in_progress → pending / on_hold → resolved → closed
                                                  ↘ reopened
                                              cancelled
```

### Computed Properties
```typescript
isBreachingSla  → true nếu quá resolutionDeadline và chưa resolved/closed
isOpen          → true nếu chưa resolved/closed/cancelled
```

---

## 8. problems — Vấn đề

**Entity:** `Problem` | **Bảng:** `problems`
**Mục tiêu ITIL:** Xác định và loại bỏ nguyên nhân gốc rễ. Quản lý Known Error Database (KEDB).

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `problemNumber` | `problem_number` | `varchar` unique | ✅ | — | VD: `PRB-000001` |
| `title` | `title` | `varchar` | ✅ | — | Tiêu đề |
| `description` | `description` | `text` | ✅ | — | Mô tả |
| `status` | `status` | `enum ProblemStatus` | ✅ | `new` | Trạng thái |
| `priority` | `priority` | `enum Priority` | ✅ | `medium` | Ưu tiên |
| `impact` | `impact` | `enum Impact` | ✅ | `individual` | Ảnh hưởng |
| `category` / `subcategory` / `service` | — | `varchar` | ❌ | — | Phân loại |
| `assigneeId` | `assignee_id` | `uuid` | ❌ | — | Người xử lý |
| `problemManagerId` | `problem_manager_id` | `uuid` | ❌ | — | Problem Manager |
| `rootCause` | `root_cause` | `text` | ❌ | — | Nguyên nhân gốc rễ đã xác định |
| `rootCauseIdentifiedAt` | `root_cause_identified_at` | `timestamptz` | ❌ | — | Thời điểm xác định RCA |
| `isKnownError` | `is_known_error` | `boolean` | ✅ | `false` | Đã vào KEDB |
| `knownErrorRegisteredAt` | `known_error_registered_at` | `timestamptz` | ❌ | — | Thời điểm vào KEDB |
| `workaround` | `workaround` | `text` | ❌ | — | Giải pháp tạm thời |
| `permanentFix` | `permanent_fix` | `text` | ❌ | — | Giải pháp vĩnh viễn |
| `resolution` | `resolution` | `text` | ❌ | — | Cách giải quyết |
| `resolvedAt` / `resolvedBy` / `closedAt` | — | — | ❌ | — | Thông tin đóng |
| `relatedIncidentIds` | `related_incident_ids` | `uuid[]` | ✅ | `[]` | Incidents liên quan |
| `relatedChangeId` | `related_change_id` | `uuid` | ❌ | — | Change request để fix |
| `affectedCiIds` | `affected_ci_ids` | `uuid[]` | ✅ | `[]` | CI bị ảnh hưởng |
| `knowledgeArticleId` | `knowledge_article_id` | `uuid` | ❌ | — | KB liên quan |
| `investigationNotes` | `investigation_notes` | `jsonb` | ✅ | `[]` | Nhật ký điều tra |
| `fiveWhys` | `five_whys` | `jsonb` | ❌ | — | Phân tích 5 Whys |
| `attachments` | `attachments` | `jsonb` | ✅ | `[]` | File đính kèm |
| `tags` / `metadata` | — | — | — | — | Nhãn / Dữ liệu mở rộng |

### investigationNotes format
```json
[
  {
    "date": "2026-03-27T10:00:00Z",
    "author": "Nguyễn Văn A",
    "content": "Đã kiểm tra log server, phát hiện memory leak trong module X"
  }
]
```

---

## 9. changes — Thay đổi

**Entity:** `Change` | **Bảng:** `changes`
**Mục tiêu ITIL:** Kiểm soát vòng đời thay đổi, cân bằng rủi ro và lợi ích.

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `changeNumber` | `change_number` | `varchar` unique | ✅ | — | VD: `CHG-000001` |
| `title` | `title` | `varchar` | ✅ | — | Tiêu đề |
| `description` | `description` | `text` | ✅ | — | Mô tả chi tiết |
| `justification` | `justification` | `text` | ✅ | — | Lý do kinh doanh |
| `status` | `status` | `enum ChangeStatus` | ✅ | `draft` | Trạng thái |
| `type` | `type` | `enum ChangeType` | ✅ | `normal` | Standard / Normal / Emergency |
| `priority` / `impact` | — | `enum` | ✅ | — | Ưu tiên / Ảnh hưởng |
| `category` / `service` | — | `varchar` | ❌ | — | Phân loại |
| `requestorId` | `requestor_id` | `uuid` | ✅ | — | Người yêu cầu |
| `changeManagerId` | `change_manager_id` | `uuid` | ❌ | — | Change Manager |
| `implementerId` | `implementer_id` | `uuid` | ❌ | — | Người thực hiện |
| `riskLevel` | `risk_level` | `varchar` | ❌ | — | low/medium/high/critical |
| `riskAssessment` | `risk_assessment` | `text` | ❌ | — | Đánh giá rủi ro |
| `rollbackPlan` | `rollback_plan` | `text` | ❌ | — | **Bắt buộc có trước khi approve** |
| `testPlan` | `test_plan` | `text` | ❌ | — | Kế hoạch kiểm thử |
| `implementationPlan` | `implementation_plan` | `text` | ❌ | — | Kế hoạch triển khai |
| `scheduledStartDate` | `scheduled_start_date` | `timestamptz` | ❌ | — | Bắt đầu dự kiến (Change Window) |
| `scheduledEndDate` | `scheduled_end_date` | `timestamptz` | ❌ | — | Kết thúc dự kiến |
| `actualStartDate` / `actualEndDate` | — | `timestamptz` | ❌ | — | Thực tế |
| `cabRequired` | `cab_required` | `boolean` | ✅ | `false` | Cần họp CAB? |
| `cabMeetingDate` | `cab_meeting_date` | `timestamptz` | ❌ | — | Ngày họp CAB |
| `approvals` | `approvals` | `jsonb` | ✅ | `[]` | Danh sách phê duyệt |
| `implementationNotes` | `implementation_notes` | `text` | ❌ | — | Ghi chú thực hiện |
| `postImplementationReview` | `post_implementation_review` | `text` | ❌ | — | Đánh giá sau triển khai |
| `closureCode` | `closure_code` | `varchar` | ❌ | — | successful/unsuccessful/cancelled |
| `relatedIncidentIds` | `related_incident_ids` | `uuid[]` | ✅ | `[]` | Incidents liên quan |
| `relatedProblemId` | `related_problem_id` | `uuid` | ❌ | — | Problem liên quan |
| `affectedCiIds` | `affected_ci_ids` | `uuid[]` | ✅ | `[]` | CI bị ảnh hưởng |

### approvals format
```json
[
  {
    "approverId": "uuid",
    "approverName": "Trần Văn B",
    "status": "approved",
    "comment": "Đã review kỹ, đồng ý triển khai",
    "actionAt": "2026-03-27T14:00:00Z",
    "required": true
  }
]
```

### Status Flow
```
draft → submitted → under_review → approved → scheduled → in_progress → implemented → closed
                               ↘ rejected → cancelled
                                              ↘ failed → rolled_back → closed
```

---

## 10. service_requests — Yêu cầu dịch vụ

**Entity:** `ServiceRequest` | **Bảng:** `service_requests`
**Mục tiêu ITIL:** Phục vụ yêu cầu chuẩn hóa, self-service.

| Trường TS | Cột DB | Kiểu | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|
| `requestNumber` | `request_number` | `varchar` unique | ✅ | — | VD: `REQ-000001` |
| `title` / `description` | — | — | ✅ | — | Tiêu đề / Mô tả |
| `status` | `status` | `enum RequestStatus` | ✅ | `new` | Trạng thái |
| `priority` | `priority` | `enum Priority` | ✅ | `low` | Ưu tiên |
| `catalogItemId` | `catalog_item_id` | `uuid` | ❌ | — | Dịch vụ trong catalog |
| `catalogItemName` | `catalog_item_name` | `varchar` | ❌ | — | Tên snapshot |
| `requesterId` | `requester_id` | `uuid` | ✅ | — | Người yêu cầu |
| `onBehalfOfId` | `on_behalf_of_id` | `uuid` | ❌ | — | Yêu cầu thay cho người khác |
| `assigneeId` | `assignee_id` | `uuid` | ❌ | — | Người xử lý |
| `requiresApproval` | `requires_approval` | `boolean` | ✅ | `false` | Cần phê duyệt? |
| `approvals` | `approvals` | `jsonb` | ✅ | `[]` | Danh sách phê duyệt |
| `resolutionDeadline` | `resolution_deadline` | `timestamptz` | ❌ | — | Hạn giải quyết theo SLA |
| `formData` | `form_data` | `jsonb` | ❌ | — | Dữ liệu form từ catalog |
| `fulfillmentNotes` | `fulfillment_notes` | `text` | ❌ | — | Ghi chú hoàn thành |
| `fulfilledAt` / `fulfilledBy` | — | — | ❌ | — | Thông tin hoàn thành |
| `customerSatisfaction` | `customer_satisfaction` | `smallint` | ❌ | — | 1-5 sao |
| `source` | `source` | `varchar` | ✅ | `portal` | Nguồn yêu cầu |

---

## 11. configuration_items — CMDB

**Entity:** `ConfigurationItem` | **Bảng:** `configuration_items`
**Mục tiêu ITIL:** Biết rõ ta đang quản lý tài sản IT gì, chúng liên quan đến nhau thế nào.

| Nhóm | Trường TS | Cột DB | Mô tả |
|---|---|---|---|
| **Định danh** | `ciNumber` | `ci_number` | Mã CI duy nhất |
| | `name`, `displayName` | — | Tên |
| | `type`, `subtype` | — | Loại (server/workstation/software/service...) |
| | `status` | — | `enum CiStatus` |
| **Vị trí** | `location`, `building`, `floor`, `room` | — | Vị trí vật lý |
| **Sở hữu** | `ownerId`, `ownerDepartmentId` | — | Chủ sở hữu |
| **Kỹ thuật** | `manufacturer`, `model`, `serialNumber` | — | Nhà sản xuất, model, S/N |
| | `ciVersion` | `ci_version` | Phiên bản phần mềm/firmware (khác cột `version` optimistic lock của BaseEntity) |
| | `ipAddress`, `macAddress`, `hostname` | — | Mạng |
| | `operatingSystem`, `osVersion` | — | Hệ điều hành |
| | `cpu`, `ramGb`, `storageGb` | — | Thông số phần cứng |
| **Vòng đời** | `purchaseDate`, `warrantyExpiry` | — | Mua, bảo hành |
| | `endOfLifeDate`, `purchaseCost` | — | EOL, chi phí |
| **Bản quyền** | `licenseKey`, `licenseType`, `licenseExpiry` | — | License phần mềm |
| **CMDB Relations** | `relationships` | — | `jsonb[]` quan hệ CI-CI |
| **Phân loại** | `environment` | — | prod/staging/dev/test |
| | `criticality` | — | critical/high/medium/low |
| | `tags`, `serviceIds` | — | Nhãn, dịch vụ sử dụng |
| | `attributes` | — | `jsonb` metadata tùy CI |

### relationships format
```json
[
  {
    "relatedCiId": "uuid-of-database-server",
    "relatedCiName": "DB-PROD-01",
    "relationshipType": "depends_on",
    "direction": "downstream"
  }
]
```

---

## 12. slas — Thỏa thuận mức dịch vụ

**Entity:** `Sla` | **Bảng:** `slas`

| Trường TS | Cột DB | Kiểu | Mô tả |
|---|---|---|---|
| `name` | `name` | `varchar` unique | Tên SLA |
| `type` | `type` | `varchar` | `sla` / `ola` / `uc` |
| `isActive` | `is_active` | `boolean` | Đang áp dụng |
| `appliesToTicketType` | `applies_to_ticket_type` | `varchar` | `incident` / `request` / `all` |
| `targets` | `targets` | `jsonb` | Mục tiêu theo priority |
| `businessHoursOnly` | `business_hours_only` | `boolean` | Tính SLA trong giờ làm việc |
| `businessHoursStart/End` | — | `varchar` | Giờ làm việc (VD: `08:00`) |
| `workingDays` | `working_days` | `int[]` | 1=Mon, 7=Sun |
| `warningThresholdPercent` | `warning_threshold_percent` | `smallint` | Cảnh báo khi % elapsed (default: 75) |
| `escalationRules` | `escalation_rules` | `jsonb` | Quy tắc leo thang |

### targets format
```json
{
  "critical": { "responseTime": 15, "resolutionTime": 240 },
  "high":     { "responseTime": 30, "resolutionTime": 480 },
  "medium":   { "responseTime": 120, "resolutionTime": 1440 },
  "low":      { "responseTime": 480, "resolutionTime": 4320 }
}
```
> Đơn vị: **phút**. `responseTime` = phản hồi lần đầu, `resolutionTime` = giải quyết xong.

---

## 13. knowledge_articles — Cơ sở tri thức

**Entity:** `KnowledgeArticle` | **Bảng:** `knowledge_articles`
**Mục tiêu ITIL:** Không giải quyết cùng một vấn đề hai lần.

| Trường TS | Cột DB | Mô tả |
|---|---|---|
| `articleNumber` | `article_number` | VD: `KB-000001` |
| `title`, `summary`, `content` | — | Tiêu đề, tóm tắt, nội dung Markdown |
| `status` | `status` | `enum KnowledgeStatus` |
| `type` | `type` | `how_to` / `faq` / `known_error` / `workaround` / `policy` / `best_practice` |
| `authorId`, `authorName` | — | Tác giả |
| `reviewerId`, `reviewedAt` | — | Người review |
| `publishedAt`, `publishedBy` | — | Xuất bản |
| `expiryDate`, `reviewDate` | — | Ngày hết hạn, ngày review lại |
| `visibility` | `visibility` | `all` / `agent` / `internal` |
| `isFeatured` | `is_featured` | Bài viết nổi bật |
| `viewCount`, `helpfulCount`, `notHelpfulCount`, `useCount`, `rating` | — | Analytics |
| `relatedArticleIds`, `relatedIncidentIds` | — | `uuid[]` liên quan |
| `tags`, `keywords` | — | Nhãn, từ khóa tìm kiếm |

### Computed Property
```typescript
helpfulRatio → % helpful = helpfulCount / (helpfulCount + notHelpfulCount) * 100
```

---

## 14. catalog_items — Danh mục dịch vụ

**Entity:** `CatalogItem` | **Bảng:** `catalog_items`
**Mục tiêu ITIL:** Người dùng biết họ có thể yêu cầu những gì từ IT.

| Trường TS | Cột DB | Mô tả |
|---|---|---|
| `code` | `code` | Mã dịch vụ duy nhất (VD: `IT-ACCESS-001`) |
| `name`, `shortDescription`, `description` | — | Tên, mô tả ngắn, mô tả dài |
| `category`, `subcategory` | — | Phân loại |
| `isActive`, `isVisibleToUsers` | — | Hiển thị trong self-service portal |
| `requiresApproval`, `approvalGroupId` | — | Quy trình phê duyệt |
| `fulfillmentGroupId` | — | Nhóm thực hiện |
| `slaResponseMinutes`, `slaResolutionMinutes` | — | SLA mặc định (phút) |
| `formFields` | `form_fields` | `jsonb` — định nghĩa form động |
| `workflowTemplate` | `workflow_template` | `jsonb` — mẫu quy trình xử lý |
| `cost`, `currency` | — | Chi phí nếu có |
| `requestCount`, `averageSatisfaction` | — | Analytics |

### formFields format
```json
[
  {
    "name": "system",
    "label": "Hệ thống cần truy cập",
    "type": "select",
    "required": true,
    "options": ["ERP", "CRM", "HRM", "Email"]
  },
  {
    "name": "justification",
    "label": "Lý do yêu cầu",
    "type": "textarea",
    "required": true
  }
]
```

---

## 15. system_metrics — Giám sát server

**Entity:** `SystemMetric` | **Bảng:** `system_metrics`
> Không extends BaseEntity — time-series data, không cần audit trail.

| Nhóm | Trường TS | Cột DB | Kiểu | Mô tả |
|---|---|---|---|---|
| **ID** | `id` | `id` | `uuid` PK | Khóa chính |
| | `timestamp` | `timestamp` | `timestamptz` | Thời điểm thu thập (**index chính**) |
| **CPU** | `cpuUsagePercent` | `cpu_usage_percent` | `decimal(5,2)` | CPU usage % (0–100) |
| | `cpuCores` | `cpu_cores` | `int` | Số lõi logic |
| | `loadAvg1m` | `load_avg_1m` | `decimal(6,2)` | Load avg 1 phút (0 trên Windows) |
| | `loadAvg5m` | `load_avg_5m` | `decimal(6,2)` | Load avg 5 phút |
| | `loadAvg15m` | `load_avg_15m` | `decimal(6,2)` | Load avg 15 phút |
| **Memory** | `memoryTotalMb` | `memory_total_mb` | `int` | Tổng RAM hệ thống (MB) |
| | `memoryUsedMb` | `memory_used_mb` | `int` | RAM đang dùng (MB) |
| | `memoryFreeMb` | `memory_free_mb` | `int` | RAM còn trống (MB) |
| | `memoryUsagePercent` | `memory_usage_percent` | `decimal(5,2)` | RAM usage % |
| **Node.js** | `heapUsedMb` | `heap_used_mb` | `int` | V8 Heap đang dùng (MB) |
| | `heapTotalMb` | `heap_total_mb` | `int` | V8 Heap cấp phát (MB) |
| | `heapExternalMb` | `heap_external_mb` | `int` | External memory (MB) |
| | `rssMb` | `rss_mb` | `int` | RSS — tổng bộ nhớ process (MB) |
| **App** | `activeConnections` | `active_connections` | `int` | HTTP requests đang xử lý |
| | `requestsPerMinute` | `requests_per_minute` | `int` | Requests hoàn thành/phút |
| | `errorCountPerMinute` | `error_count_per_minute` | `int` | Lỗi 4xx/5xx/phút |
| **Meta** | `uptimeSeconds` | `uptime_seconds` | `int` | Process uptime (giây) |
| | `nodeVersion` | `node_version` | `varchar(30)` | VD: `v20.11.0` |
| | `platform` | `platform` | `varchar(20)` | `linux` / `win32` / `darwin` |

### API & WebSocket
| Endpoint | Mô tả |
|---|---|
| `GET /api/v1/system/metrics/current` | Snapshot ngay lập tức (không cần DB) |
| `GET /api/v1/system/metrics/history?from=&to=&limit=` | Lịch sử từ DB, max 1000 bản ghi |
| `GET /api/v1/system/metrics/summary?from=&to=` | Avg/Max/Min tổng hợp |
| `DELETE /api/v1/system/metrics/cleanup?olderThanDays=` | Xóa data cũ (super_admin) |
| WS `/system` event `system:metrics` | Broadcast mỗi 5 giây |
| WS `/system` event `system:alert` | Khi CPU > 80% hoặc RAM > 85% |

---

## 16. Object locking — Khóa chỉnh sửa đồng thời

Hỗ trợ **pessimistic lock** (bản ghi `object_locks`) và **cấu hình theo loại đối tượng** (`object_locking_configs`), đồng bộ với migration `AddObjectLockingTables`.

### 16.1. object_locking_configs

**Bảng:** `object_locking_configs` — extends các trường audit giống BaseEntity (`created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`, `version`).

| Cột DB | Kiểu | Mô tả |
|--------|------|--------|
| `object_type` | `varchar(50)` unique | Loại entity: `incident`, `change`, `problem`, `service_request`, … |
| `locking_mode` | `varchar(20)` | `none` / `optimistic` / `pessimistic` / `both` |
| `is_enabled` | `boolean` | Bật tắt policy |
| `lock_timeout_mins` | `int` | TTL lock (mặc định 30 phút) |
| `conditions` | `jsonb` nullable | Điều kiện JSON; `null` = luôn áp dụng khi enabled |
| `apply_to_roles` | `varchar[]` nullable | Giới hạn role; `null` = mọi role |
| `description` | `varchar(500)` nullable | Ghi chú |

### 16.2. object_locks

**Bảng:** `object_locks` — **không** soft delete; bản ghi xóa khi release lock.

| Cột DB | Kiểu | Mô tả |
|--------|------|--------|
| `object_type` | `varchar(50)` | Loại object |
| `object_id` | `uuid` | ID bản ghi domain |
| `locked_by` | `uuid` | User giữ lock |
| `locked_by_name` | `varchar(255)` | Hiển thị cho user khác |
| `locked_at` | `timestamptz` | Thời điểm lock |
| `expires_at` | `timestamptz` | Hết hạn tự động |
| `session_id` | `varchar(255)` nullable | Phân biệt tab/session |

**Unique:** `(object_type, object_id)` — một lock tại một thời điểm cho mỗi bản ghi.

### API

Module NestJS: `locking` — REST dưới prefix global (ví dụ `/api/v1/locking/...`). Route nghiệp vụ có thể dùng decorator `@Lockable()` kết hợp `LockingGuard`.

---

## 17. Enum Reference

### Priority
```
critical  → Nghiêm trọng nhất, ảnh hưởng toàn tổ chức
high      → Cao
medium    → Trung bình (default)
low       → Thấp
planning  → Theo kế hoạch
```

### Impact
```
enterprise   → Ảnh hưởng toàn doanh nghiệp
department   → Ảnh hưởng cả phòng/bộ phận
group        → Ảnh hưởng nhóm nhỏ
individual   → Chỉ 1 người (default)
```

### Urgency
```
critical  → Không thể làm việc ngay
high      → Bị ảnh hưởng nghiêm trọng
medium    → Bị ảnh hưởng nhưng vẫn làm được (default)
low       → Ảnh hưởng nhỏ
```

---

## 18. Sơ đồ quan hệ

```
organizations ──< users
organizations ──< user_roles >── roles ──< role_permissions >── permissions

users ─────────────────────< incidents
users (reporterId)          problems
users (requestorId)         changes
users (requesterId)         service_requests
users (authorId)            knowledge_articles
users (ownerId)             configuration_items

incidents >── problems         (incident.problemId)
incidents >── changes          (incident.changeId)
incidents >── knowledge        (incident.knowledgeArticleId)
incidents >── configuration    (incident.affectedCiIds[])

problems  >── changes          (problem.relatedChangeId)
problems  >── incidents[]      (problem.relatedIncidentIds[])

changes   >── incidents[]      (change.relatedIncidentIds[])
changes   >── problems         (change.relatedProblemId)
changes   >── configuration    (change.affectedCiIds[])

service_requests >── catalog   (serviceRequest.catalogItemId)

slas      ──── incidents       (incident.slaId)

knowledge_articles >── incidents[] (article.relatedIncidentIds[])
```

---

*Được tạo tự động từ entity definitions. Cập nhật khi có thay đổi schema.*
