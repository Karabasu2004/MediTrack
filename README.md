# MediTrack -- Smart Medicine Reminder Android App

> **Project type:** Android application\
> **Editor:** Visual Studio Code\
> **Suggested stack:** React Native + Expo (TypeScript) + Firebase\
> **Primary purpose:** Help a patient remember medicines they have
> already entered into their schedule.

![MediTrack UI reference -- six proposed app
screens](assets/MediTrack-UI-Reference.png)

> **UI reference note:** The image above is a visual direction for the
> VS Code coding agent. Treat it as a design reference, not as a
> finished or functional app. Recreate the screens as editable React
> Native components. Text, spacing, and sample data can be improved
> during implementation.

------------------------------------------------------------------------

## 1. Project overview

MediTrack is a medicine reminder app. A patient can register, add
medicine details, set one or more reminder times, and receive:

1.  An SMS reminder **5 minutes before** each scheduled dose.
2.  An SMS reminder at the **scheduled time**.
3.  A local Android notification/alarm at the scheduled time.
4.  A way to mark a dose as **Taken**, **Skipped**, or **Missed**.

MediTrack is a reminder and record-keeping tool only. It must not
diagnose conditions, recommend medicines, or change a clinician's
instructions.

## 2. Main goals

-   Make adding and managing medicine schedules simple.
-   Support multiple medicines and multiple times per day.
-   Send reminder SMS messages through a server-side SMS provider.
-   Schedule local Android notifications so reminders can still appear
    when the phone temporarily has no internet.
-   Prevent duplicate SMS messages and duplicate dose records.
-   Keep a history of doses and reminder delivery attempts.
-   Protect personal information and require the patient's consent
    before sending SMS.

## 3. Recommended technology

  -----------------------------------------------------------------------
  Area                    Recommended technology  Purpose
  ----------------------- ----------------------- -----------------------
  Editor                  Visual Studio Code      Write and manage the
                                                  project

  Mobile app              React Native + Expo     Android user interface
                                                  and app logic

  Language                TypeScript              Safer, maintainable
                                                  JavaScript

  Navigation              Expo Router or React    Move between app
                          Navigation              screens

  Authentication          Firebase Authentication Register and sign in

  Database                Cloud Firestore         Store users, medicines,
                                                  schedules and dose
                                                  history

  Backend                 Firebase Cloud          Secure server-side
                          Functions (TypeScript)  logic

  SMS                     Twilio or an            Send SMS from the
                          India-supported SMS     backend
                          provider

  Local notifications     `expo-notifications`    Schedule on-device
                                                  reminders

  Android native exact    Kotlin `AlarmManager`   Native alarm scheduling
  alarm (if strict exact  module                  and reboot handling
  timing is required)
  -----------------------------------------------------------------------

**Important implementation choice:** Start with Expo and
`expo-notifications` for local notifications. If the project requirement
is a strict exact-time alarm, validate Android's exact-alarm permission
behavior on the target Android versions. A native Kotlin `AlarmManager`
module may be needed. Do not promise that a normal web timer or a
background JavaScript task will fire at an exact time.

## 4. User roles

For the first version, implement only one role:

-   **Patient:** owns their profile, adds and edits their own medicine
    schedules, receives reminders, and records dose status.

Do not build doctor or administrator roles unless they are explicitly
needed later.

## 5. App screens and UI requirements

Use the UI reference image above. Build a clean, accessible design with
a white/light background, blue and teal as primary colors, readable
typography, rounded cards, clear icons, and large touch targets. Keep
layouts responsive for common Android phone sizes.

### Screen 1 -- Welcome / Login / Register

-   MediTrack logo or simple pill-and-clock icon.
-   Email and password login.
-   Registration fields: name, email, password, mobile number.
-   Validate inputs and show useful error messages.
-   Verify the mobile number if supported by the selected
    authentication/SMS provider.
-   Ask for clear consent before sending medicine reminder SMS.
-   Never store plain-text passwords.

### Screen 2 -- Home dashboard

-   Greeting and today's date.
-   Summary cards: today's scheduled doses, taken, and pending.
-   List today's doses in chronological order.
-   Show medicine name, dose instructions entered by the patient, and
    scheduled time.
-   Clear **Add Medicine** action.
-   Show an empty state when no medicine has been added.

### Screen 3 -- Add / Edit Medicine

Fields: - Medicine name (required). - Dose description (free text,
e.g. "1 tablet"; do not calculate or recommend dosage). - Optional
notes. - Start date and end date. - One or more reminder times. - Repeat
pattern: daily initially; add selected weekdays later. - Active / paused
status.

Validation: - End date cannot be before start date. - Require at least
one valid reminder time. - Prevent accidental duplicate times for the
same medicine. - Explain that the patient must enter the schedule
exactly as instructed by their healthcare professional.

### Screen 4 -- Reminder / Alarm

-   Show medicine name, entered dose description, and scheduled time.
-   At T-5 minutes, show a "Coming up in 5 minutes" notification and
    send the pre-reminder SMS.
-   At T, show the due notification/alarm and send the exact-time SMS.
-   Provide **Taken**, **Snooze** (optional), and **Skip** actions.
-   Do not mark a dose as taken automatically.
-   Snooze must create a separate, controlled reminder and must not
    change the original prescription schedule.

### Screen 5 -- Dose history

-   Filter by date and medicine.
-   Show Taken, Skipped, and Missed states.
-   Show reminder/SMS delivery state separately from dose status.
-   Do not claim that an SMS was delivered just because the provider API
    accepted the request.

### Screen 6 -- Profile / Settings

-   Name and mobile number.
-   SMS consent on/off.
-   Notification permission status.
-   Time zone (use the phone's current time zone; store timestamps
    consistently).
-   Sign out and account deletion request.

## 6. Reminder behavior and timing rules

For a dose scheduled at **8:00 PM**:

  -----------------------------------------------------------------------
  Event                               Expected behavior
  ----------------------------------- -----------------------------------
  7:55 PM                             Backend attempts pre-reminder SMS;
                                      phone may show a pre-reminder
                                      notification

  8:00 PM                             Backend attempts due-time SMS;
                                      phone shows the local due
                                      notification/alarm

  After patient action                Save Taken or Skipped status with
                                      the action time

  After allowed grace period          Mark as Missed only if no patient
                                      action exists
  -----------------------------------------------------------------------

Use one dose instance per medicine schedule occurrence. Each dose
instance should have a stable unique ID, for example:

`{userId}_{medicineId}_{YYYYMMDD}_{HHmm}`

Use a separate unique event key for each notification type:

-   `{doseId}_PRE5`
-   `{doseId}_DUE`

Before sending an SMS, the backend must transactionally claim the event
or use an idempotency key. This prevents duplicate messages if a
scheduled function retries or runs more than once.

**Timing reality:** SMS delivery time depends on the mobile network and
SMS provider. The app can request sending at the target time, but it
cannot guarantee that the carrier delivers the message at the exact
second. Local Android alarms are the better mechanism for on-device
timing.

## 7. Suggested architecture

``` text
React Native Android App (Expo / TypeScript)
        |
        | Firebase Authentication
        | Firestore reads/writes (user-owned data only)
        | Local notification scheduling
        v
Firebase / Google Cloud
  - Firestore database
  - Cloud Functions (trusted backend)
  - Scheduled worker or Cloud Tasks
        |
        | Secure server-side API call
        v
SMS Provider (Twilio / India-supported provider)
        |
        v
Patient's mobile number

Android device:
  - Local notification / alarm
  - Taken / Skip action
  - Re-schedule local notifications after schedule edits
```

### Backend scheduling recommendation

For a student prototype, a scheduled Cloud Function can periodically
find due reminder events and send them. A once-per-minute worker is
easier to implement but is **not an exact-time guarantee**.

For a more robust implementation, create two backend tasks per dose
occurrence using Cloud Tasks (or an equivalent durable task scheduler),
one for T-5 and one for T. The task handler must still check the event's
status and idempotency key before sending.

Do not keep a server process running on a student's laptop as the
production scheduler. It stops when the laptop is shut down.

## 8. Firestore data model

Use the following as a starting schema. Adjust field names consistently
across the app and backend.

### `users/{userId}`

``` ts
{
  displayName: string,
  email: string,
  phoneE164: string,        // e.g. +91XXXXXXXXXX
  smsConsent: boolean,
  timeZone: string,         // e.g. Asia/Kolkata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `users/{userId}/medicines/{medicineId}`

``` ts
{
  name: string,
  doseDescription: string,
  notes: string,
  startDate: string,        // YYYY-MM-DD in user's local calendar
  endDate: string,          // YYYY-MM-DD
  reminderTimes: string[],  // e.g. ["08:00", "20:00"]
  repeatType: "daily" | "weekdays",
  active: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `users/{userId}/doses/{doseId}`

``` ts
{
  medicineId: string,
  medicineNameSnapshot: string,
  doseDescriptionSnapshot: string,
  scheduledAt: Timestamp,
  timeZone: string,
  status: "pending" | "taken" | "skipped" | "missed",
  actionAt: Timestamp | null,
  createdAt: Timestamp
}
```

### `users/{userId}/reminderEvents/{eventId}`

``` ts
{
  doseId: string,
  type: "pre5" | "due",
  scheduledAt: Timestamp,
  status: "pending" | "processing" | "accepted" | "delivered" | "failed",
  providerMessageId: string | null,
  attempts: number,
  lastError: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Keep provider credentials only in server-side secret storage. Never save
SMS API keys in the mobile app or commit them to Git.

## 9. Suggested project folder structure

``` text
meditrack/
├── app/                         # Expo Router screens (if using Expo Router)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Home dashboard
│   │   ├── medicines.tsx
│   │   ├── history.tsx
│   │   └── profile.tsx
│   ├── medicine/
│   │   └── [id].tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.ts
│   │   ├── medicines.ts
│   │   ├── notifications.ts
│   │   └── reminderScheduler.ts
│   ├── types/
│   └── utils/
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       ├── index.ts
│       ├── sendReminder.ts
│       └── reminderTasks.ts
├── assets/
│   └── MediTrack-UI-Reference.png
├── app.json
├── package.json
├── tsconfig.json
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .env.example
├── .gitignore
└── README.md
```

The coding agent may choose React Navigation instead of Expo Router.
Keep the same separation of screens, services, types, and backend
functions.

## 10. Development setup in VS Code

### Prerequisites

Install: - Visual Studio Code: https://code.visualstudio.com/ - Node.js
LTS: https://nodejs.org/ - Android Studio:
https://developer.android.com/studio - Android SDK and platform tools
through Android Studio. - Expo Go on a physical Android phone for early
UI testing.

For native notification/alarm features, use an Expo development build
rather than relying only on Expo Go.

### Create the app

Open a terminal in VS Code:

``` bash
npx create-expo-app@latest meditrack
cd meditrack
code .
npx expo start
```

Run on a connected Android device or emulator during the initial UI
stage.

### Install likely packages

Confirm current Expo-compatible versions before installing; prefer
`npx expo install` for Expo-managed native packages.

``` bash
npx expo install expo-notifications expo-device expo-constants
npx expo install @react-native-async-storage/async-storage
npm install firebase
```

If using Expo Router, follow the current Expo Router setup instructions.
Add Firebase Cloud Functions in a separate `functions` directory using
the Firebase CLI.

### Firebase setup

1.  Create a Firebase project in the Firebase Console.
2.  Register the Android app using the correct Android application ID.
3.  Enable Firebase Authentication (email/password is sufficient for the
    prototype).
4.  Create a Cloud Firestore database.
5.  Configure Firestore Security Rules so a signed-in user can access
    only their own data.
6.  Set up Firebase Cloud Functions and billing requirements for the
    chosen deployment features.
7.  Store SMS provider credentials using Firebase/Google Cloud secrets.
8.  Test rules with the Firebase Emulator Suite before using real
    patient data.

## 11. SMS integration and India-specific checks

-   Use a provider that supports sending application-to-person SMS to
    Indian mobile numbers.
-   Check the provider's current India onboarding, sender ID/header,
    template, DLT, consent, and route requirements before production
    use.
-   Use the provider's approved templates and correct message category.
-   Normalize phone numbers to E.164 format (for India, usually `+91`
    followed by the 10-digit mobile number).
-   Send SMS only after the patient has opted in.
-   Add provider delivery-status callbacks/webhooks if available.
-   Store provider message IDs and distinguish **accepted**,
    **delivered**, and **failed**.
-   Start with a test number / sandbox mode where available. Real SMS
    may cost money.
-   Do not send medicine names or other sensitive details in SMS unless
    necessary and explicitly consented to. A privacy-preserving message
    can say "You have a scheduled MediTrack reminder. Open the app to
    view details."

## 12. Android alarm and notification considerations

-   Ask for notification permission at an appropriate point and explain
    why it is needed.
-   Schedule local notifications on the device when a medicine schedule
    is saved.
-   Update/cancel local notifications when a schedule is edited, paused,
    or deleted.
-   Handle notification permission being denied.
-   Test behavior after app termination, device restart, battery saver,
    and Do Not Disturb.
-   Android exact alarms have special permission and platform
    restrictions on newer Android versions. Check the current Android
    documentation and request only the permission needed for the app's
    user-facing alarm feature.
-   If reboot recovery or strict exact alarms are required, implement
    and test the appropriate native Android receiver / `AlarmManager`
    behavior.
-   Never rely on `setTimeout`, an always-running screen, or a browser
    timer for medication reminders.

## 13. Security and privacy requirements

-   Use Firebase Authentication; never implement your own plain-text
    password storage.
-   Enforce per-user access with Firestore Security Rules.
-   Validate all backend inputs; do not trust values supplied by the
    mobile app.
-   Keep provider API keys and service credentials out of the app bundle
    and Git repository.
-   Ask for SMS and notification consent.
-   Collect only data needed for the reminder feature.
-   Provide a way to update the phone number and withdraw SMS consent.
-   Provide a way to request account/data deletion.
-   Use HTTPS and secure server-side functions.
-   Avoid using real patient data during development; use fictional test
    records.
-   Before public release, review applicable privacy, health-data,
    consumer-protection, and telecom requirements with a qualified
    adviser.

## 14. Main risks and solutions

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  SMS arrives late                    Explain carrier delays; local
                                      notification is the primary
                                      on-device alert

  Duplicate SMS                       Unique event IDs, transaction/claim
                                      step, idempotent backend handler

  App is closed                       Schedule local notifications with
                                      Android APIs

  Phone is restarted                  Rebuild local schedules after boot
                                      where supported; verify native
                                      implementation

  Notification permission denied      Show clear status and instructions;
                                      do not claim alarm is active

  Internet is unavailable             Previously scheduled local
                                      notifications can still work; SMS
                                      requires network

  Time zone / daylight saving changes Store timestamps consistently and
                                      retain the intended IANA time zone

  Medicine schedule is edited         Cancel old pending events and
                                      create new ones safely

  SMS provider rejects a message      Save failure reason, show status,
                                      and retry only under a controlled
                                      policy

  User marks a dose late              Save actual action time separately
                                      from scheduled time

  Patient never responds              Keep pending, then mark missed
                                      after a clearly defined grace
                                      period
  -----------------------------------------------------------------------

## 15. Testing checklist

### Authentication

-   [ ] Register a new patient.
-   [ ] Sign in and sign out.
-   [ ] Invalid login shows a useful error.
-   [ ] One patient cannot read another patient's data.

### Medicine management

-   [ ] Add a medicine with one reminder time.
-   [ ] Add a medicine with multiple reminder times.
-   [ ] Edit, pause, resume, and delete a medicine.
-   [ ] Validate dates and duplicate times.

### Local reminders

-   [ ] Schedule a reminder and verify it on a physical Android device.
-   [ ] Test with the app in the foreground and background.
-   [ ] Test after force-closing the app.
-   [ ] Test notification permission denied and later enabled.
-   [ ] Test device restart and battery saver.
-   [ ] Verify schedule edits cancel obsolete notifications.

### SMS and backend

-   [ ] Test pre-reminder event at T-5.
-   [ ] Test due-time event at T.
-   [ ] Verify duplicate worker execution does not send duplicate SMS.
-   [ ] Verify provider failures are recorded.
-   [ ] Verify SMS consent is checked before sending.
-   [ ] Verify credentials are not present in the app bundle or Git.

### Dose history

-   [ ] Mark a dose Taken.
-   [ ] Mark a dose Skipped.
-   [ ] Verify pending doses are not marked Taken automatically.
-   [ ] Verify missed-dose logic uses the agreed grace period.

## 16. Suggested implementation milestones

Build in this order. Do not start with SMS before the basic app works.

-   [x] **Milestone 1:** Create Expo TypeScript app and run it on
    Android.
-   [x] **Milestone 2:** Implement the six screens using sample data.
-   [x] **Milestone 3:** Add Firebase Authentication.
-   [x] **Milestone 4:** Add Firestore medicine CRUD and security rules.
-   [ ] **Milestone 5:** Generate dose instances and schedule local
    notifications.
-   [ ] **Milestone 6:** Test background notifications and Android alarm
    limitations.
-   [ ] **Milestone 7:** Build Cloud Functions and integrate SMS in test
    mode.
-   [ ] **Milestone 8:** Add idempotency, delivery status, and error
    handling.
-   [x] **Milestone 9:** Add Taken / Skipped / Missed history.
-   [ ] **Milestone 10:** Test on real Android devices and prepare the
    APK.

### Current implementation status

Milestone 1 has been run on an Android phone using Expo Go. Milestone 2
is implemented with local sample data and has been smoke tested in the
Expo web preview and Expo Go on that phone.
Milestone 3 now has Firebase email/password registration, sign-in,
password reset, sign-out, and persisted authentication state implemented.
The local Firebase web-app configuration is in the ignored `.env` file.
Live account registration and sign-in have been tested successfully.
Milestone 4 now has per-user Firestore medicine create, read, update, and
delete code plus owner-only rules in `firestore.rules`. Firestore has been
created, its rules published, and medicine storage tested.
Milestone 5 now generates the next seven days of dose instances and can
schedule local device reminders for those doses. Permission and on-device
delivery still need to be tested on the target Android phone.
Milestone 9 now saves Taken, Skipped, and explicitly marked Missed dose
records under each user's Firestore account. Pending doses are not
automatically marked missed; the patient can mark an overdue dose manually.

From this project folder, use `npm start` to open the Expo developer
server, `npm run android` when an Android device/emulator is available,
`npm run typecheck` for the TypeScript check, and `npx expo lint` for
linting. SMS and production alarm scheduling are not implemented.

### Configure Firebase Authentication (Milestone 3)

1. Create or choose a project in the [Firebase Console](https://console.firebase.google.com/).
2. In **Authentication → Sign-in method**, enable **Email/Password**.
3. In **Project settings → General**, register a **Web app** and copy its
   Firebase configuration values. The Firebase JavaScript SDK uses the
   web-app config in Expo Go and does not require the native Firebase SDK.
4. Copy `.env.example` to `.env` in this project folder and replace the
   four placeholder values with the Firebase web app's `apiKey`,
   `authDomain`, `projectId`, and `appId`.
5. Stop and restart Expo with `npm start` so the `EXPO_PUBLIC_*`
   variables are loaded. Reload the app in Expo Go, then create an
   account and sign in.

Firebase's client configuration, including its API key, is not a
privileged secret. Do not put service-account keys, SMS provider
credentials, or other server secrets in `EXPO_PUBLIC_*` variables or the
mobile app. Configure Firebase Authentication's email/password provider
and authorized domains in the Firebase Console as needed. The app stores
the Firebase Auth name/email and persists the signed-in session;
phone number and SMS consent are not uploaded or persisted yet.

### Configure Cloud Firestore (Milestone 4)

1. In the Firebase Console, open **Firestore Database** and create a
   database. Choose a location close to your users; the location cannot be
   changed after the database is created.
2. Open the database's **Rules** tab and publish the contents of
   [`firestore.rules`](./firestore.rules). Do not leave the database in
   test mode. These rules restrict medicine reads and writes to the
   authenticated owner at `users/{userId}/medicines/{medicineId}`.
3. Restart the app, sign in, and add a test medicine. Confirm it appears
   under **Firestore Database → Data → users → your user ID → medicines**.
   Edit it, sign out and back in to confirm it persists, then delete it.

The app loads medicine changes and dose records from Firestore in real
time. Dose records preserve the medicine and schedule details at the time
the action was recorded, including after a medicine schedule is edited or
deleted. Publish the updated `firestore.rules` to enable the owner's
`users/{userId}/doses/{doseId}` records. Do not use real patient data.

### Enable local medicine reminders (Milestone 5)

Local reminders use `expo-notifications` on the device. They do not use
Firebase Cloud Messaging, SMS, Cloud Functions, scheduled Firebase
backups, or a paid cloud plan.

1. Run the app on an Android or iOS device and sign in.
2. Open **Profile & settings** and choose **Enable local reminders**. Allow
   notifications when the device asks.
3. Add or edit an active medicine with its date range and reminder times.
   The app schedules upcoming doses for the next seven days and opens the
   dose screen when a reminder is tapped.
4. Reopen the app or bring it back to the foreground to refresh the
   rolling seven-day schedule after medicine changes or as time passes.

The app schedules at most 50 upcoming notifications at a time to stay
within common device limits. If more are due, the earliest are scheduled
first and the profile shows how many could not be scheduled. Notification
delivery and exact timing can be affected by Android battery settings,
device state, or notification permissions. These reminders are a college
project feature and should not be relied on for critical medical care.

## 17. Instructions for the VS Code AI coding agent

Read this entire README before changing files.

1.  Build an **Android mobile application**, not a website.
2.  Use React Native + Expo + TypeScript unless a technical blocker is
    explained first.
3.  Use the UI reference image at `assets/MediTrack-UI-Reference.png`.
4.  First create the app structure and implement the screens with
    realistic sample data.
5.  Keep UI components, Firebase services, notification logic, and
    backend code separated.
6.  Do not put SMS credentials or privileged Firebase credentials in
    client-side code.
7.  Do not fake successful SMS delivery. Clearly label mock/demo
    behavior.
8.  Do not claim exact-time alarm reliability until tested on real
    Android devices and the required Android permissions are
    implemented.
9.  Add loading, empty, validation, and error states to every relevant
    screen.
10. Add Firestore Security Rules and tests before using real data.
11. After each milestone, run the available type checks and tests, fix
    errors, and explain what changed.
12. Do not silently skip a feature. If a requirement needs native Kotlin
    code or a paid service, explain the dependency and ask before
    incurring costs.

### First task for the coding agent

Start with **Milestones 1 and 2 only**: - Create the Expo TypeScript
project. - Implement Welcome/Login, Register, Home, Add/Edit Medicine,
Reminder, History, and Profile screens. - Use local mock data only. -
Match the supplied UI reference. - Add navigation and form validation. -
Make sure the app runs on an Android emulator or physical Android phone.

Do not integrate Firebase, SMS, or production alarm scheduling until the
UI milestone is reviewed.

------------------------------------------------------------------------

## 18. Useful official documentation

-   Expo documentation: https://docs.expo.dev/
-   Expo notifications:
    https://docs.expo.dev/versions/latest/sdk/notifications/
-   React Native: https://reactnative.dev/docs/getting-started
-   Firebase for JavaScript: https://firebase.google.com/docs/web/setup
-   Firebase Authentication: https://firebase.google.com/docs/auth
-   Cloud Firestore: https://firebase.google.com/docs/firestore
-   Firebase Cloud Functions: https://firebase.google.com/docs/functions
-   Android notifications:
    https://developer.android.com/develop/ui/views/notifications
-   Android exact alarms:
    https://developer.android.com/develop/background-work/services/alarms
-   Twilio SMS: https://www.twilio.com/docs/messaging

------------------------------------------------------------------------

**MediTrack -- Never Miss Your Medicine Again.**
