import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { ChaosRunResult } from './src/types';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  const PORT = 3000;

  app.use(express.json());

  // Socket.io connection handling
  io.on('connection', (socket) => {
    // Send immediate initial sync
    socket.emit('connected', { id: socket.id, timestamp: new Date().toISOString() });
  });

  // REST API Routes
  
  // 1. Resources
  app.get('/api/resources', (req: Request, res: Response) => {
    const resources = db.getResources();
    res.json({ resources });
  });

  app.post('/api/resources', (req: Request, res: Response) => {
    try {
      const { name, type, capacity, status } = req.body;
      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
      }
      const newResource = db.createResource({
        name,
        type,
        capacity: Number(capacity) || 1,
        status: status || 'ACTIVE',
      });
      io.emit('resource_created', newResource);
      res.status(201).json({ resource: newResource });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Bookings
  app.get('/api/bookings', (req: Request, res: Response) => {
    const resourceId = req.query.resourceId as string | undefined;
    const date = req.query.date as string | undefined;
    const bookings = db.getBookings(resourceId, date);
    res.json({ bookings });
  });

  app.post('/api/bookings', async (req: Request, res: Response) => {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
    const { resourceId, userId, startTime, endTime } = req.body;

    if (!resourceId || !userId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'resourceId, userId, startTime, and endTime are required.',
      });
    }

    try {
      const { booking, isIdempotentRetry } = await db.createBooking({
        resourceId,
        userId,
        startTime,
        endTime,
        idempotencyKey,
      });

      // Broadcast real-time update to all connected clients
      io.emit('calendar_updated', {
        type: 'BOOKING_CONFIRMED',
        booking,
        resourceId,
        startTime,
        endTime,
        isIdempotentRetry,
        timestamp: new Date().toISOString(),
      });

      io.emit('audit_event', db.getAuditEvents(1)[0]);

      const statusCode = isIdempotentRetry ? 200 : 201;
      return res.status(statusCode).json({
        success: true,
        booking,
        isIdempotentRetry,
      });
    } catch (err: any) {
      if (err.status === 409 && err.conflictData) {
        // Broadcast conflict event to show live warning on competing browsers
        io.emit('conflict_occurred', {
          resourceId,
          startTime,
          endTime,
          rejectedUser: userId,
          winningBooking: err.conflictData.conflictWith,
          timestamp: new Date().toISOString(),
        });

        io.emit('audit_event', db.getAuditEvents(1)[0]);

        return res.status(409).json(err.conflictData);
      }

      return res.status(500).json({
        error: 'ServerError',
        message: err.message || 'Internal server error',
      });
    }
  });

  // 3. Cancel Booking
  app.post('/api/bookings/:id/cancel', async (req: Request, res: Response) => {
    try {
      const bookingId = req.params.id;
      const { userId } = req.body;
      const updatedBooking = await db.cancelBooking(bookingId, userId);

      io.emit('calendar_updated', {
        type: 'BOOKING_CANCELLED',
        booking: updatedBooking,
        resourceId: updatedBooking.resourceId,
        startTime: updatedBooking.startTime,
        endTime: updatedBooking.endTime,
        timestamp: new Date().toISOString(),
      });

      io.emit('audit_event', db.getAuditEvents(1)[0]);

      res.json({ success: true, booking: updatedBooking });
    } catch (err: any) {
      res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
    }
  });

  // 4. Audit Log
  app.get('/api/audit', (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 100;
    const events = db.getAuditEvents(limit);
    res.json({ events });
  });

  // 5. Chaos Button Simulator
  // Hits one slot with N (e.g. 50-100) simultaneous requests
  app.post('/api/chaos', async (req: Request, res: Response) => {
    const { resourceId, startTime, endTime, requestCount = 100 } = req.body;
    const count = Math.min(Math.max(Number(requestCount) || 50, 10), 100);

    const resource = db.getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: `Resource ${resourceId} not found` });
    }

    const runId = `chaos-${Date.now()}`;
    const startTimeStamp = performance.now();

    const requestPromises = Array.from({ length: count }, async (_, index) => {
      const requestId = index + 1;
      const fakeUserId = `chaos.agent.${requestId.toString().padStart(3, '0')}@swarm.io`;
      const idempotencyKey = `chaos-key-${runId}-${requestId}`;
      const reqStart = performance.now();

      try {
        const { booking } = await db.createBooking({
          resourceId,
          userId: fakeUserId,
          startTime,
          endTime,
          idempotencyKey,
        });
        const reqEnd = performance.now();
        return {
          requestId,
          userId: fakeUserId,
          status: 201,
          isConfirmed: true,
          durationMs: Number((reqEnd - reqStart).toFixed(2)),
          bookingId: booking.id,
        };
      } catch (err: any) {
        const reqEnd = performance.now();
        return {
          requestId,
          userId: fakeUserId,
          status: err.status || 500,
          isConfirmed: false,
          durationMs: Number((reqEnd - reqStart).toFixed(2)),
          error: err.conflictData?.message || err.message,
        };
      }
    });

    const responses = await Promise.all(requestPromises);
    const endTimeStamp = performance.now();
    const totalElapsedMs = Number((endTimeStamp - startTimeStamp).toFixed(2));

    const confirmed = responses.filter((r) => r.isConfirmed);
    const rejected = responses.filter((r) => !r.isConfirmed);

    const winning = confirmed[0];

    const chaosResult: ChaosRunResult = {
      runId,
      resourceId,
      slot: { startTime, endTime },
      totalRequests: count,
      confirmedCount: confirmed.length,
      rejectedCount: rejected.length,
      winningBookingId: winning?.bookingId,
      winningUserId: winning?.userId,
      elapsedMs: totalElapsedMs,
      responses,
    };

    db.recordAudit({
      action: 'CHAOS_RUN_EXECUTED',
      entityType: 'CHAOS',
      entityId: runId,
      meta: {
        totalRequests: count,
        confirmed: confirmed.length,
        rejected: rejected.length,
        resourceName: resource.name,
        slot: `${startTime} - ${endTime}`,
        elapsedMs: totalElapsedMs,
      },
    });

    // Notify clients of the chaos storm result
    io.emit('chaos_completed', chaosResult);
    io.emit('calendar_updated', {
      type: 'CHAOS_RUN',
      resourceId,
      startTime,
      endTime,
      winningBookingId: winning?.bookingId,
      timestamp: new Date().toISOString(),
    });
    io.emit('audit_event', db.getAuditEvents(1)[0]);

    return res.json(chaosResult);
  });

  // 6. Reset database
  app.post('/api/reset', (req: Request, res: Response) => {
    db.resetData();
    io.emit('data_reset', { timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  });

  // Vite Middleware / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Concurrency-Safe Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
