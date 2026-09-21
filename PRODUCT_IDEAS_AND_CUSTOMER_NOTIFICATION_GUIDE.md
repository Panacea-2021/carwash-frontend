# BCW Product Ideas and Customer Notification Guide

## 1) High-Value Feature Ideas You Can Implement

### A) Booking and Service Flow

1. Smart slot availability by vehicle type and average wash duration.
2. Dynamic pricing based on peak hours and demand.
3. One-tap rebook from booking history.
4. Bundles: wash + interior + polish.
5. Priority queue pass as a paid add-on.
6. Subscription plans with rollover benefits.
7. Favorite worker selection for repeat customers.
8. Real-time service progress timeline.
9. Before and after photo proof in booking details.
10. Corporate and family shared plans.

### B) Operations and Staff Productivity

1. Shift planning board with drag-and-drop assignment.
2. Geofenced attendance for staff check-in.
3. Skill-based auto assignment.
4. Worker productivity scorecards.
5. Supervisor daily checklist with photo proof.
6. Inventory low-stock alerts by branch.
7. Equipment maintenance schedule and downtime tracking.
8. Multi-branch load balancing suggestions.
9. Incident report workflow for service issues.
10. SLA breach alerts for delayed jobs.

### C) Finance and Admin Intelligence

1. Daily branch-level P and L dashboard.
2. Payment reconciliation panel (cash vs online).
3. Discount and refund approval workflow.
4. Revenue split by booking source.
5. Pending dues aging report.
6. Tip analytics by worker and branch.
7. Leakage detector for completed but unpaid jobs.
8. Auto monthly statement for business clients.
9. Profitability by package and location.
10. Forecast vs target dashboard.

### D) AI Features (Admin + Customer)

1. AI demand forecast by date and location.
2. AI staffing recommendation by shift.
3. AI no-show prediction and prevention reminders.
4. AI churn prediction for customer retention offers.
5. AI upsell recommendation during booking.
6. AI anomaly detection for discounts and manual edits.
7. AI performance coach suggestions for staff.
8. AI multilingual assistant for support.
9. AI daily business summary in simple language.
10. AI complaint triage with recommended actions.

### E) Growth Features

1. Referral campaigns with reward tracking.
2. Inactive customer win-back campaigns.
3. Seasonal campaign templates.
4. Personalized loyalty offers.
5. WhatsApp reminder and promo automation.
6. Branch campaign ROI dashboard.
7. Gift cards and prepaid credits.
8. Partner coupon tracking.
9. Corporate onboarding funnel.
10. A/B testing for booking conversion.

## 2) Customer App Notifications: How To Implement Properly

This section explains how to implement app-style push notifications in BCWCustomer.

## 2.1 Current Situation in BCWCustomer

- The app already has notification badge/state logic in provider and UI.
- Push delivery stack (Firebase Cloud Messaging) is not wired yet.
- pubspec currently does not include firebase messaging packages.

## 2.2 Target Notification Types for Customer App

1. Booking confirmed.
2. Worker assigned.
3. Service started.
4. Service completed.
5. Payment reminder.
6. Offer/coupon notifications.
7. Monthly service reminder.
8. Support ticket updates.

## 2.3 Architecture (Recommended)

1. Mobile app gets FCM device token.
2. App sends token to backend after login.
3. Backend stores token per customer and platform.
4. On business events, backend sends push via Firebase Admin SDK.
5. App receives push:
   - Foreground: show local notification.
   - Background/terminated: open relevant screen on tap.
6. Optionally also write in-app notification record for history page and unread count.

## 2.4 Flutter App Changes (BCWCustomer)

### Step 1: Add Packages in pubspec.yaml

Add:

- firebase_core
- firebase_messaging
- flutter_local_notifications

### Step 2: Firebase Project Setup

1. Create Firebase project.
2. Add Android app package name.
3. Download google-services.json into android/app.
4. Add iOS app bundle id.
5. Download GoogleService-Info.plist into ios/Runner.
6. Enable Cloud Messaging in Firebase console.

### Step 3: Android Configuration

1. Add Google services plugin in android/build files.
2. Ensure notification permission for Android 13+ is requested.
3. Create notification channel for high-priority alerts.

### Step 4: iOS Configuration

1. Enable Push Notifications capability.
2. Enable Background Modes > Remote notifications.
3. Upload APNs key in Firebase.

### Step 5: Initialize in main.dart

At app startup:

1. Initialize Firebase.
2. Request notification permissions.
3. Read and refresh FCM token.
4. Register handlers:
   - onMessage
   - onMessageOpenedApp
   - background handler

### Step 6: Send Token to Backend

After login and on token refresh:

- POST token to backend endpoint (example): /customer/device-tokens
- Include: token, platform, appVersion, device info.

### Step 7: Foreground Notification UX

When app is open:

- FCM may not show system banner by default.
- Use flutter_local_notifications to display a visible notification.

### Step 8: Deep Linking on Notification Tap

Include payload data like:

- type: booking_update
- bookingId: <id>
- route: /booking-details
  Then navigate user to the correct screen.

## 2.5 Backend Changes (Node/Express)

### A) Device Token Storage

Create collection/table fields:

1. customerId
2. token
3. platform (android/ios)
4. isActive
5. lastSeenAt
6. createdAt/updatedAt

Use upsert by token + customerId so duplicates are avoided.

### B) Token APIs

1. POST /customer/device-tokens
   - Save or update token after login.
2. DELETE /customer/device-tokens/:token
   - Deactivate on logout.
3. Optional: PATCH /customer/device-tokens/:token/heartbeat
   - Keep active status fresh.

### C) Push Sending Service

Add firebase-admin to backend and initialize with service account.

Create utility function:

- sendPushToCustomer(customerId, title, body, data)

Behavior:

1. Fetch active tokens for customer.
2. Send multicast message.
3. Remove invalid tokens from DB on error responses.

### D) Trigger Points

Call push service in these places:

1. Booking created/confirmed.
2. Job status changed to started/completed.
3. Payment due reminders.
4. Promotional campaign scheduler.

## 2.6 Notification Payload Design (Recommended)

Use consistent payload keys:

- type
- title
- body
- bookingId
- action
- route
- createdAt

Example types:

- booking_confirmed
- worker_assigned
- service_started
- service_completed
- payment_reminder
- offer

## 2.7 In-App Notification Center (Optional but Useful)

Create a customer notifications table with:

1. customerId
2. type
3. title
4. message
5. data (json)
6. isRead
7. createdAt

APIs:

1. GET /customer/notifications
2. PATCH /customer/notifications/:id/read
3. PATCH /customer/notifications/read-all
4. GET /customer/notifications/unread-count

This lets you show full history inside app, not only push banners.

## 2.8 Security and Reliability Checklist

1. Only authenticated customer can register own tokens.
2. Limit promo push frequency (avoid spam).
3. Retry push for transient failures.
4. Clean invalid/expired tokens daily.
5. Log push send status for audit.
6. Add customer preference toggles by category.

## 2.9 Suggested Implementation Order (Fast and Safe)

1. Add Firebase dependencies and initialize app.
2. Implement token registration API and DB model.
3. Build backend push utility with firebase-admin.
4. Trigger push on booking status updates.
5. Add local notification display for foreground.
6. Add deep-link navigation from payload.
7. Add in-app notification history screen.
8. Add notification preferences.

## 2.10 1-Week Delivery Plan

Day 1: Firebase setup + app initialization.
Day 2: Token APIs + DB model.
Day 3: Backend push utility + test send endpoint.
Day 4: Booking event integration + foreground local notifications.
Day 5: Deep-link handling + QA.
Day 6: In-app notification list + unread count.
Day 7: Hardening, cleanup, release checklist.

---

If you want, next step can be a full technical task breakdown for your exact BCWCustomer and backend folders, including file-by-file changes.
