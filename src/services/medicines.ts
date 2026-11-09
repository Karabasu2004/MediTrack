import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import type { Medicine, MedicineInput } from '../types';
import { firestore } from './firebase';

function getMedicinesCollection(userId: string) {
  if (!firestore) {
    throw new Error('Firebase is not configured. Follow the setup steps in README.md.');
  }
  return collection(firestore, 'users', userId, 'medicines');
}

function isMedicineInput(data: DocumentData): data is DocumentData & MedicineInput {
  return (
    typeof data.name === 'string' &&
    typeof data.doseDescription === 'string' &&
    typeof data.notes === 'string' &&
    typeof data.startDate === 'string' &&
    typeof data.endDate === 'string' &&
    Array.isArray(data.reminderTimes) &&
    data.reminderTimes.every((time: unknown) => typeof time === 'string') &&
    typeof data.active === 'boolean'
  );
}

export function subscribeToMedicines(
  userId: string,
  onMedicines: (medicines: Medicine[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    getMedicinesCollection(userId),
    (snapshot) => {
      const medicines: Medicine[] = [];
      for (const medicineDocument of snapshot.docs) {
        const data = medicineDocument.data();
        if (!isMedicineInput(data)) {
          onError(new Error(`Medicine ${medicineDocument.id} has invalid data.`));
          return;
        }
        medicines.push({ id: medicineDocument.id, ...data });
      }
      medicines.sort((first, second) => first.name.localeCompare(second.name));
      onMedicines(medicines);
    },
    onError,
  );
}

export async function saveMedicineToFirestore(
  userId: string,
  input: MedicineInput,
  medicineId?: string,
): Promise<string> {
  const medicinesCollection = getMedicinesCollection(userId);
  if (medicineId) {
    await updateDoc(doc(medicinesCollection, medicineId), input);
    return medicineId;
  }

  const savedDocument = await addDoc(medicinesCollection, input);
  return savedDocument.id;
}

export async function deleteMedicineFromFirestore(userId: string, medicineId: string): Promise<void> {
  await deleteDoc(doc(getMedicinesCollection(userId), medicineId));
}
