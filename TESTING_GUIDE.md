# Testing Guide - Order Management Bug Fixes

## Part 1: Testing Order Sync Fix

### Pre-Test Checklist
- [ ] Device is connected to internet
- [ ] Navigate to Order Management page
- [ ] Check sync status badge in top-left area (should show either "Online" or "Offline (X pending)")

### Test Scenario 1: Create Orders While Online
**Expected Behavior:** Orders should sync within 5 seconds

1. **Setup:**
   - Make sure device is online
   - Make sure sync badge shows "Online"
   - Navigate to Orders → Take Orders section

2. **Action:**
   - Add 5 test orders with various items
   - Click "Submit Order" button for each
   - Observe the sync badge

3. **Verification:**
   - Sync badge should show "Online" (not "Offline")
   - Each order should be queued in IndexedDB
   - Within 5 seconds, orders should sync to Supabase
   - Check browser console for logs like: "Syncing X orders (X pending, X failed)"
   - Check database to confirm orders appear in `orders` and `order_items` tables

### Test Scenario 2: Test Offline Sync Recovery
**Expected Behavior:** Orders created offline should sync when coming back online

1. **Setup:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Enable "Offline" mode (simulates no internet)

2. **Action:**
   - Create 3 orders
   - Sync badge should show "Offline (3 pending)"

3. **Verification:**
   - Orders are stored in IndexedDB
   - Disable offline mode (restore internet)
   - Sync badge should change to "Syncing..." then "Online"
   - Check database - all 3 orders should now be synced

### Test Scenario 3: Previous Stuck Orders
**If you had 5 pending orders before:**

1. **Action:**
   - Check sync badge - if still showing "Offline (5 pending)"
   - Refresh the page (Ctrl+R / Cmd+R)
   - Wait 10 seconds

2. **Verification:**
   - Sync badge should now show "Online"
   - Browser console should show sync logs
   - The 5 orders should now appear in the database

---

## Part 2: Testing Bluetooth Printing Fix

### Pre-Test Checklist
- [ ] Navigate to Settings → Printer Settings
- [ ] Note current Bluetooth toggle state

### Test Scenario 1: Bluetooth Disabled in Settings
**Expected Behavior:** No print popup when creating orders

1. **Setup:**
   - Go to Settings → Printer Settings
   - **Make sure "Bluetooth Printing" toggle is OFF**
   - Go back to Orders → Take Orders

2. **Action:**
   - Create a new order with items
   - Click "Submit Order"

3. **Verification:**
   - ❌ NO print dialog should appear
   - Check browser console - should show: "ℹ️ Bluetooth not enabled or not connected"
   - Order should still be created and synced normally

### Test Scenario 2: Bluetooth Enabled but No Device Connected
**Expected Behavior:** No print popup if device not connected

1. **Setup:**
   - Go to Settings → Printer Settings
   - **Enable "Bluetooth Printing" toggle**
   - **Do NOT connect to any Bluetooth printer**
   - Go back to Orders → Take Orders

2. **Action:**
   - Create a new order with items
   - Click "Submit Order"

3. **Verification:**
   - ❌ NO print dialog should appear
   - Check browser console - should show: "ℹ️ No saved Bluetooth printer" or "ℹ️ Saved Bluetooth printer not in authorized list"
   - Order should still be created and synced normally

### Test Scenario 3: Bluetooth Enabled and Device Connected
**Expected Behavior:** Print popup WILL appear

1. **Setup:**
   - Go to Settings → Printer Settings
   - **Enable "Bluetooth Printing" toggle**
   - Click "Test Bluetooth Connection"
   - Follow pairing process to connect to a Bluetooth printer

2. **Action:**
   - Create a new order with items
   - Click "Submit Order"

3. **Verification:**
   - ✅ Print dialog SHOULD appear
   - Check browser console - should show: "🖨️ Processing X print jobs"
   - Order should be created and synced normally

### Test Scenario 4: Connect/Disconnect Device
**Expected Behavior:** Printing respects real-time connection status

1. **Setup:**
   - Have a Bluetooth printer connected and paired
   - Go to Settings → Printer Settings
   - Enable Bluetooth printing

2. **Action:**
   - Create order #1 → Should print (device connected)
   - Turn OFF Bluetooth on the printer
   - Create order #2 → Should NOT print (device disconnected)
   - Turn ON Bluetooth on the printer
   - Create order #3 → Should print again (device reconnected)

3. **Verification:**
   - Only orders #1 and #3 should trigger print popups
   - Order #2 should be created without print attempt
   - All orders should sync normally regardless

---

## Part 3: Integration Testing

### Full Workflow Test
1. **Start online, Bluetooth enabled & connected:**
   - Create order → Should print and sync ✓

2. **Go offline, create order:**
   - Create order → Should NOT print, should queue in IndexedDB ✓
   - Sync badge shows "Offline (1 pending)"

3. **Turn off Bluetooth printer:**
   - Go online (but Bluetooth still off)
   - Previous order should sync ✓
   - Sync badge shows "Online"

4. **Reconnect Bluetooth, create order:**
   - Create order → Should print and sync ✓

---

## Debugging Tips

### Check Sync Status
```javascript
// In browser console:
const db = await getDB();
const pending = await db.getAllFromIndex('pending_orders', 'by-status', 'pending_sync');
console.log('Pending orders:', pending);
```

### Check Bluetooth Status
```javascript
// In browser console:
const enabled = localStorage.getItem('printer-bluetooth-enabled');
const savedId = localStorage.getItem('bluetooth-printer-id');
const devices = await navigator.bluetooth.getDevices();
console.log({ enabled, savedId, devices });
```

### View Sync Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Filter by: "Syncing" or "Bluetooth" or "🖨️"
4. Watch logs in real-time as orders are created

### Check Database
Use Supabase dashboard to check:
- `orders` table for synced orders
- `order_items` table for synced items
- Row timestamps to verify sync happened

---

## Common Issues & Solutions

### Issue: Still Showing "Offline (5 pending)"
**Solution:**
1. Hard refresh page (Ctrl+Shift+R)
2. Check browser console for sync errors
3. Verify internet connection is actually active
4. Check Supabase connection in DevTools

### Issue: Print Always Appears
**Cause:** Bluetooth check might not be working
**Debug:**
1. Check console for Bluetooth check logs
2. Verify `navigator.bluetooth.getDevices` is available
3. Check localStorage values are set correctly

### Issue: Orders Not Appearing in Database
**Cause:** Sync might still be stuck
**Debug:**
1. Check pending_orders in IndexedDB
2. Look for errors in console during sync
3. Verify Supabase credentials are correct
4. Check RLS policies aren't blocking writes

---

## Success Criteria

✅ **Sync Fix Complete When:**
- All pending orders sync within 5 seconds when online
- No more "Offline (pending)" status on successful sync
- Previously stuck orders sync after page refresh

✅ **Bluetooth Fix Complete When:**
- Print popup only appears when Bluetooth is enabled in settings
- Print popup only appears when device is actually connected
- No print popup when either condition is not met
