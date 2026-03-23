/**
 * ITIL v4 Core Constants
 * Định nghĩa các hằng số theo chuẩn ITIL v4
 */

// ============================================================
// ITIL v4 - 34 Management Practices
// ============================================================
export const ITIL_PRACTICES = {
  GENERAL: {
    ARCHITECTURE_MANAGEMENT: 'architecture_management',
    CONTINUAL_IMPROVEMENT: 'continual_improvement',
    INFORMATION_SECURITY_MANAGEMENT: 'information_security_management',
    KNOWLEDGE_MANAGEMENT: 'knowledge_management',
    MEASUREMENT_REPORTING: 'measurement_reporting',
    ORGANIZATIONAL_CHANGE_MANAGEMENT: 'organizational_change_management',
    PORTFOLIO_MANAGEMENT: 'portfolio_management',
    PROJECT_MANAGEMENT: 'project_management',
    RELATIONSHIP_MANAGEMENT: 'relationship_management',
    RISK_MANAGEMENT: 'risk_management',
    SERVICE_FINANCIAL_MANAGEMENT: 'service_financial_management',
    STRATEGY_MANAGEMENT: 'strategy_management',
    SUPPLIER_MANAGEMENT: 'supplier_management',
    WORKFORCE_TALENT_MANAGEMENT: 'workforce_talent_management',
  },
  SERVICE_MANAGEMENT: {
    AVAILABILITY_MANAGEMENT: 'availability_management',
    BUSINESS_ANALYSIS: 'business_analysis',
    CAPACITY_PERFORMANCE_MANAGEMENT: 'capacity_performance_management',
    CHANGE_ENABLEMENT: 'change_enablement',
    INCIDENT_MANAGEMENT: 'incident_management',
    IT_ASSET_MANAGEMENT: 'it_asset_management',
    MONITORING_EVENT_MANAGEMENT: 'monitoring_event_management',
    PROBLEM_MANAGEMENT: 'problem_management',
    RELEASE_MANAGEMENT: 'release_management',
    SERVICE_CATALOGUE_MANAGEMENT: 'service_catalogue_management',
    SERVICE_CONFIGURATION_MANAGEMENT: 'service_configuration_management',
    SERVICE_CONTINUITY_MANAGEMENT: 'service_continuity_management',
    SERVICE_DESIGN: 'service_design',
    SERVICE_DESK: 'service_desk',
    SERVICE_LEVEL_MANAGEMENT: 'service_level_management',
    SERVICE_REQUEST_MANAGEMENT: 'service_request_management',
    SERVICE_VALIDATION_TESTING: 'service_validation_testing',
  },
  TECHNICAL: {
    DEPLOYMENT_MANAGEMENT: 'deployment_management',
    INFRASTRUCTURE_PLATFORM_MANAGEMENT: 'infrastructure_platform_management',
    SOFTWARE_DEVELOPMENT_MANAGEMENT: 'software_development_management',
  },
} as const;

// ============================================================
// ITIL v4 - Service Value Chain Activities
// ============================================================
export const SERVICE_VALUE_CHAIN = {
  PLAN: 'plan',
  IMPROVE: 'improve',
  ENGAGE: 'engage',
  DESIGN_TRANSITION: 'design_transition',
  OBTAIN_BUILD: 'obtain_build',
  DELIVER_SUPPORT: 'deliver_support',
} as const;

// ============================================================
// ITIL v4 - Four Dimensions of Service Management
// ============================================================
export const FOUR_DIMENSIONS = {
  ORGANIZATIONS_PEOPLE: 'organizations_and_people',
  INFORMATION_TECHNOLOGY: 'information_and_technology',
  PARTNERS_SUPPLIERS: 'partners_and_suppliers',
  VALUE_STREAMS_PROCESSES: 'value_streams_and_processes',
} as const;

// ============================================================
// SLA Response/Resolution Times (in minutes) - ITIL Standard
// ============================================================
export const SLA_TIMES = {
  INCIDENT: {
    CRITICAL: { response: 15, resolution: 240 }, // P1: 15min/4h
    HIGH: { response: 30, resolution: 480 }, // P2: 30min/8h
    MEDIUM: { response: 120, resolution: 1440 }, // P3: 2h/1day
    LOW: { response: 480, resolution: 4320 }, // P4: 8h/3days
    PLANNING: { response: 1440, resolution: 10080 }, // P5: 1day/7days
  },
  SERVICE_REQUEST: {
    HIGH: { response: 60, resolution: 480 },
    MEDIUM: { response: 240, resolution: 1440 },
    LOW: { response: 480, resolution: 4320 },
  },
} as const;

// ============================================================
// Change Management Windows (ITIL Change Enablement)
// ============================================================
export const CHANGE_WINDOWS = {
  STANDARD: 'standard_change',
  NORMAL: 'normal_change',
  EMERGENCY: 'emergency_change',
} as const;

// ============================================================
// Impact Assessment Categories
// ============================================================
export const IMPACT_CATEGORIES = {
  ENTERPRISE: 'enterprise', // Toàn bộ tổ chức
  DEPARTMENT: 'department', // Phòng ban
  GROUP: 'group', // Nhóm người dùng
  INDIVIDUAL: 'individual', // Cá nhân
} as const;

// ============================================================
// Configuration Item (CMDB) Types
// ============================================================
export const CI_TYPES = {
  HARDWARE: {
    SERVER: 'server',
    WORKSTATION: 'workstation',
    LAPTOP: 'laptop',
    NETWORK_DEVICE: 'network_device',
    STORAGE: 'storage',
    PRINTER: 'printer',
    MOBILE: 'mobile_device',
  },
  SOFTWARE: {
    OPERATING_SYSTEM: 'operating_system',
    APPLICATION: 'application',
    DATABASE: 'database',
    MIDDLEWARE: 'middleware',
    LICENSE: 'software_license',
  },
  SERVICE: {
    BUSINESS_SERVICE: 'business_service',
    IT_SERVICE: 'it_service',
    INFRASTRUCTURE_SERVICE: 'infrastructure_service',
  },
  NETWORK: {
    CIRCUIT: 'network_circuit',
    SEGMENT: 'network_segment',
    LOCATION: 'location',
  },
  DOCUMENT: 'document',
} as const;

// ============================================================
// Ticket escalation levels
// ============================================================
export const ESCALATION_LEVELS = {
  LEVEL_1: 'L1', // Service Desk
  LEVEL_2: 'L2', // Technical Support
  LEVEL_3: 'L3', // Expert/Vendor
  LEVEL_4: 'L4', // Management
} as const;

// ============================================================
// Problem Management - Known Error States
// ============================================================
export const KNOWN_ERROR_STATES = {
  KNOWN_ERROR: 'known_error',
  WORKAROUND_AVAILABLE: 'workaround_available',
  PERMANENT_FIX_APPLIED: 'permanent_fix_applied',
} as const;
