import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import type { User } from 'firebase/auth';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import type { Dose, DoseRecord, DoseStatus, Medicine, MedicineInput, PatientProfile } from '../types';
import { localDateString } from '../utils/dates';
import { registerWithEmail, signInWithEmail, signOutUser } from '../services/auth';
import { saveDoseRecord, subscribeToDoseRecords } from '../services/doses';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { deleteMedicineFromFirestore, saveMedicineToFirestore, subscribeToMedicines } from '../services/medicines';
import {
  cancelMedicineReminders,
  getNotificationPermission,
  requestNotificationPermission,
  syncMedicineReminders,
  type NotificationPermission,
} from '../services/notifications';
import { getAuthErrorMessage } from '../utils/authErrors';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { getNotificationErrorMessage } from '../utils/notificationErrors';

type AppContextValue = {
  authError: string;
  authLoading: boolean;
  authUser: User | null;
  doses: Dose[];
  deleteMedicine: (medicineId: string) => Promise<void>;
  doseHistoryError: string;
  doseHistoryLoading: boolean;
  isFirebaseConfigured: boolean;
  medicineError: string;
  medicineLoading: boolean;
  medicines: Medicine[];
  notificationError: string;
  notificationPermission: NotificationPermission | 'unknown';
  notificationSchedule: { scheduled: number; notScheduled: number };
  profile: PatientProfile;
  refreshReminderSchedule: () => Promise<void>;
  requestReminderPermission: () => Promise<void>;
  updateDose: (doseId: string, status: DoseStatus) => Promise<void>;
  saveMedicine: (input: MedicineInput, medicineId?: string) => Promise<string>;
  updateProfile: (profile: PatientProfile) => Promise<void>;
  register: (displayName: string, email: string, password: string, phone: string, smsConsent: boolean) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [doseRecords, setDoseRecords] = useState<DoseRecord[]>([]);
  const [doseHistoryLoading, setDoseHistoryLoading] = useState(false);
  const [doseHistoryError, setDoseHistoryError] = useState('');
  const [medicineLoading, setMedicineLoading] = useState(false);
  const [medicineError, setMedicineError] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [notificationSchedule, setNotificationSchedule] = useState({ scheduled: 0, notScheduled: 0 });
  const [appForegroundRevision, setAppForegroundRevision] = useState(0);
  const pendingNotificationDose = useRef<{ doseId: string; userId: string } | null>(null);
  const lastNotificationResponseId = useRef<string | null>(null);
  const [notificationResponseRevision, setNotificationResponseRevision] = useState(0);
  const [profile, setProfile] = useState<PatientProfile>({
    displayName: '',
    email: '',
    phone: '',
    smsConsent: false,
  });
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState('');
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) return undefined;
    return auth.onAuthStateChanged(
      (user) => {
        if (previousUserId.current !== user?.uid) {
          setMedicines([]);
          setDoseRecords([]);
          setDoseHistoryError('');
          setDoseHistoryLoading(Boolean(user));
          setMedicineError('');
          setMedicineLoading(Boolean(user));
          previousUserId.current = user?.uid ?? null;
        }
        setAuthUser(user);
        setProfile((current) =>
          user
            ? {
                ...current,
                displayName: user.displayName ?? '',
                email: user.email ?? '',
              }
            : { displayName: '', email: '', phone: '', smsConsent: false },
        );
        setAuthError('');
        setAuthLoading(false);
      },
      (error) => {
        setAuthError(getAuthErrorMessage(error));
        setAuthLoading(false);
      },
    );
  }, []);

  const userId = authUser?.uid;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAppForegroundRevision((current) => current + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeToMedicines(
      userId,
      (nextMedicines) => {
        setMedicines(nextMedicines);
        setMedicineLoading(false);
        setMedicineError('');
      },
      (error) => {
        setMedicineError(getFirebaseErrorMessage(error));
        setMedicineLoading(false);
      },
    );
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    return subscribeToDoseRecords(
      userId,
      (records) => {
        setDoseRecords(records);
        setDoseHistoryLoading(false);
        setDoseHistoryError('');
      },
      (error) => {
        setDoseHistoryLoading(false);
        setDoseHistoryError(getFirebaseErrorMessage(error));
      },
    );
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      void cancelMedicineReminders()
        .then(() => {
          if (!active) return;
          setNotificationPermission('unknown');
          setNotificationSchedule({ scheduled: 0, notScheduled: 0 });
          setNotificationError('');
        })
        .catch((error: unknown) => {
          if (active) setNotificationError(getNotificationErrorMessage(error));
        });
      return () => {
        active = false;
      };
    }

    void getNotificationPermission()
      .then((permission) => {
        if (active) setNotificationPermission(permission);
      })
      .catch((error: unknown) => {
        if (active) setNotificationError(getNotificationErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [appForegroundRevision, userId]);

  const refreshMedicineReminders = useCallback(async () => {
    if (!userId || notificationPermission !== 'granted' || medicineLoading) return;
    try {
      const result = await syncMedicineReminders(userId, medicines);
      setNotificationSchedule(result);
      setNotificationError('');
    } catch (error) {
      setNotificationError(getNotificationErrorMessage(error));
    }
  }, [medicineLoading, medicines, notificationPermission, userId]);

  useEffect(() => {
    if (!userId || notificationPermission !== 'granted' || medicineLoading) return undefined;
    let active = true;
    void syncMedicineReminders(userId, medicines)
      .then((result) => {
        if (!active) return;
        setNotificationSchedule(result);
        setNotificationError('');
      })
      .catch((error: unknown) => {
        if (active) setNotificationError(getNotificationErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [appForegroundRevision, medicineLoading, medicines, notificationPermission, userId]);

  const doses = useMemo(() => {
    const today = new Date();
    const recordsById = new Map(doseRecords.map((record) => [record.id, record]));
    const upcomingDoses: Dose[] = Array.from({ length: 7 }, (_, dayOffset) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset);
      const scheduledDate = localDateString(date);
      return medicines.flatMap((medicine) => {
        if (!medicine.active || scheduledDate < medicine.startDate || scheduledDate > medicine.endDate) return [];
        return medicine.reminderTimes.map((scheduledTime): Dose => {
          const id = `${medicine.id}-${scheduledDate}-${scheduledTime.replace(':', '')}`;
          const savedRecord = recordsById.get(id);
          const status: DoseStatus = savedRecord ? savedRecord.status : 'pending';
          return {
            id,
            medicineId: medicine.id,
            medicineName: medicine.name,
            doseDescription: medicine.doseDescription,
            scheduledDate,
            scheduledTime,
            status,
          };
        });
      });
    }).flat();
    const upcomingIds = new Set(upcomingDoses.map((dose) => dose.id));
    return [...upcomingDoses, ...doseRecords.filter((record) => !upcomingIds.has(record.id))];
  }, [doseRecords, medicines]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const handleNotification = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (
        data &&
        data.source === 'meditrack-medicine-reminder' &&
        typeof data.doseId === 'string' &&
        typeof data.userId === 'string'
      ) {
        if (lastNotificationResponseId.current === response.notification.request.identifier) return;
        lastNotificationResponseId.current = response.notification.request.identifier;
        pendingNotificationDose.current = { doseId: data.doseId, userId: data.userId };
        setNotificationResponseRevision((current) => current + 1);
        void Notifications.clearLastNotificationResponseAsync().catch((error: unknown) => {
          setNotificationError(getNotificationErrorMessage(error));
        });
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotification);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotification(response);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const pending = pendingNotificationDose.current;
    if (!pending || authLoading) return;
    if (!authUser || pending.userId !== authUser.uid) {
      pendingNotificationDose.current = null;
      return;
    }
    if (medicineLoading) return;
    const doseExists = doses.some((dose) => dose.id === pending.doseId);
    if (doseExists) {
      router.push({ pathname: '/reminder/[id]', params: { id: pending.doseId } });
    }
    pendingNotificationDose.current = null;
  }, [authLoading, authUser, doses, medicineLoading, notificationResponseRevision]);

  const value = useMemo<AppContextValue>(
    () => ({
      authError,
      authLoading,
      authUser,
      doses,
      deleteMedicine: async (medicineId) => {
        if (!authUser) {
          throw new Error('You must be signed in to delete a medicine.');
        }
        try {
          await deleteMedicineFromFirestore(authUser.uid, medicineId);
        } catch (error) {
          throw new Error(getFirebaseErrorMessage(error));
        }
      },
      doseHistoryError,
      doseHistoryLoading,
      isFirebaseConfigured,
      medicineError,
      medicineLoading,
      medicines,
      notificationError,
      notificationPermission,
      notificationSchedule,
      profile,
      refreshReminderSchedule: refreshMedicineReminders,
      requestReminderPermission: async () => {
        setNotificationError('');
        try {
          const permission = await requestNotificationPermission();
          setNotificationPermission(permission);
          if (permission === 'denied') {
            setNotificationError('Notifications are disabled. Allow them for MediTrack in your device settings.');
          } else if (permission === 'unavailable') {
            setNotificationError('Local reminders require the Android or iOS app; they are not available in the web preview.');
          }
        } catch (error) {
          setNotificationError(getNotificationErrorMessage(error));
        }
      },
      updateDose: async (doseId, status) => {
        if (!authUser) {
          throw new Error('You must be signed in to save a dose record.');
        }
        if (status === 'pending') {
          throw new Error('A dose cannot be recorded as pending.');
        }
        const dose = doses.find((item) => item.id === doseId);
        if (!dose) {
          throw new Error('This dose is no longer available in your schedule.');
        }
        try {
          await saveDoseRecord(authUser.uid, dose, status);
        } catch (error) {
          throw new Error(getFirebaseErrorMessage(error));
        }
      },
      saveMedicine: async (input, medicineId) => {
        if (!authUser) {
          throw new Error('You must be signed in to save a medicine.');
        }
        try {
          return await saveMedicineToFirestore(authUser.uid, input, medicineId);
        } catch (error) {
          throw new Error(getFirebaseErrorMessage(error));
        }
      },
      updateProfile: async (nextProfile) => {
        if (!authUser) {
          throw new Error('You must be signed in to update your profile.');
        }
        await updateFirebaseProfile(authUser, { displayName: nextProfile.displayName });
        setProfile(nextProfile);
      },
      register: async (displayName, email, password, phone, smsConsent) => {
        const user = await registerWithEmail(displayName, email, password);
        setProfile({ displayName: user.displayName ?? displayName, email: user.email ?? email, phone, smsConsent });
      },
      signIn: async (email, password) => {
        await signInWithEmail(email, password);
      },
      signOut: signOutUser,
    }),
    [
      authError,
      authLoading,
      authUser,
      doses,
      doseHistoryError,
      doseHistoryLoading,
      medicineError,
      medicineLoading,
      medicines,
      notificationError,
      notificationPermission,
      notificationSchedule,
      profile,
      refreshMedicineReminders,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider.');
  }
  return context;
}
