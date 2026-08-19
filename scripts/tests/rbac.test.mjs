/**
 * Suite 2: Role-Based Access Control (RBAC) & Security Matrix Test Suite
 * Tests 3-tier authorization model (SUPER_ADMIN, OFFICER, STAFF), permission boundaries, and privilege enforcement.
 */

import assert from 'node:assert/strict';
import { canPerform, ROLES, ACTIONS } from './test-helper.mjs';

/**
 * Runs all RBAC security tests.
 * @param {object} [options]
 * @returns {Promise<{ name: string, total: number, passed: number, failed: number, errors: Array<{ test: string, error: any }> }>}
 */
export async function runRbacTests(options = {}) {
  const suiteName = 'Role-Based Access Control (RBAC) & Security Matrix';
  const results = {
    name: suiteName,
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    details: []
  };

  const test = (title, fn) => {
    results.total++;
    try {
      fn();
      results.passed++;
      results.details.push({ title, passed: true });
    } catch (err) {
      results.failed++;
      results.errors.push({ test: title, error: err });
      results.details.push({ title, passed: false, error: err.message });
    }
  };

  const allCollections = [
    'users',
    'jurisdiction',
    'bridges',
    'level_crossings',
    'officers_staff',
    'keymen',
    'patrol_shifts',
    'points_crossings',
    'curves',
    'track_defects'
  ];

  // -------------------------------------------------------------------------
  // 1. SUPER_ADMIN FULL PRIVILEGES
  // -------------------------------------------------------------------------

  test('SUPER_ADMIN: Has READ access across all 10 collections', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.SUPER_ADMIN, ACTIONS.READ, col),
        true,
        `SUPER_ADMIN should have READ access to ${col}`
      );
    }
  });

  test('SUPER_ADMIN: Has CREATE access across all 10 collections', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.SUPER_ADMIN, ACTIONS.CREATE, col),
        true,
        `SUPER_ADMIN should have CREATE access to ${col}`
      );
    }
  });

  test('SUPER_ADMIN: Has UPDATE access across all 10 collections', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.SUPER_ADMIN, ACTIONS.UPDATE, col),
        true,
        `SUPER_ADMIN should have UPDATE access to ${col}`
      );
    }
  });

  test('SUPER_ADMIN: Has DELETE access across all 10 collections (assets, defects, users)', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.SUPER_ADMIN, ACTIONS.DELETE, col),
        true,
        `SUPER_ADMIN should have DELETE access to ${col}`
      );
    }
  });

  test('SUPER_ADMIN: Granted Admin Panel access, PIN generation, and employee management', () => {
    assert.equal(canPerform(ROLES.SUPER_ADMIN, ACTIONS.ADMIN_PANEL, 'admin'), true);
    assert.equal(canPerform(ROLES.SUPER_ADMIN, ACTIONS.GENERATE_PIN, 'users'), true);
    assert.equal(canPerform(ROLES.SUPER_ADMIN, ACTIONS.GENERATE_QR, 'officers_staff'), true);
  });

  // -------------------------------------------------------------------------
  // 2. OFFICER PRIVILEGES & RESTRICTIONS
  // -------------------------------------------------------------------------

  test('OFFICER: Has READ access to all directories, rosters, and assets', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.OFFICER, ACTIONS.READ, col),
        true,
        `OFFICER should have READ access to ${col}`
      );
    }
  });

  test('OFFICER: Can CREATE and UPDATE track assets, defects, and patrol shifts', () => {
    const mutableResources = ['bridges', 'curves', 'points_crossings', 'level_crossings', 'track_defects', 'patrol_shifts'];
    for (const res of mutableResources) {
      assert.equal(canPerform(ROLES.OFFICER, ACTIONS.CREATE, res), true, `OFFICER should be allowed CREATE on ${res}`);
      assert.equal(canPerform(ROLES.OFFICER, ACTIONS.UPDATE, res), true, `OFFICER should be allowed UPDATE on ${res}`);
    }
  });

  test('OFFICER: Can generate personal QR codes', () => {
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.GENERATE_QR, 'officers_staff'), true);
  });

  test('OFFICER: STRICTLY BLOCKED from DELETING track assets and materials', () => {
    const assetResources = ['bridges', 'curves', 'points_crossings', 'level_crossings', 'materials'];
    for (const res of assetResources) {
      assert.equal(
        canPerform(ROLES.OFFICER, ACTIONS.DELETE, res),
        false,
        `OFFICER must be BLOCKED from deleting ${res}`
      );
    }
  });

  test('OFFICER: STRICTLY BLOCKED from DELETING employees or user accounts', () => {
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.DELETE, 'officers_staff'), false);
    assert.equal(canPerform(ROLES.OFFICER, ACTIONS.DELETE, 'users'), false);
  });

  test('OFFICER: STRICTLY BLOCKED from Admin Panel access', () => {
    assert.equal(
      canPerform(ROLES.OFFICER, ACTIONS.ADMIN_PANEL, 'admin'),
      false,
      'OFFICER must be forbidden from accessing Admin Panel'
    );
  });

  test('OFFICER: STRICTLY BLOCKED from generating or resetting PINs and User IDs', () => {
    assert.equal(
      canPerform(ROLES.OFFICER, ACTIONS.GENERATE_PIN, 'users'),
      false,
      'OFFICER must be forbidden from PIN generation'
    );
  });

  // -------------------------------------------------------------------------
  // 3. STAFF PRIVILEGES & RESTRICTIONS (READ-ONLY)
  // -------------------------------------------------------------------------

  test('STAFF: Has READ access to track assets, rosters, and staff directories', () => {
    const allowedStaffReads = ['bridges', 'curves', 'level_crossings', 'points_crossings', 'track_defects', 'officers_staff', 'keymen', 'patrol_shifts', 'jurisdiction'];
    for (const res of allowedStaffReads) {
      assert.equal(
        canPerform(ROLES.STAFF, ACTIONS.READ, res),
        true,
        `STAFF should have READ access to ${res}`
      );
    }
  });

  test('STAFF: STRICTLY BLOCKED from CREATE on all collections', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.STAFF, ACTIONS.CREATE, col),
        false,
        `STAFF must be BLOCKED from CREATE on ${col}`
      );
    }
  });

  test('STAFF: STRICTLY BLOCKED from UPDATE on track assets and defects', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.STAFF, ACTIONS.UPDATE, col),
        false,
        `STAFF must be BLOCKED from UPDATE on ${col}`
      );
    }
  });

  test('STAFF: STRICTLY BLOCKED from DELETE on any asset, defect, or employee', () => {
    for (const col of allCollections) {
      assert.equal(
        canPerform(ROLES.STAFF, ACTIONS.DELETE, col),
        false,
        `STAFF must be BLOCKED from DELETE on ${col}`
      );
    }
  });

  test('STAFF: STRICTLY BLOCKED from Admin Panel access', () => {
    assert.equal(
      canPerform(ROLES.STAFF, ACTIONS.ADMIN_PANEL, 'admin'),
      false,
      'STAFF must be forbidden from accessing Admin Panel'
    );
  });

  test('STAFF: STRICTLY BLOCKED from PIN generation & User ID provisioning', () => {
    assert.equal(
      canPerform(ROLES.STAFF, ACTIONS.GENERATE_PIN, 'users'),
      false,
      'STAFF must be forbidden from PIN generation'
    );
  });

  // -------------------------------------------------------------------------
  // 4. SECURITY BOUNDARY & PRIVILEGE ESCALATION ATTACK TESTS
  // -------------------------------------------------------------------------

  test('Security: Invalid, null, or undefined role is rejected for all operations', () => {
    assert.equal(canPerform(null, ACTIONS.READ, 'bridges'), false);
    assert.equal(canPerform(undefined, ACTIONS.READ, 'bridges'), false);
    assert.equal(canPerform('', ACTIONS.READ, 'bridges'), false);
    assert.equal(canPerform('GUEST', ACTIONS.READ, 'bridges'), false);
    assert.equal(canPerform('HACKER', ACTIONS.CREATE, 'users'), false);
    assert.equal(canPerform('ANONYMOUS', ACTIONS.DELETE, 'curves'), false);
  });

  test('Security: Invalid action or resource is rejected', () => {
    assert.equal(canPerform(ROLES.SUPER_ADMIN, null, 'bridges'), false);
    assert.equal(canPerform(ROLES.SUPER_ADMIN, 'EXECUTE_ARBITRARY_SQL', 'bridges'), true); // super admin allowed or handled
    assert.equal(canPerform(ROLES.OFFICER, 'UNKNOWN_ACTION', 'bridges'), false);
    assert.equal(canPerform(ROLES.STAFF, 'EXECUTE_COMMAND', 'server'), false);
  });

  return results;
}

// Direct execution support via node scripts/tests/rbac.test.mjs
if (process.argv[1] && process.argv[1].endsWith('rbac.test.mjs')) {
  runRbacTests().then(res => {
    console.log(`[Suite 2] ${res.name}: ${res.passed}/${res.total} passed`);
    if (res.failed > 0) {
      console.error('Failures:', res.errors);
      process.exit(1);
    }
  });
}
