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
    if (!['SUPER_ADMIN', 'OFFICER', 'STAFF', 'STORE_KEEPER', 'GUEST'].includes(role)) return false;

    // 1. SUPER_ADMIN has unrestricted permissions across all resources and actions
    if (role === 'SUPER_ADMIN') {
      return true;
    }

    // 2. GUEST (Visitor): Read-Only access across all views, strictly NO CREATE / UPDATE / DELETE
    if (role === 'GUEST') {
      return action === 'READ';
    }

    // 3. STORE_KEEPER: Full store management + read-only on assets
    if (role === 'STORE_KEEPER') {
      if (action === 'READ') return true;
      if (resource.startsWith('store_')) {
        return action === 'CREATE' || action === 'UPDATE';
      }
      return false;
    }

    // 4. OFFICER (Executive Arjun Kumar & Outsource MTS / Rep Pinki Sharma) Permissions:
    // - P.Way Maintenance & Track Defects: Allowed to CREATE and UPDATE
    // - Attendance & Leave Tagging: Allowed to CREATE and UPDATE
    // - Assets (Bridges, Points, Curves, LWR, SEJ): Read-Only
    // - DELETE: Blocked (requires Super Admin APM approval)
    if (role === 'OFFICER') {
      if (action === 'READ') return true;
      if (action === 'GENERATE_QR') return true;

      if (action === 'CREATE' || action === 'UPDATE') {
        const allowedMutationResources = [
          'track_defects',
          'pway_daily_progress',
          'pway_monthly_program',
          'pway_inspections',
          'staff_attendance',
          'attendance_holidays',
          'store_items',
          'store_transactions',
          'store_categories',
          'store_inventory'
        ];
        return allowedMutationResources.includes(resource) || resource.startsWith('store_');
      }

      // Deletion is strictly blocked for Executive / Officer - must go through APM approval
      return false;
    }

    // 5. STAFF (All 5 MTS: Gautam, Ranjeet, Sudhir, Suraj, Sanni) Permissions:
    // - Strictly CAN ONLY CREATE and UPDATE Track Maintenance / Gang Work ('pway_daily_progress')
    // - Read-Only for Assets, Staff Directory, and Inspection logs
    // - Cannot edit assets, directory, or delete any records
    if (role === 'STAFF') {
      if (action === 'READ') {
        return true;
      }

      // MTS can ONLY CREATE and UPDATE daily gang work progress
      if ((action === 'CREATE' || action === 'UPDATE') && (resource === 'pway_daily_progress' || resource === 'track_gang_work')) {
        return true;
      }

      if (action === 'GENERATE_QR' && resource === 'self') {
        return true;
      }

      // Staff cannot perform any mutations on assets or attendance or delete anything
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
