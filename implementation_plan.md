# Permanent Customer Deletion in Admin Dashboard

## Goal
Allow admins to permanently delete a customer (Pass) and all associated data by double-clicking the entry in the customer list. This ensures the user receives no further updates or pushes.

## User Review Required
> [!WARNING]
> This is a destructive action. Deleting a customer will remove:
> - The Pass record
> - All scan history
> - All push notification logs
> - Device registrations
> **This cannot be undone.**

## Proposed Changes

### Database / API
#### [NEW] `src/app/api/admin/customers/[id]/route.ts`
- Implement `DELETE` method.
- Perform clean deletion of `passes` row.
- Rely on Foreign Key `ON DELETE CASCADE` if available, or manually delete related `scans`, `push_logs`, `devices`.

### Frontend
#### [MODIFY] `src/components/admin/AdminCustomerList.tsx`
- Add `onDoubleClick` handler to the customer row.
- Propagate this event to the parent.

#### [MODIFY] `src/components/admin/CampaignDashboard.tsx`
- Implement `handleDeleteCustomer` function.
- Add a confirmation dialog (browser `confirm` or a UI modal) before execution to prevent accidental data loss.
- Call the new API endpoint.
- Refresh customer list upon success.

## Verification Plan
### Manual Verification
1.  Create a test customer (scan a QR code).
2.  Verify customer appears in Admin Dashboard.
3.  Double-click the customer in the list.
4.  Confirm deletion.
5.  Verify customer is gone from list.
6.  Verify in Supabase that `passes` and related rows are gone.
