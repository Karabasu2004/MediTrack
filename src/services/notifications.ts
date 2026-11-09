import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medicine } from '../types';
import { localDateString } from '../utils/dates';

const MANAGED_SOURCE = 'meditrack-medicine-reminder';
const SCHEDULE_DAYS = 7;
const MAX_SCHEDULED_REMINDERS = 50;

export type NotificationPermission = 'granted' | 'denied' | 'unavailable';

export type ReminderScheduleResult = {
  scheduled: number;
  notScheduled: number;
};

type ReminderCandidate = {
  medicine: Medicine;
  scheduledDate: string;
  scheduledTime: string;
  triggerDate: Date;
};

let notificationOperation = Promise.resolve();

function runNotificationOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = notificationOperation.then(operation, operation);
  notificationOperation = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export function setMedicineNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return 'unavailable';
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.granted ? 'granted' : 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return 'unavailable';
  const permissions = await Notifications.requestPermissionsAsync();
  return permissions.granted ? 'granted' : 'denied';
}

function getUpcomingReminderDates(medicines: Medicine[], now: Date): ReminderCandidate[] {
  const today = localDateString(now);
  const upcoming = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDay = new Date(upcoming);
  lastDay.setDate(lastDay.getDate() + SCHEDULE_DAYS - 1);
  const lastDate = localDateString(lastDay);

  return medicines
    .filter((medicine) => medicine.active)
    .flatMap((medicine) => {
      const firstDate = medicine.startDate > today ? medicine.startDate : today;
      const finalDate = medicine.endDate < lastDate ? medicine.endDate : lastDate;
      if (firstDate > finalDate) return [];

      const reminders: ReminderCandidate[] = [];
      const date = new Date(`${firstDate}T00:00:00`);
      const end = new Date(`${finalDate}T00:00:00`);
      while (date <= end) {
        const scheduledDate = localDateString(date);
        for (const scheduledTime of medicine.reminderTimes) {
          const [hour, minute] = scheduledTime.split(':').map(Number);
          const triggerDate = new Date(date);
          triggerDate.setHours(hour, minute, 0, 0);
          if (triggerDate > now) {
            reminders.push({ medicine, scheduledDate, scheduledTime, triggerDate });
          }
        }
        date.setDate(date.getDate() + 1);
      }
      return reminders;
    })
    .sort(
      (first, second) =>
        first.triggerDate.getTime() - second.triggerDate.getTime() ||
        first.medicine.name.localeCompare(second.medicine.name),
    );
}

async function cancelManagedNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const managed = scheduled.filter(
    (notification) => notification.content.data?.source === MANAGED_SOURCE,
  );
  await Promise.all(
    managed.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier),
    ),
  );
}

export async function cancelMedicineReminders(): Promise<void> {
  if (Platform.OS !== 'web') {
    await runNotificationOperation(cancelManagedNotifications);
  }
}

export function syncMedicineReminders(
  userId: string,
  medicines: Medicine[],
): Promise<ReminderScheduleResult> {
  if (Platform.OS === 'web') {
    return Promise.resolve({ scheduled: 0, notScheduled: 0 });
  }

  return runNotificationOperation(async () => {
    await cancelManagedNotifications();

    const reminders = getUpcomingReminderDates(medicines, new Date());
    const scheduledReminders = reminders.slice(0, MAX_SCHEDULED_REMINDERS);
    for (const reminder of scheduledReminders) {
      const doseId = `${reminder.medicine.id}-${reminder.scheduledDate}-${reminder.scheduledTime.replace(':', '')}`;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${reminder.medicine.name} reminder`,
          body: reminder.medicine.doseDescription || 'It is time for your scheduled medicine.',
          sound: 'default',
          data: {
            source: MANAGED_SOURCE,
            userId,
            medicineId: reminder.medicine.id,
            doseId,
            scheduledDate: reminder.scheduledDate,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.triggerDate,
        },
      });
    }

    return {
      scheduled: scheduledReminders.length,
      notScheduled: reminders.length - scheduledReminders.length,
    };
  });
}
