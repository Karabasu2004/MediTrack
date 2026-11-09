import type { Dose, Medicine } from '../types';
import { localDateString } from '../utils/dates';

const today = localDateString();
const yesterday = localDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
const twoDaysAgo = localDateString(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));

export const sampleMedicines: Medicine[] = [
  {
    id: 'medicine-paracetamol',
    name: 'Paracetamol',
    doseDescription: '1 tablet',
    notes: 'Take with a glass of water.',
    startDate: today,
    endDate: '2099-12-31',
    reminderTimes: ['08:00', '20:00'],
    active: true,
  },
  {
    id: 'medicine-vitamin-d',
    name: 'Vitamin D',
    doseDescription: '1 capsule',
    notes: '',
    startDate: today,
    endDate: '2099-12-31',
    reminderTimes: ['09:00'],
    active: true,
  },
];

export const sampleDoses: Dose[] = [
  {
    id: `paracetamol-${today}-0800`,
    medicineId: 'medicine-paracetamol',
    medicineName: 'Paracetamol',
    doseDescription: '1 tablet',
    scheduledDate: today,
    scheduledTime: '08:00',
    status: 'taken',
  },
  {
    id: `vitamin-d-${today}-0900`,
    medicineId: 'medicine-vitamin-d',
    medicineName: 'Vitamin D',
    doseDescription: '1 capsule',
    scheduledDate: today,
    scheduledTime: '09:00',
    status: 'pending',
  },
  {
    id: `paracetamol-${today}-2000`,
    medicineId: 'medicine-paracetamol',
    medicineName: 'Paracetamol',
    doseDescription: '1 tablet',
    scheduledDate: today,
    scheduledTime: '20:00',
    status: 'pending',
  },
  {
    id: `vitamin-d-${yesterday}-0900`,
    medicineId: 'medicine-vitamin-d',
    medicineName: 'Vitamin D',
    doseDescription: '1 capsule',
    scheduledDate: yesterday,
    scheduledTime: '09:00',
    status: 'missed',
  },
  {
    id: `paracetamol-${twoDaysAgo}-2000`,
    medicineId: 'medicine-paracetamol',
    medicineName: 'Paracetamol',
    doseDescription: '1 tablet',
    scheduledDate: twoDaysAgo,
    scheduledTime: '20:00',
    status: 'skipped',
  },
];
