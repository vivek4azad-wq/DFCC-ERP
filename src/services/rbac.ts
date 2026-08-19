/**
 * Role-Based Access Control (RBAC) Service & Permissions Matrix
 * DFCCIL IMSD SMUN Unit
 * 
 * Rules:
 * 1. SUPER_ADMIN (Shri Vivek Kumar Azad, APM/Civil): Full master read/write/delete/admin across all modules, approval of deletions, and historical attendance.
 * 2. OFFICER (Executive / Arjun):
 *    - P.Way Maintenance & Track Defects: Full CREATE & UPDATE permission (can edit, add, rectify).
 *    - Assets (Bridges, Points, Curves, LWR, SEJ): Read-Only (no edits in assets).
 *    - DELETION: CANNOT delete directly. Deletion requests go to APM (Shri Vivek Kumar Azad) for approval.
 * 3. STAFF / MTS: Can only do data entry for Today's 1+15 Gang Daily Work Progress. Read-only on assets.
 */

import type { UserRole, UserSession } from '../types/index.ts';

export type RbacAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'ADMIN_PANEL'
  | 'GENERATE_PIN'
  | 'GENERATE_QR';

export class RBACService {
  /**
   * Evaluates whether a role can perform an action on a target resource.
   */
  static canPerform(
    role: UserRole | string | null | undefined,
    action: RbacAction,
    resource: string
  ): boolean {
    if (!role || !action || !resource) return false;
    if (!['SUPER_ADMIN', 'OFFICER', 'STAFF'].includes(role)) return false;

    // 1. SUPER_ADMIN has unrestricted permissions across all resources and actions
    if (role === 'SUPER_ADMIN') {
      return true;
    }

    // 2. OFFICER (Executive / Arjun) Permissions:
    // - P.Way Maintenance & Track Defects: Allowed to CREATE and UPDATE
    // - Assets (Bridges, Points, Curves, LWR, SEJ): Read-Only
    // - DELETE: Blocked (requires Super Admin APM approval)
    if (role === 'OFFICER') {
      if (action === 'READ') return true;
      if (action === 'GENERATE_QR') return true;

      // Executive / Arjun can edit/create Track Defects & P-Way Maintenance modules
      if (action === 'CREATE' || action === 'UPDATE') {
        const allowedMutationResources = [
          'track_defects',
          'pway_daily_progress',
          'pway_monthly_program',
          'pway_inspections'
        ];
        return allowedMutationResources.includes(resource);
      }

      // Deletion is strictly blocked for Executive - must go through APM approval
      return false;
    }

    // 3. STAFF (MTS) Permissions: Gang Working Data Entry Only, Read-Only for Assets
    if (role === 'STAFF') {
      if (action === 'READ') {
        const allowedReadResources = [
          'bridges',
          'level_crossings',
          'points_crossings',
          'curves',
          'track_defects',
          'officers_staff',
          'keymen',
          'patrol_shifts',
          'jurisdiction',
          'pway_daily_progress',
          'pway_monthly_program',
          'pway_inspections'
        ];
        return allowedReadResources.includes(resource);
      }

      // MTS can CREATE and UPDATE daily gang progress for current day
      if ((action === 'CREATE' || action === 'UPDATE') && resource === 'pway_daily_progress') {
        return true;
      }

      if (action === 'GENERATE_QR' && resource === 'self') {
        return true;
      }

      // Staff cannot perform any mutations on assets or delete anything
      return false;
    }

    return false;
  }

  static canAccessAdminPanel(user: UserSession | null): boolean {
    return this.canPerform(user?.role, 'ADMIN_PANEL', 'admin');
  }

  static canCreateOrEditDefect(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICER';
  }

  static canCreateOrEditPWay(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN' || user?.role === 'OFFICER' || user?.role === 'STAFF';
  }

  static canDeleteDirectly(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }

  static canManageUsers(user: UserSession | null): boolean {
    return user?.role === 'SUPER_ADMIN';
  }
}
