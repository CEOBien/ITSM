/**
 * UUID cố định cho dữ liệu seed — dùng làm ví dụ Swagger / QA sau `npm run seed`.
 * Đồng bộ với logic insert trong initial-data.seed.ts
 */
export const SEED_INCIDENT_REFERENCE = {
  /** User `technician` — bắt buộc khi tạo incident (assigneeId) */
  ASSIGNEE_USER_ID: 'c3000000-0000-4000-8000-000000000001',
  /** Bảng `assignment_groups` — queue L1 (assigneeGroupId khi tạo incident) */
  ASSIGNMENT_GROUP_ID: 'b2000000-0000-4000-8000-000000000001',
  /** CMDB CI CI-DEMO-ERP-01 */
  CI_ERP_SERVER_ID: 'a1000000-0000-4000-8000-000000000001',
  /** CMDB CI CI-DEMO-MAIL-01 */
  CI_MAIL_SERVICE_ID: 'a1000000-0000-4000-8000-000000000002',
} as const;
