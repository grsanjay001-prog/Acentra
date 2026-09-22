import { Resource, Booking } from '../types';

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-or-cardio',
    name: 'OR-1: Cardiothoracic Surgical Suite',
    type: 'ROOM',
    capacity: 1,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-or-neuro',
    name: 'OR-3: Neuro-Trauma Hybrid Theatre',
    type: 'ROOM',
    capacity: 1,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-mri-3t',
    name: 'MAGNETOM Vida 3T MRI Scanner',
    type: 'MACHINE',
    capacity: 1,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-robotic-xi',
    name: 'Da Vinci Xi Robotic Surgery Suite',
    type: 'EQUIPMENT',
    capacity: 1,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-trauma-bay',
    name: 'Trauma Bay 1: Emergency Resuscitation',
    type: 'ROOM',
    capacity: 1,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'res-genomic-pacs',
    name: 'PACS Pathology AI Analysis Cluster',
    type: 'COMPUTE',
    capacity: 1,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

// Fallback initial bookings for the day
export const getFallbackBookings = (dateStr: string): Booking[] => [
  {
    id: 'bk-seed-01',
    resourceId: 'res-or-cardio',
    userId: 'dr.sanjay@hospital.org',
    startTime: `${dateStr}T14:00:00.000Z`,
    endTime: `${dateStr}T15:00:00.000Z`,
    status: 'CONFIRMED',
    idempotencyKey: 'seed-key-1',
    version: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bk-seed-02',
    resourceId: 'res-mri-3t',
    userId: 'dr.sarah@hospital.org',
    startTime: `${dateStr}T10:00:00.000Z`,
    endTime: `${dateStr}T11:00:00.000Z`,
    status: 'CONFIRMED',
    idempotencyKey: 'seed-key-2',
    version: 1,
    createdAt: new Date().toISOString(),
  },
];

