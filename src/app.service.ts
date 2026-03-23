import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getSystemInfo() {
    return {
      name: this.configService.get('app.name'),
      version: '1.0.0',
      description: 'ITSM Platform - IT Service Management based on ITIL v4',
      environment: this.configService.get('app.env'),
      timestamp: new Date().toISOString(),
      itil: {
        version: 'ITIL v4',
        practices: [
          'Incident Management',
          'Problem Management',
          'Change Enablement',
          'Service Request Management',
          'Service Configuration Management (CMDB)',
          'Service Level Management',
          'Knowledge Management',
          'Service Catalogue Management',
        ],
        framework: 'ITIL v4 Service Value System',
      },
      api: {
        version: this.configService.get('app.apiVersion'),
        prefix: this.configService.get('app.apiPrefix'),
        docs: '/api/docs',
      },
    };
  }

  healthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      version: process.version,
    };
  }
}
