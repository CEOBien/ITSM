import { Injectable, Logger, BadRequestException } from '@nestjs/common';

export interface WorkflowTransition {
  from: string | string[];
  to: string;
  action: string;
  roles?: string[];
  conditions?: Array<(entity: any, user: any) => boolean>;
  hooks?: Array<(entity: any, user: any) => Promise<void>>;
}

export interface WorkflowDefinition {
  name: string;
  initialState: string;
  transitions: WorkflowTransition[];
}

/**
 * Workflow Service - Generic state machine for ITIL ticket workflows
 * Quản lý vòng đời của các ticket theo ITIL practices
 */
@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
  private workflows = new Map<string, WorkflowDefinition>();

  constructor() {
    this.registerDefaultWorkflows();
  }

  registerWorkflow(name: string, definition: WorkflowDefinition): void {
    this.workflows.set(name, definition);
    this.logger.log(`Workflow registered: ${name}`);
  }

  getWorkflow(name: string): WorkflowDefinition | undefined {
    return this.workflows.get(name);
  }

  canTransition(
    workflowName: string,
    fromState: string,
    action: string,
    userRole?: string,
  ): boolean {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) return false;

    const transition = workflow.transitions.find(t => {
      const fromMatch = Array.isArray(t.from) ? t.from.includes(fromState) : t.from === fromState;
      return fromMatch && t.action === action;
    });

    if (!transition) return false;
    if (!transition.roles || transition.roles.length === 0) return true;
    return !userRole || transition.roles.includes(userRole);
  }

  async executeTransition(
    workflowName: string,
    entity: any,
    action: string,
    user: any,
  ): Promise<string> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) throw new BadRequestException(`Workflow ${workflowName} không tồn tại`);

    const currentState = entity.status || entity.currentState;
    const transition = workflow.transitions.find(t => {
      const fromMatch = Array.isArray(t.from)
        ? t.from.includes(currentState)
        : t.from === currentState;
      return fromMatch && t.action === action;
    });

    if (!transition) {
      throw new BadRequestException(
        `Không thể thực hiện "${action}" từ trạng thái "${currentState}"`,
      );
    }

    if (transition.roles && transition.roles.length > 0 && user?.role) {
      if (!transition.roles.includes(user.role)) {
        throw new BadRequestException(
          `Cần có vai trò ${transition.roles.join(' hoặc ')} để thực hiện "${action}"`,
        );
      }
    }

    if (transition.conditions) {
      for (const condition of transition.conditions) {
        if (!condition(entity, user)) {
          throw new BadRequestException(`Điều kiện chuyển trạng thái không được thỏa mãn`);
        }
      }
    }

    if (transition.hooks) {
      for (const hook of transition.hooks) {
        await hook(entity, user);
      }
    }

    this.logger.log(`[${workflowName}] ${currentState} -> ${transition.to} (by ${user?.id})`);
    return transition.to;
  }

  getAvailableActions(workflowName: string, currentState: string, userRole?: string): string[] {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) return [];

    return workflow.transitions
      .filter(t => {
        const fromMatch = Array.isArray(t.from)
          ? t.from.includes(currentState)
          : t.from === currentState;
        if (!fromMatch) return false;
        if (!t.roles || t.roles.length === 0) return true;
        return !userRole || t.roles.includes(userRole);
      })
      .map(t => t.action);
  }

  private registerDefaultWorkflows(): void {
    // Incident workflow
    this.registerWorkflow('incident', {
      name: 'incident',
      initialState: 'new',
      transitions: [
        { from: 'new', to: 'assigned', action: 'assign' },
        { from: ['new', 'assigned'], to: 'in_progress', action: 'start_work' },
        { from: 'in_progress', to: 'pending', action: 'set_pending' },
        { from: 'in_progress', to: 'on_hold', action: 'set_on_hold' },
        { from: ['pending', 'on_hold'], to: 'in_progress', action: 'resume' },
        { from: ['in_progress', 'pending', 'on_hold'], to: 'resolved', action: 'resolve' },
        { from: 'resolved', to: 'closed', action: 'close' },
        { from: ['resolved', 'closed'], to: 'reopened', action: 'reopen' },
        {
          from: ['new', 'assigned', 'in_progress'],
          to: 'cancelled',
          action: 'cancel',
          roles: ['admin', 'super_admin', 'service_desk'],
        },
      ],
    });

    // Change workflow
    this.registerWorkflow('change', {
      name: 'change',
      initialState: 'draft',
      transitions: [
        { from: 'draft', to: 'submitted', action: 'submit' },
        {
          from: 'submitted',
          to: 'under_review',
          action: 'start_review',
          roles: ['change_manager', 'admin', 'super_admin'],
        },
        {
          from: ['submitted', 'under_review'],
          to: 'approved',
          action: 'approve',
          roles: ['change_manager', 'approver', 'admin', 'super_admin'],
        },
        {
          from: ['submitted', 'under_review'],
          to: 'rejected',
          action: 'reject',
          roles: ['change_manager', 'approver', 'admin', 'super_admin'],
        },
        { from: 'approved', to: 'scheduled', action: 'schedule' },
        { from: ['approved', 'scheduled'], to: 'in_progress', action: 'implement' },
        { from: 'in_progress', to: 'implemented', action: 'complete' },
        { from: 'in_progress', to: 'failed', action: 'fail' },
        { from: 'failed', to: 'rolled_back', action: 'rollback' },
        { from: ['implemented', 'rolled_back', 'failed'], to: 'closed', action: 'close' },
        { from: ['draft', 'submitted', 'rejected'], to: 'cancelled', action: 'cancel' },
      ],
    });

    // Service Request workflow
    this.registerWorkflow('service_request', {
      name: 'service_request',
      initialState: 'new',
      transitions: [
        { from: 'new', to: 'pending_approval', action: 'submit_for_approval' },
        { from: 'new', to: 'assigned', action: 'assign_direct' },
        {
          from: 'pending_approval',
          to: 'approved',
          action: 'approve',
          roles: ['approver', 'admin', 'super_admin'],
        },
        {
          from: 'pending_approval',
          to: 'rejected',
          action: 'reject',
          roles: ['approver', 'admin', 'super_admin'],
        },
        { from: ['new', 'approved'], to: 'assigned', action: 'assign' },
        { from: 'assigned', to: 'in_progress', action: 'start_work' },
        { from: 'in_progress', to: 'pending', action: 'set_pending' },
        { from: 'pending', to: 'in_progress', action: 'resume' },
        { from: ['in_progress', 'assigned'], to: 'fulfilled', action: 'fulfill' },
        { from: 'fulfilled', to: 'closed', action: 'close' },
        {
          from: ['new', 'pending_approval', 'approved', 'assigned'],
          to: 'cancelled',
          action: 'cancel',
        },
      ],
    });
  }
}
