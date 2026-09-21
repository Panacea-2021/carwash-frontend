# Customer Modals

This folder contains modals specifically for customer and vehicle management operations.

## Modals Overview

### 1. BlockedDeactivationModal.jsx

**Purpose**: Prevents deactivation when pending payments exist

**When shown**:

- User clicks Customer/Vehicle deactivate toggle
- System finds unpaid transactions
- Blocks the deactivation process

**Features**:

- 🔴 Red theme (blocking/error state)
- Displays detailed payment table with:
  - Payment ID
  - Vehicle Number
  - Parking Number
  - Transaction Date
  - Amount Charged
  - Amount Paid
  - Amount Due
  - Payment Status
- Shows total outstanding amount
- Action: Close only (cannot proceed)

**Props**:

```js
{
  isOpen: boolean,
  onClose: function,
  payments: array,      // Array of payment objects
  totalDue: number,     // Total amount outstanding
  customerName: string, // Customer/Vehicle identifier
  type: "customer" | "vehicle"
}
```

---

### 2. DeactivationReasonModal.jsx

**Purpose**: Collects deactivation details when allowed

**When shown**:

- User clicks Customer/Vehicle deactivate toggle
- System finds NO pending payments
- Allows deactivation to proceed

**Features**:

- 🟡 Amber/Orange theme (warning/action state)
- Form fields:
  - Deactivation Date (required, defaults to today)
  - Expected Reactivation Date (optional)
  - Reason for Deactivation (required, textarea)
- Validation for dates and reason
- Actions: Cancel or Deactivate

**Props**:

```js
{
  isOpen: boolean,
  onClose: function,
  onConfirm: function,  // Called with { deactivateDate, reactivateDate, deactivateReason }
  title: string,        // Modal title
  entityName: string,   // Customer/Vehicle name
  type: "customer" | "vehicle"
}
```

---

## Usage Flow

```
User clicks Deactivate Toggle
        ↓
Check for Pending Payments
        ↓
   ┌────┴────┐
   ↓         ↓
Has Dues   No Dues
   ↓         ↓
Blocked    Reason
Modal      Modal
(Red)     (Amber)
   ↓         ↓
 Close    Proceed
         with reason
```

## File Naming Convention

- **Blocked** = Something prevents the action (informational only)
- **Reason** = Collecting information to proceed with action

This makes it clear at a glance which modal stops you vs which modal lets you continue.
