# KOT (Kitchen Order Ticket) Printing System

## Overview

The KOT (Kitchen Order Ticket) printing system is designed specifically for kitchen workers to receive order details **without pricing information**. This keeps customer pricing confidential while ensuring the kitchen has all the information needed to prepare orders efficiently.

## Features

### ✨ Key Highlights

- **📝 No Pricing Information**: KOT prints show items and quantities only - no prices
- **🖨️ Dual Printer Support**: Separate thermal printers for customer bills and KOT
- **📱 Thermal & Non-Thermal**: Works with both thermal printers (Bluetooth) and regular printers
- **🔧 Easy Configuration**: Simple setup in printer settings
- **👨‍🍳 Kitchen-Focused Design**: Large, clear text optimized for quick reading
- **🔄 Works Alongside Current Billing**: Customer billing remains completely unchanged

## What Gets Printed on a KOT?

### Included Information:
- ✅ Order number and serial number
- ✅ Order time
- ✅ Order type (dine-in, takeaway, delivery)
- ✅ Item names
- ✅ Item quantities (large, bold for visibility)
- ✅ Customer name (for delivery orders)
- ✅ Customer phone (for delivery orders)
- ✅ Special instructions (if any)
- ✅ Table number (if applicable)

### NOT Included:
- ❌ Item prices
- ❌ Subtotal
- ❌ GST/Taxes
- ❌ Total amount
- ❌ Payment information

## How to Use

### 1. Configure KOT Printer (One-time Setup)

1. Go to **Settings** → **Printer Settings**
2. Scroll to the **"KOT - Kitchen Order Ticket Printer"** section
3. Click **"Connect KOT Printer"**
4. Select your kitchen's thermal printer from the list
5. The printer will be saved and auto-connect next time

> **💡 Tip**: You can use the same printer for both customer bills and KOT, or set up separate printers. Many restaurants use:
> - Front desk printer → Customer bills with prices
> - Kitchen printer → KOT without prices

### 2. Print KOT for an Order

From the **Order Builder** / **Order Management** screen:

1. Find the order you want to send to the kitchen
2. Click the **"KOT"** button (orange, with chef hat icon) next to the "Bill" button
3. The KOT will print automatically to your configured KOT printer

### 3. Thermal vs Non-Thermal Printing

#### Thermal Printing (Recommended for Kitchen):
- **Faster**: Prints in 1-2 seconds
- **Silent**: No noise disturbance
- **No Ink**: Lower operating costs
- **Durable**: Receipts last throughout service
- **Auto-connect**: No dialog boxes after initial setup

#### Non-Thermal Printing:
- Uses regular printer with standard paper
- Shows browser print dialog
- Good for testing or backup

## Setup Examples

### Example 1: Single Restaurant Counter
```
Counter Staff PC:
├── Bill Button → Customer Bill (with prices)
└── KOT Button → Kitchen Order (no prices)
    └── Same thermal printer for both
```

### Example 2: Restaurant with Separate Kitchen
```
Front Counter:
├── Bill Button → Counter Thermal Printer
└── KOT Button → Kitchen Thermal Printer

Kitchen Display:
└── Only receives KOT prints (no pricing visible)
```

### Example 3: Multi-Station Restaurant
```
Cashier PC:
└── Bill Button → Receipt Printer (customer bills)

Order Taking PC:
└── KOT Button → Kitchen Printer #1 (no prices)

Kitchen Tablet:
└── View orders on screen or print additional KOTs
```

## Technical Details

### Thermal Printer Compatibility

- **Protocol**: ESC/POS commands via Bluetooth
- **Connection**: Web Bluetooth API (Chrome/Edge on Android)
- **Paper Size**: Optimized for 58mm thermal paper
- **Supported Services**:
  - `000018f0-0000-1000-8000-00805f9b34fb`
  - `49535343-fe7d-4ae5-8fa9-9fafd205e455`
  - `e7810a71-73ae-499d-8c15-faa9aef0c3f2`
  - `0000fff0-0000-1000-8000-00805f9b34fb`

### Browser Requirements

For thermal printing:
- ✅ Chrome 56+ on Android
- ✅ Edge on Android
- ✅ PWA (Progressive Web App) installed
- ❌ iOS Safari (Web Bluetooth not supported)
- ❌ Firefox (Web Bluetooth experimental)

For non-thermal printing:
- ✅ All modern browsers
- ✅ All operating systems

## Troubleshooting

### KOT Not Printing?

1. **Check Printer Connection**
   - Ensure KOT printer is on
   - Check Bluetooth is enabled
   - Verify printer is in range

2. **Verify Printer Settings**
   - Go to Settings → Printer Settings
   - Confirm KOT printer is shown under "Saved KOT Printer"
   - If not, reconnect the printer

3. **Test the Printer**
   - Click "Connect KOT Printer" in settings
   - Try printing a test order

4. **Fallback to Non-Thermal**
   - If thermal fails, the system automatically falls back to window.print()
   - This works on any printer but shows a dialog

### KOT Showing Prices?

**This should NEVER happen!** KOT is specifically designed to exclude all pricing.

If you see prices on a KOT:
- You clicked "Bill" instead of "KOT"
- Clear the printed ticket and print again with the "KOT" button

### Different Printer for KOT and Bill?

**Yes! This is recommended.**

1. Configure customer bill printer in the main printer settings
2. Configure KOT printer in the KOT section
3. Each will print to its configured device

### Want Same Printer for Both?

**No problem!**

1. Connect the printer once for customer bills
2. Connect the same printer for KOT
3. Both will use the same device - content will differ

## Best Practices

### 🎯 Recommended Workflow

1. **Order Placed** → Print customer bill immediately (for paid orders)
2. **Send to Kitchen** → Print KOT to kitchen printer
3. **Order Ready** → Mark as complete in system

### 📋 Kitchen Benefits

- ✨ **Focus on Cooking**: No distraction from pricing
- 🔢 **Clear Quantities**: Large, bold numbers easily visible
- 📝 **Order Details**: All necessary preparation info
- 🚫 **Privacy**: Customers' payment info stays at counter

### 💼 Business Benefits

- 🔐 **Price Confidentiality**: Kitchen staff don't know profit margins
- 📊 **Role Separation**: Clear separation of duties
- ⚡ **Faster Service**: Kitchen focuses only on preparation
- 📄 **Audit Trail**: Separate bills for customers and kitchen records

## Code Integration

### Print KOT from Your Code

```typescript
import { printKOT, type KOTData } from '@/lib/printer/kot-printer';

// Prepare KOT data
const kotData: KOTData = {
  canteenName: "Your Canteen Name",
  orderNumber: "A1B2",
  serialNumber: 42,
  createdAt: new Date().toISOString(),
  items: [
    { name: "Veg Burger", quantity: 2 },
    { name: "French Fries", quantity: 1, notes: "Extra crispy" }
  ],
  orderType: "dine-in",
  customerName: "John Doe", // For delivery orders
  specialInstructions: "Please make it spicy"
};

// Print to thermal printer
await printKOT(kotData, true);

// OR print to regular printer
await printKOT(kotData, false);
```

## Architecture

```
Order Management System
│
├── Customer Billing (lib/printer/pwa-printer.ts)
│   ├── Shows prices, totals, GST
│   ├── Payment information
│   └── Full invoice details
│
└── Kitchen Orders (lib/printer/kot-printer.ts) ← NEW!
    ├── NO prices or payment info
    ├── Item names and quantities only
    ├── Order metadata (time, type, etc.)
    └── Customer info for delivery only
```

## Sample KOT Output

```
╔══════════════════════════════════╗
║           K O T                  ║
║    Kitchen Order Ticket          ║
╚══════════════════════════════════╝

#42
Order: A1B2
3:45 PM

[DINE-IN]

─────────────────────────────────

ITEMS TO PREPARE:

2×
Veg Burger
─────────────────────────────────

1×
French Fries
Note: Extra crispy
─────────────────────────────────

⚠️ SPECIAL INSTRUCTIONS:
Please make it spicy

─────────────────────────────────
For Kitchen Use Only
```

## Support

For issues or questions:
- Check this documentation first
- Review printer settings
- Test with a sample order
- Contact your system administrator

---

**Made with ❤️ for efficient kitchen operations**
*Part of the ZLICE Canteen Management System*
