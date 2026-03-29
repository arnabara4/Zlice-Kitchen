# Security Hardening Guide: Auth Session Validation

## Overview

This document outlines the systematic security hardening of all API routes to use centralized auth validation with session expiry checking.

## Centralized Auth Helper

All routes should use `/lib/api-auth.ts` helpers which provide:

### 1. `validateAuthSession()`

Validates auth token and checks for expiry. Use for general authenticated endpoints.

```typescript
import { validateAuthSession } from '@/lib/api-auth';

export async function GET/POST(req: Request) {
  const { session, error } = await validateAuthSession();
  if (error) return error;

  // session contains: user_id, canteen_id, user_type, expires_at
  // All validation already done: token valid, not expired, user_type matches
}
```

### 2. `validateAuthSessionWithRole(role)`

Validates auth token AND checks user_type matches required role. Use for role-specific endpoints.

```typescript
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function GET(req: Request) {
  const { session, error } = await validateAuthSessionWithRole("canteen");
  if (error) return error; // Returns 401 if user is not 'canteen' type

  // session guaranteed to be canteen user
}
```

**Supported roles:**

- `'canteen'` - Canteen POS users
- `'delivery'` - Delivery partner users
- `'super_admin'` - Super admin users

### 3. `validateCanteenAccess(sessionCanteenId, resourceCanteenId)`

Prevents cross-canteen data access. Returns boolean, use in business logic checks.

```typescript
import { validateCanteenAccess } from "@/lib/api-auth";

if (!validateCanteenAccess(session?.canteen_id, resourceCanteenId)) {
  return NextResponse.json(
    { error: "Forbidden: Canteen mismatch" },
    { status: 403 },
  );
}
```

## Migration Pattern

### Before (Insecure)

```typescript
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (!authToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Missing: session expiry validation!
  // Missing: user_type validation!
  const { data: sessionData } = await supabaseAdmin
    .from("auth_sessions")
    .select("canteen_id, user_type")
    .eq("token", authToken)
    .single();

  if (!sessionData) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
```

### After (Secure)

```typescript
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function POST(req: Request) {
  // ✅ Validates token, expiry, user_type in ONE call
  const { session, error } = await validateAuthSessionWithRole("canteen");
  if (error) return error;

  // session now guaranteed valid, not expired, correct role
}
```

## Files Completed ✅

| File                                        | Status | Last Updated                           |
| ------------------------------------------- | ------ | -------------------------------------- |
| `/app/api/auth/me/route.ts`                 | ✅     | Session                                |
| `/app/api/menu/route.ts`                    | ✅     | validateAuthSession                    |
| `/app/api/orders/create/route.ts`           | ✅     | Manual (expires_at)                    |
| `/app/api/orders/delete/route.ts`           | ✅     | validateAuthSession                    |
| `/app/api/orders/edit/route.ts`             | ✅     | validateAuthSession                    |
| `/app/api/orders/list/route.ts`             | ✅     | validateAuthSession                    |
| `/app/api/orders/update-status/route.ts`    | ✅     | validateAuthSession                    |
| `/app/api/canteen/status/route.ts`          | ✅     | validateAuthSessionWithRole('canteen') |
| `/app/api/canteen/dashboard-stats/route.ts` | ✅     | validateAuthSessionWithRole('canteen') |
| `/lib/auth-context.tsx`                     | ✅     | credentials + no changes needed        |
| `/lib/supabase/admin.ts`                    | ✅     | Removed insecure fallback              |
| `/lib/api-auth.ts`                          | ✅     | NEW - Centralized helper               |

## Files Needing Updates (Priority Order)

### CRITICAL - Auth & Session Management (3 files)

1. **`/app/api/auth/login/route.ts`**
   - Current: Manual session creation + token generation
   - Action: No change needed - this creates sessions, validates after login
   - Reason: Creates the auth_session, so can't validate using it yet
   - Priority: AFTER

2. **`/app/api/auth/logout/route.ts`**
   - Current: Uses cookies client
   - Action: Use `validateAuthSession()` then delete session

   ```typescript
   const { session, error } = await validateAuthSession();
   if (error) return error;

   await supabaseAdmin.from("auth_sessions").delete().eq("token", token);
   ```

3. **`/app/api/auth/change-password/route.ts`**
   - Current: Manual validation
   - Action: Replace with `validateAuthSession()`

### HIGH - Order Management (4 files)

4. **`/app/api/orders/update-payment/route.ts`**
   - Action: Replace manual validation with `validateAuthSession()`

5. **`/app/api/orders/today-latest/route.ts`**
   - Action: Replace manual validation with `validateAuthSession()`

6. **`/app/api/orders/manage/route.ts`**
   - Action: Replace manual validation with `validateAuthSession()`

7. **`/app/api/orders/notify-status-change/route.ts`**
   - Action: Replace manual validation with `validateAuthSession()`

### MEDIUM - Khata/Credit (2 files)

8. **`/app/api/khata/create/route.ts`**
   - Action: Replace manual validation with `validateAuthSession()`

9. **`/app/api/khata/delete/route.ts`**
   - Action: Replace manual validation with `validateAuthSession()`

### MEDIUM - Analytics/Dashboard (6 files)

10. **`/app/api/canteen/dashboard-chart/route.ts`**
    - Action: Replace server client + manual validation with `validateAuthSessionWithRole('canteen')`
    - Also: Replace `supabase` with `supabaseAdmin`

11. **`/app/api/canteen/online-earnings/route.ts`**
    - Action: Same as dashboard-chart

12. **`/app/api/canteen/delivery-earnings/route.ts`**
    - Action: Same as dashboard-chart

13. **`/app/api/canteen/settlement-details/route.ts`**
    - Action: Same as dashboard-chart

14. **`/app/api/canteen/settlements/route.ts`**
    - Action: Same as dashboard-chart

15. **`/app/api/canteen/payments/** (multiple files)\*\*
    - Action: Same as dashboard-chart

### MEDIUM - Delivery System (8 files)

16. **`/app/api/delivery/login/route.ts`**
    - Action: Similar to canteen status - use `validateAuthSessionWithRole('delivery')`

17. **`/app/api/delivery/orders/route.ts`**
    - Action: Use `validateAuthSessionWithRole('delivery')`

18. **`/app/api/delivery/push-subscription/route.ts`**
    - Action: Use `validateAuthSessionWithRole('delivery')`

19-23. **Other delivery/\* endpoints** - Action: Use `validateAuthSessionWithRole('delivery')`

### LOW - Admin Functions (11+ files)

24. **`/app/api/admin/settlements/** (multiple files)\*\*
    - Action: Use `validateAuthSessionWithRole('super_admin')`

## Implementation Checklist

### Phase 1: Critical Auth Routes

- [ ] `/app/api/auth/logout/route.ts` - Add validateAuthSession()
- [ ] `/app/api/auth/change-password/route.ts` - Replace manual with helper

### Phase 2: Order Management

- [ ] `/app/api/orders/update-payment/route.ts`
- [ ] `/app/api/orders/today-latest/route.ts`
- [ ] `/app/api/orders/manage/route.ts`
- [ ] `/app/api/orders/notify-status-change/route.ts`

### Phase 3: Khata & Credit

- [ ] `/app/api/khata/create/route.ts`
- [ ] `/app/api/khata/delete/route.ts`

### Phase 4: Analytics & Dashboard (includes client swap)

- [ ] `/app/api/canteen/dashboard-chart/route.ts`
- [ ] `/app/api/canteen/online-earnings/route.ts`
- [ ] `/app/api/canteen/delivery-earnings/route.ts`
- [ ] `/app/api/canteen/settlement-details/route.ts`
- [ ] `/app/api/canteen/settlements/route.ts`
- [ ] `/app/api/canteen/payments/** (all sub-routes)`

### Phase 5: Delivery System

- [ ] `/app/api/delivery/login/route.ts`
- [ ] `/app/api/delivery/orders/route.ts`
- [ ] `/app/api/delivery/push-subscription/route.ts`
- [ ] Other delivery endpoints (verify list)

### Phase 6: Admin Functions

- [ ] `/app/api/admin/settlements/**` (all routes)
- [ ] Other admin endpoints (verify list)

## Testing Checklist

After updating each route:

1. **Valid Session**: Confirm authenticated user can access endpoint
2. **Expired Session**: Confirm 401 when token expires
3. **Cross-Canteen Access**: Confirm 403 when accessing another canteen's data
4. **Wrong Role**: Confirm 401 when user role doesn't match required role
5. **Missing Token**: Confirm 401 when no auth token provided

## Quick Reference: Import Changes

Every file needs this import added:

```typescript
import { validateAuthSession } from "@/lib/api-auth";
// OR
import { validateAuthSessionWithRole } from "@/lib/api-auth";
```

And this line removed:

```typescript
import { cookies } from "next/headers";
// And remove all: await cookies() / cookieStore usage for auth
```

And for dashboard files, also change:

```typescript
// REMOVE:
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// ADD:
import { supabaseAdmin } from "@/lib/supabase/admin";
// Then replace all `supabase.from()` with `supabaseAdmin.from()`
```

## Security Validation

The centralized helper provides:

✅ **Token Existence**: Validates token exists in auth_sessions table
✅ **Session Expiry**: Checks expires_at >= current time
✅ **User Type Match**: Validates user_type cookie matches session user_type (prevents token tampering)
✅ **Role-based Access**: Optional - validates user_type matches required role
✅ **Consistent Error Handling**: Returns standardized 401 responses

## Production Deployment

Before deploying to production:

1. [ ] All 38 files updated with centralized helper
2. [ ] Run full test suite on all API routes
3. [ ] Verify expired sessions are rejected
4. [ ] Verify cross-canteen access is prevented
5. [ ] Verify role-based access control works
6. [ ] Monitor error logs for any 401s from legitimate users
7. [ ] Confirm zero instances of manual `auth_sessions` queries outside helper

## Troubleshooting

**403 Forbidden when accessing own data?**

- Check `validateCanteenAccess()` in business logic
- Verify `sessionData.canteen_id` matches requested resource's canteen_id

**401 Unauthorized for valid session?**

- Verify frontend sends `credentials: 'include'` in fetch
- Check token hasn't been maliciously modified
- Verify user_type cookie exists and matches session

**Expired session not being rejected?**

- Verify helper is being called (not manual validation)
- Check database has `expires_at` column with proper timestamp
- Verify session creation sets 7-day expiry

## Questions?

Refer to `/lib/api-auth.ts` for implementation details and docstrings.
