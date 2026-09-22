export type ResourceType = 'ROOM' | 'EQUIPMENT' | 'MACHINE' | 'COMPUTE';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE';
  createdAt: string;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string; // ISO string e.g. "2026-09-22T09:00:00.000Z"
  endTime: string;   // ISO string e.g. "2026-09-22T10:00:00.000Z"
  status: BookingStatus;
  idempotencyKey: string;
  version: number;
  createdAt: string;
}

export type AuditAction = 
  | 'BOOKING_CREATED'
  | 'CONFLICT_DETECTED'
  | 'BOOKING_CANCELLED'
  | 'RESOURCE_CREATED'
  | 'IDEMPOTENT_RETRY'
  | 'CHAOS_RUN_EXECUTED';

export interface AuditEvent {
  id: string;
  action: AuditAction;
  entityType: 'RESOURCE' | 'BOOKING' | 'CHAOS';
  entityId: string;
  timestampUtc: string;
  meta: Record<string, any>;
}

export interface ConflictResponse {
  error: 'Conflict';
  message: string;
  resource: {
    id: string;
    name: string;
  };
  requestedTime: {
    startTime: string;
    endTime: string;
  };
  conflictWith?: {
    bookingId: string;
    userId: string;
    startTime: string;
    endTime: string;
    bookedAt: string;
  };
  hasAlternatives: boolean;
  alternatives: Array<{
    startTime: string;
    endTime: string;
    label: string;
  }>;
}

export interface ChaosRunResult {
  runId: string;
  resourceId: string;
  slot: {
    startTime: string;
    endTime: string;
  };
  totalRequests: number;
  confirmedCount: number;
  rejectedCount: number;
  winningBookingId?: string;
  winningUserId?: string;
  elapsedMs: number;
  responses: Array<{
    requestId: number;
    userId: string;
    status: number;
    isConfirmed: boolean;
    durationMs: number;
    error?: string;
    bookingId?: string;
  }>;
}
