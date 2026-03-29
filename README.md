# ITSM Platform — ITIL v4 (NestJS API)

Hệ thống quản lý dịch vụ CNTT theo **ITIL v4**: Incident, Problem, Change, Service Request, CMDB, SLA, Knowledge, Catalog; kèm người dùng, tổ chức, vai trò—quyền, giám sát hệ thống và object locking.

---

## Module nghiệp vụ (ITIL & hạ tầng)

| Module | ITIL / vai trò | Ghi chú |
|--------|----------------|---------|
| **incidents** | Incident Management | SLA, escalation, `@Lockable()` |
| **problems** | Problem Management | KEDB, 5 Whys |
| **changes** | Change Enablement | CAB, approval JSON |
| **service-requests** | Service Request Management | Catalog, form data |
| **cmdb** | Service Configuration Management | CI, quan hệ |
| **sla** | Service Level Management | Targets JSON, business hours |
| **knowledge** | Knowledge Management | KB, known error |
| **catalog** | Service Catalogue | Form động, fulfillment |
| **users** | — | Tài khoản, profile |
| **organizations** | — | Cây tổ chức đa cấp |
| **roles** | — | RBAC: roles, permissions, `user_roles` |
| **system-monitor** | — | Metrics REST + WebSocket namespace `/system` |
| **locking** | — | Cấu hình lock theo loại object + `object_locks` |

**Shared:** `audit`, `notification` (EventEmitter), `workflow`.

---

## Cấu trúc mã nguồn

```
src/
├── config/                 # app, database, jwt, redis, mail
├── database/
│   ├── migrations/
│   └── seeds/
├── common/                 # constants, enums, dto, entities (BaseEntity), utils, interfaces
├── core/
│   ├── auth/               # JWT, login, refresh
│   ├── guards/             # JWT, Roles, Permissions, Locking
│   ├── decorators/         # Public, Roles, Permissions, CurrentUser, Lockable, …
│   ├── interceptors/       # Response, Logging, ActiveRequests (metrics)
│   └── filters/            # Global exception
├── modules/                # Domain modules (bảng trên)
├── shared/                 # audit, notification, workflow
├── app.module.ts
└── main.ts
```

Path alias (xem `package.json` / `tsconfig`): `@common/*`, `@core/*`, `@modules/*`, `@shared/*`, `@config/*`.

---

## Quick start

### Yêu cầu

- Node.js ≥ 18  
- PostgreSQL ≥ 14  
- Redis ≥ 6 (cache/queue khi bật tính năng liên quan)

### Cài đặt

```bash
cd ITSM
npm install
cp .env.example .env
# Chỉnh DB, JWT, Redis, CORS (thêm http://localhost:3001 nếu dùng web Next.js local)
```

Tạo database (ví dụ `itsm_db`), sau đó:

```bash
npm run migration:run
npm run seed
npm run start:dev
```

### Tài khoản mặc định (sau `seed`)

| Username | Password | Role |
|----------|----------|------|
| `superadmin` | `Admin@123456` | super_admin |
| `admin` | `Admin@123456` | admin |
| `servicedesk` | `Admin@123456` | service_desk |
| `technician` | `Admin@123456` | technician |
| `change.manager` | `Admin@123456` | change_manager |
| `enduser` | `User@123456` | end_user |

---

## API & tài liệu

| Mục | URL / ghi chú |
|-----|----------------|
| Global prefix | `api/v1` (biến `API_PREFIX`) |
| Ví dụ health | `GET http://localhost:3000/api/v1/health` |
| Root info | `GET http://localhost:3000/api/v1/` |
| Swagger | `http://localhost:3000/api/docs` — **chỉ khi không phải production** (`APP_ENV`) |

Ứng dụng bật **URI versioning** trong `main.ts`; prefix thực tế lấy từ config (mặc định đã gồm `v1`).

---

## Biến môi trường (tóm tắt)

Chi tiết đầy đủ trong [`.env.example`](.env.example).

| Nhóm | Biến tiêu biểu |
|------|----------------|
| App | `APP_PORT`, `APP_ENV`, `API_PREFIX`, `CORS_ORIGINS` |
| DB | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SYNCHRONIZE` |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |
| Redis | `REDIS_HOST`, `REDIS_PORT` |
| ITSM / SLA | `BUSINESS_HOURS_*`, `BUSINESS_TIMEZONE`, prefix ticket (`INCIDENT_PREFIX`, …) |
| Metrics | `METRICS_RETENTION_DAYS`, `METRICS_CPU_ALERT_THRESHOLD`, `METRICS_MEMORY_ALERT_THRESHOLD` |

---

## Bảo mật & chất lượng

- JWT access + refresh; **RBAC** qua Roles và **fine-grained permissions** (`PermissionsGuard`).
- Helmet, compression, Throttler, CORS có cấu hình.
- Audit trail (`shared/audit`), soft delete trên BaseEntity, optimistic locking (`version`).
- **Object locking:** cấu hình theo loại ticket/entity; route có `@Lockable()` + `LockingGuard` toàn cục.

---

## WebSocket (system metrics)

- Namespace Socket.IO: `/system` (xem `MetricsGateway`).
- Client cần JWT (auth handshake hoặc header).
- Sự kiện: `system:metrics`, `system:alert` (ngưỡng CPU/RAM theo env).

REST metrics: controller `system/metrics` (xem `docs/database-schema.md` mục system_metrics).

---

## Scripts hữu ích

| Script | Mô tả |
|--------|--------|
| `npm run start:dev` | Dev watch |
| `npm run migration:run` / `migration:revert` | TypeORM migrations |
| `npm run migration:generate -- -n TênMigration` | Sinh migration từ entity diff |
| `npm run seed` | Dữ liệu ban đầu |
| `npm run test` | Jest |

---

## Tài liệu schema

[docs/database-schema.md](docs/database-schema.md) — bảng, enum, quan hệ, metrics API.

---

*ITIL v4 | NestJS + TypeORM + PostgreSQL*
