import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'ITSM_ITIL_V4',
  env: process.env.APP_ENV || 'development',
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  host: process.env.APP_HOST || '0.0.0.0',
  url: process.env.APP_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  apiVersion: process.env.API_VERSION || '1',
  corsOrigins: (process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  itsm: {
    incidentPrefix: process.env.INCIDENT_PREFIX || 'INC',
    problemPrefix: process.env.PROBLEM_PREFIX || 'PRB',
    changePrefix: process.env.CHANGE_PREFIX || 'CHG',
    requestPrefix: process.env.REQUEST_PREFIX || 'REQ',
    releasePrefix: process.env.RELEASE_PREFIX || 'REL',
    businessHoursStart: process.env.BUSINESS_HOURS_START || '08:00',
    businessHoursEnd: process.env.BUSINESS_HOURS_END || '17:30',
    businessTimezone: process.env.BUSINESS_TIMEZONE || 'Asia/Ho_Chi_Minh',
    autoAssignEnabled: process.env.AUTO_ASSIGN_ENABLED === 'true',
    escalationEnabled: process.env.ESCALATION_ENABLED === 'true',
  },
}));
