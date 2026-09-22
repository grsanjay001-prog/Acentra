import { Resource, Booking, AuditEvent, ConflictResponse, ChaosRunResult } from '../src/types';

// Mutex for key-based row-level locking (emulating PostgreSQL SELECT ... FOR UPDATE / SERIALIZABLE transaction)
class KeyMutex {
  private queues: Map<string, Array<() => void>> = new Map();

  async acquire(key: string): Promise<() => void> {
    if (!this.queues.has(key)) {
      this.queues.set(key, []);
      return () => this.release(key);
    }

    return new Promise((resolve) => {
      this.queues.get(key)!.push(() => {
        resolve(() => this.release(key));
      });
    });
  }

  private release(key: string) {
    const queue = this.queues.get(key);
    if (!queue || queue.length === 0) {
      this.queues.delete(key);
      return;
    }
    const next = queue.shift();
    if (next) next();
  }
}

class TransactionalDatabase {
  private resources: Map<string, Resource> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private auditEvents: AuditEvent[] = [];
  private lock = new KeyMutex();

  constructor() {
    this.seedInitialData();
  }

  public resetData() {
    this.resources.clear();
    this.bookings.clear();
    this.auditEvents = [];
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Seed hospital critical care resources
    const initialResources: Resource[] = [
      {
        id: 'res-or-cardio',
        name: 'OR-1: Cardiothoracic Surgical Suite',
        type: 'ROOM',
        capacity: 1,
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
      {
        id: 'res-or-neuro',
        name: 'OR-3: Neuro-Trauma Hybrid Theatre',
        type: 'ROOM',
        capacity: 1,
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
      {
        id: 'res-mri-3t',
        name: 'MAGNETOM Vida 3T MRI Scanner',
        type: 'MACHINE',
        capacity: 1,
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
      {
        id: 'res-robotic-xi',
        name: 'Da Vinci Xi Robotic Surgery Suite',
        type: 'EQUIPMENT',
        capacity: 1,
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
      {
        id: 'res-trauma-bay',
        name: 'Trauma Bay 1: Emergency Resuscitation',
        type: 'ROOM',
        capacity: 1,
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
      {
        id: 'res-genomic-pacs',
        name: 'PACS Pathology AI Analysis Cluster',
        type: 'COMPUTE',
        capacity: 1,
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 86400000).toISOString(),
      },
    ];

    for (const res of initialResources) {
      this.resources.set(res.id, res);
      this.recordAudit({
        action: 'RESOURCE_CREATED',
        entityType: 'RESOURCE',
        entityId: res.id,
        meta: { name: res.name, capacity: res.capacity, type: res.type },
      });
    }

    // Seed medical procedure reservations
    const seedBookings: Partial<Booking>[] = [
      {
        id: 'b-seed-1',
        resourceId: 'res-or-cardio',
        userId: 'dr.sanjay@hospital.org',
        startTime: `${todayStr}T14:00:00.000Z`,
        endTime: `${todayStr}T15:00:00.000Z`,
        status: 'CONFIRMED',
        idempotencyKey: 'seed-key-1',
        version: 1,
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
      },
      {
        id: 'b-seed-2',
        resourceId: 'res-mri-3t',
        userId: 'dr.sarah@hospital.org',
        startTime: `${todayStr}T10:00:00.000Z`,
        endTime: `${todayStr}T11:00:00.000Z`,
        status: 'CONFIRMED',
        idempotencyKey: 'seed-key-2',
        version: 1,
        createdAt: new Date(now.getTime() - 7200000).toISOString(),
      },
    ];

    for (const b of seedBookings) {
      const fullBooking: Booking = {
        id: b.id!,
        resourceId: b.resourceId!,
        userId: b.userId!,
        startTime: b.startTime!,
        endTime: b.endTime!,
        status: b.status!,
        idempotencyKey: b.idempotencyKey!,
        version: b.version!,
        createdAt: b.createdAt!,
      };
      this.bookings.set(fullBooking.id, fullBooking);
      this.recordAudit({
        action: 'BOOKING_CREATED',
        entityType: 'BOOKING',
        entityId: fullBooking.id,
        meta: {
          resourceId: fullBooking.resourceId,
          userId: fullBooking.userId,
          startTime: fullBooking.startTime,
          endTime: fullBooking.endTime,
          isSeed: true,
        },
      });
    }
  }

  // Resources
  public getResources(): Resource[] {
    return Array.from(this.resources.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  public getResourceById(id: string): Resource | undefined {
    return this.resources.get(id);
  }

  public createResource(data: Omit<Resource, 'id' | 'createdAt'>): Resource {
    const id = `res-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newRes: Resource = {
      id,
      name: data.name.trim(),
      type: data.type,
      capacity: Math.max(1, data.capacity || 1),
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.resources.set(id, newRes);
    this.recordAudit({
      action: 'RESOURCE_CREATED',
      entityType: 'RESOURCE',
      entityId: id,
      meta: { name: newRes.name, type: newRes.type, capacity: newRes.capacity },
    });
    return newRes;
  }

  // Bookings
  public getBookings(resourceId?: string, dateStr?: string): Booking[] {
    let list = Array.from(this.bookings.values());
    if (resourceId) {
      list = list.filter((b) => b.resourceId === resourceId);
    }
    if (dateStr) {
      list = list.filter((b) => b.startTime.startsWith(dateStr));
    }
    return list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  // Find confirmed overlaps: existingStart < requestedEnd AND existingEnd > requestedStart
  private findConfirmedOverlaps(resourceId: string, startTime: string, endTime: string): Booking[] {
    const reqStart = new Date(startTime).getTime();
    const reqEnd = new Date(endTime).getTime();

    const overlaps: Booking[] = [];
    for (const b of this.bookings.values()) {
      if (b.resourceId === resourceId && b.status === 'CONFIRMED') {
        const bStart = new Date(b.startTime).getTime();
        const bEnd = new Date(b.endTime).getTime();

        if (bStart < reqEnd && bEnd > reqStart) {
          overlaps.push(b);
        }
      }
    }
    return overlaps;
  }

  // Find 2-3 nearby open slots for suggestions
  public findAlternativeSlots(resourceId: string, requestedStartTime: string, durationMs: number = 3600000): Array<{ startTime: string; endTime: string; label: string }> {
    const targetDate = new Date(requestedStartTime);
    const datePrefix = requestedStartTime.split('T')[0];
    const workingHours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    const alternatives: Array<{ startTime: string; endTime: string; label: string }> = [];

    for (const hour of workingHours) {
      const slotStart = new Date(`${datePrefix}T${hour.toString().padStart(2, '0')}:00:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + durationMs);

      // Skip if this is the exact same slot that was requested
      if (slotStart.toISOString() === requestedStartTime) continue;

      const overlaps = this.findConfirmedOverlaps(resourceId, slotStart.toISOString(), slotEnd.toISOString());
      const res = this.resources.get(resourceId);
      const capacity = res?.capacity || 1;

      if (overlaps.length < capacity) {
        alternatives.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          label: `${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00 UTC`,
        });
      }

      if (alternatives.length >= 3) break;
    }

    return alternatives;
  }

  /**
   * Concurrency-Safe Booking Transaction
   * Emulates PostgreSQL SERIALIZABLE transaction with row-level locks on (resourceId, slot)
   */
  public async createBooking(params: {
    resourceId: string;
    userId: string;
    startTime: string;
    endTime: string;
    idempotencyKey?: string;
  }): Promise<{ booking: Booking; isIdempotentRetry: boolean }> {
    const { resourceId, userId, startTime, endTime } = params;
    const idempotencyKey = params.idempotencyKey || `key-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Resource validation
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource '${resourceId}' not found.`);
    }

    // Acquire lock for this resource to guarantee serializable isolation
    const lockKey = `res_lock_${resourceId}`;
    const releaseLock = await this.lock.acquire(lockKey);

    try {
      // 1. Idempotency Check:
      // If idempotencyKey is already used, return the existing booking (First writer result)
      for (const existing of this.bookings.values()) {
        if (existing.idempotencyKey === idempotencyKey && existing.status === 'CONFIRMED') {
          this.recordAudit({
            action: 'IDEMPOTENT_RETRY',
            entityType: 'BOOKING',
            entityId: existing.id,
            meta: {
              idempotencyKey,
              userId,
              resourceId,
              message: 'Returned original confirmed booking for identical idempotency key',
            },
          });
          return { booking: existing, isIdempotentRetry: true };
        }
      }

      // 2. Overlap Detection:
      // existingStart < requestedEnd AND existingEnd > requestedStart
      const overlaps = this.findConfirmedOverlaps(resourceId, startTime, endTime);

      if (overlaps.length >= resource.capacity) {
        // CONFLICT!
        const winningBooking = overlaps[0];
        const alternatives = this.findAlternativeSlots(resourceId, startTime);

        this.recordAudit({
          action: 'CONFLICT_DETECTED',
          entityType: 'BOOKING',
          entityId: winningBooking.id,
          meta: {
            requestedBy: userId,
            resourceId,
            resourceName: resource.name,
            requestedStartTime: startTime,
            requestedEndTime: endTime,
            conflictedWithBookingId: winningBooking.id,
            conflictedWithUser: winningBooking.userId,
            reason: `Overlapped with confirmed booking (${winningBooking.userId})`,
          },
        });

        const conflictError: any = new Error(`Conflict: Resource '${resource.name}' is already booked for this timeslot.`);
        conflictError.status = 409;
        conflictError.conflictData = {
          error: 'Conflict',
          message: `Resource '${resource.name}' is already booked for this timeslot by ${winningBooking.userId}.`,
          resource: {
            id: resource.id,
            name: resource.name,
          },
          requestedTime: {
            startTime,
            endTime,
          },
          conflictWith: {
            bookingId: winningBooking.id,
            userId: winningBooking.userId,
            startTime: winningBooking.startTime,
            endTime: winningBooking.endTime,
            bookedAt: winningBooking.createdAt,
          },
          hasAlternatives: alternatives.length > 0,
          alternatives,
        } as ConflictResponse;

        throw conflictError;
      }

      // 3. Commit Booking
      const bookingId = `b-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newBooking: Booking = {
        id: bookingId,
        resourceId,
        userId: userId.trim(),
        startTime,
        endTime,
        status: 'CONFIRMED',
        idempotencyKey,
        version: 1,
        createdAt: new Date().toISOString(),
      };

      this.bookings.set(bookingId, newBooking);

      this.recordAudit({
        action: 'BOOKING_CREATED',
        entityType: 'BOOKING',
        entityId: bookingId,
        meta: {
          resourceId,
          resourceName: resource.name,
          userId: newBooking.userId,
          startTime,
          endTime,
          idempotencyKey,
          version: newBooking.version,
        },
      });

      return { booking: newBooking, isIdempotentRetry: false };
    } finally {
      releaseLock();
    }
  }

  /**
   * Cancellation: Soft delete (status -> CANCELLED)
   */
  public async cancelBooking(bookingId: string, requestedByUserId?: string): Promise<Booking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking '${bookingId}' not found.`);
    }

    if (booking.status === 'CANCELLED') {
      return booking;
    }

    const lockKey = `res_lock_${booking.resourceId}`;
    const releaseLock = await this.lock.acquire(lockKey);

    try {
      booking.status = 'CANCELLED';
      booking.version += 1;

      this.recordAudit({
        action: 'BOOKING_CANCELLED',
        entityType: 'BOOKING',
        entityId: booking.id,
        meta: {
          resourceId: booking.resourceId,
          cancelledBy: requestedByUserId || booking.userId,
          startTime: booking.startTime,
          endTime: booking.endTime,
          version: booking.version,
        },
      });

      return booking;
    } finally {
      releaseLock();
    }
  }

  // Audit Events
  public recordAudit(data: Omit<AuditEvent, 'id' | 'timestampUtc'>): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      timestampUtc: new Date().toISOString(),
      meta: data.meta,
    };
    this.auditEvents.unshift(event);
    if (this.auditEvents.length > 500) {
      this.auditEvents.length = 500; // Cap memory usage
    }
    return event;
  }

  public getAuditEvents(limit: number = 100): AuditEvent[] {
    return this.auditEvents.slice(0, limit);
  }
}

export const db = new TransactionalDatabase();
