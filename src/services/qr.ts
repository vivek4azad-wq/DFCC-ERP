/**
 * QR Code Serialization & Parsing Utilities
 * DFCCIL IMSD SMUN Unit
 */

import type { OfficerStaffRecord, StaffQRPayload, UserRole } from '../types/index.ts';

export function generateStaffQRPayload(staff: Partial<OfficerStaffRecord> & { id: string; name: string }): string {
  if (!staff || !staff.id) {
    throw new Error('Invalid staff record provided for QR generation');
  }

  const payload: StaffQRPayload = {
    app: 'RailDiary-DFCCIL',
    ver: '1.0',
    qrId: staff.qrCodeId || `AG-STAFF-${staff.id}`,
    staffId: staff.id,
    name: staff.name || '',
    designation: staff.post || (staff as any).designation || '',
    role: (staff.role as UserRole) || 'STAFF',
    unit: 'IMSD SMUN',
    section: staff.assignedSection || 'SMUN Jurisdiction',
    phone: staff.phone || '',
    email: staff.email || '',
    bloodGroup: staff.bloodGroup || undefined,
    awpoId: staff.awpoId || null
  };

  return JSON.stringify(payload);
}

export function parseStaffQRPayload(rawString: string): StaffQRPayload {
  if (typeof rawString !== 'string' || !rawString.trim()) {
    throw new Error('Empty QR code payload string');
  }

  try {
    const data = JSON.parse(rawString);
    if (data.app !== 'RailDiary-DFCCIL') {
      throw new Error(`Unrecognized app signature in QR payload: ${data.app}`);
    }
    if (!data.staffId || !data.name || !data.designation) {
      throw new Error('Missing mandatory employee fields in QR payload');
    }
    return data as StaffQRPayload;
  } catch (err: any) {
    throw new Error(`Failed to parse staff QR payload: ${err.message}`);
  }
}
