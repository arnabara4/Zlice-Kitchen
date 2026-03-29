# Atpos Bluetooth Printer Integration Guide

## Current Implementation ✅

Your app uses **browser native printing** (`window.print()`), which works with Atpos Bluetooth printers through:
- System print dialog
- 58mm thermal receipt format
- Mobile-optimized CSS

## Setup Requirements

### For Android (Recommended)
1. **Pair the Printer:**
   - Go to Settings → Bluetooth
   - Turn on Atpos printer
   - Pair the device (PIN usually: 0000 or 1234)

2. **In Browser:**
   - Use Chrome or Edge browser
   - Click Print button in app
   - Select your Atpos printer from list
   - Print should work automatically

### For iOS
1. **Pair the Printer:**
   - Go to Settings → Bluetooth
   - Pair Atpos printer

2. **Print Options:**
   - Some Atpos models support AirPrint
   - May need Atpos manufacturer app
   - Alternative: Use Android device for printing

## Testing Checklist

- [ ] Printer paired via Bluetooth
- [ ] Printer shows in system print dialog
- [ ] Test print shows proper formatting
- [ ] All sections visible (header, items, total)
- [ ] Text not cut off at margins
- [ ] Print completes without errors

## Common Issues & Solutions

### Issue: Printer not appearing in print dialog
**Solution:**
1. Ensure printer is ON and paired
2. Restart printer
3. Re-pair Bluetooth device
4. Try from Chrome browser

### Issue: Print cuts off or formatting wrong
**Solution:**
- Already fixed in latest code update
- Ensure printer width set to 58mm
- Check printer paper loaded correctly

### Issue: Print dialog shows but nothing prints
**Solution:**
1. Check printer has paper
2. Verify printer is online (not in sleep mode)
3. Check printer battery/power
4. Clear print queue in system settings

### Issue: Slow printing or timeout
**Solution:**
- Already fixed with 3-second timeout
- Ensure strong Bluetooth signal
- Keep device close to printer (< 5 meters)

## Alternative: Direct ESC/POS Printing (Advanced)

If you need **direct printing** without dialog:

### Install ESC/POS Library:
```bash
npm install escpos escpos-bluetooth-adapter
# or
pnpm add escpos escpos-bluetooth-adapter
```

### Implementation Example:
```typescript
// lib/printer/escpos-printer.ts
import { Printer } from 'escpos';
import { BluetoothAdapter } from 'escpos-bluetooth-adapter';

export async function printReceipt(receiptData: any) {
  try {
    // Request Bluetooth device
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['49535343-fe7d-4ae5-8fa9-9fafd205e455'] }]
    });
    
    const adapter = new BluetoothAdapter(device);
    const printer = new Printer(adapter);
    
    await adapter.open();
    
    printer
      .align('ct')
      .style('bu')
      .size(2, 2)
      .text(receiptData.canteenName)
      .size(1, 1)
      .text(receiptData.address)
      .text(`Order #${receiptData.orderNumber}`)
      .feed(1)
      .tableCustom(receiptData.items)
      .feed(1)
      .text(`Total: ₹${receiptData.total}`)
      .cut()
      .close();
      
  } catch (error) {
    console.error('ESC/POS Print failed:', error);
    // Fallback to window.print()
    window.print();
  }
}
```

## Recommendation

**Keep current implementation** - it's simpler, more compatible, and works well for most scenarios. The CSS fixes applied ensure proper rendering on Atpos thermal printers.

Only add ESC/POS library if you need:
- Silent printing (no dialog)
- Custom printer commands
- Advanced barcode/QR printing
- Drawer kick commands

## Printer Models Tested

- Atpos 58mm Thermal (Most common)
- Works with standard ESC/POS protocol
- Bluetooth versions compatible with Android/iOS

## Support

If issues persist:
1. Check Atpos printer manual for specific settings
2. Update printer firmware if available
3. Test with printer's official app first
4. Verify paper width matches CSS (58mm)
