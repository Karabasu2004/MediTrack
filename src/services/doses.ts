import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import type { Dose, DoseRecord } from '../types';
import { firestore } from './firebase';

function getDoseCollection(userId: string) {
  if (!firestore) {
    throw new Error('Firebase is not configured. Follow the setup steps in README.md.');
  }
  return collection(firestore, 'users', userId, 'doses');
}

function isDoseRecord(data: DocumentData): data is DocumentData & Omit<DoseRecord, 'id'> {
  return (
    typeof data.medicineId === 'string' &&
    typeof data.medicineName === 'string' &&
    typeof data.doseDescription === 'string' &&
    typeof data.scheduledDate === 'string' &&
    typeof data.scheduledTime === 'string' &&
    (data.status === 'taken' || data.status === 'skipped' || data.status === 'missed')
  );
}

export function subscribeToDoseRecords(
  userId: string,
  onRecords: (records: DoseRecord[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    getDoseCollection(userId),
    (snapshot) => {
      const records: DoseRecord[] = [];
      for (const doseDocument of snapshot.docs) {
        const data = doseDocument.data();
        if (!isDoseRecord(data)) {
          onError(new Error(`Dose record ${doseDocument.id} has invalid data.`));
          return;
        }
        records.push({ id: doseDocument.id, ...data });
      }
      onRecords(records);
    },
    onError,
  );
}

export async function saveDoseRecord(
  userId: string,
  dose: Dose,
  status: DoseRecord['status'],
): Promise<void> {
  const doseDocument = doc(getDoseCollection(userId), dose.id);
  await setDoc(doseDocument, {
    medicineId: dose.medicineId,
    medicineName: dose.medicineName,
    doseDescription: dose.doseDescription,
    scheduledDate: dose.scheduledDate,
    scheduledTime: dose.scheduledTime,
    status,
    updatedAt: serverTimestamp(),
  });
}
