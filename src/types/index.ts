export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'missed';

export type Medicine = {
  id: string;
  name: string;
  doseDescription: string;
  notes: string;
  startDate: string;
  endDate: string;
  reminderTimes: string[];
  active: boolean;
};

export type Dose = {
  id: string;
  medicineId: string;
  medicineName: string;
  doseDescription: string;
  scheduledDate: string;
  scheduledTime: string;
  status: DoseStatus;
};

export type DoseRecord = Omit<Dose, 'status'> & {
  status: Exclude<DoseStatus, 'pending'>;
};

export type PatientProfile = {
  displayName: string;
  email: string;
  phone: string;
  smsConsent: boolean;
};

export type MedicineInput = Omit<Medicine, 'id'>;
