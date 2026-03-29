# KOT UI Changes - Visual Guide

## Order Builder Interface Changes

### Before (Single Print Button):
```
┌─────────────────────────────────────────┐
│  Order #42                              │
│  --------------------------------        │
│  Items: Burger x2, Fries x1             │
│                                         │
│  [🔥 Cook] [✓ Ready] [🖨️Print]          │
│                                         │
│  Payment: PAID                          │
└─────────────────────────────────────────┘
```

### After (Dual Print Buttons):
```
┌─────────────────────────────────────────┐
│  Order #42                              │
│  --------------------------------        │
│  Items: Burger x2, Fries x1             │
│                                         │
│  [🔥 Cook] [✓ Ready]                    │
│  [🖨️ Bill] [👨‍🍳 KOT]                     │
│                                         │
│  Payment: PAID                          │
└─────────────────────────────────────────┘
```

## Button Styling

### Bill Button (Original):
- Icon: 🖨️ Printer
- Text: "Bill"
- Color: Default outline (slate borders)
- Tooltip: "Print Customer Bill"
- Action: Prints full bill with prices

### KOT Button (NEW):
- Icon: 👨‍🍳 Chef Hat
- Text: "KOT"
- Color: Orange theme (orange borders & background)
- Tooltip: "Print KOT (Kitchen Order Ticket) - No Prices"
- Action: Prints kitchen ticket without prices

## Printer Settings UI

### Original Settings:
```
┌──────────────────────────────────────┐
│  🖨️ Printer Settings                 │
│  Configure Bluetooth thermal printer │
├──────────────────────────────────────┤
│                                      │
│  ℹ️ PWA Installed: ✅ Yes            │
│  📡 Bluetooth Available: ✅ Yes      │
│  🖨️ Saved Printer: RP58-PRINTER     │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│  Bluetooth Printing          [ON]    │
│                                      │
│  [📡 Connect Printer]                │
│                                      │
└──────────────────────────────────────┘
```

### Enhanced Settings with KOT:
```
┌──────────────────────────────────────┐
│  🖨️ Printer Settings                 │
│  Configure Bluetooth thermal         │
│  printers for customer bills and     │
│  kitchen orders                      │
├──────────────────────────────────────┤
│                                      │
│  ℹ️ PWA Installed: ✅ Yes            │
│  📡 Bluetooth Available: ✅ Yes      │
│  🖨️ Saved Printer: RP58-PRINTER     │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│  Bluetooth Printing          [ON]    │
│                                      │
│  [📡 Connect Printer]                │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                      │
│  🟠 KOT Kitchen Order Ticket Printer │
│  Separate printer for kitchen        │
│  workers (prints orders without      │
│  prices)                             │
│                                      │
│  🖨️ Saved KOT Printer:               │
│     RP80-KITCHEN                🗑️   │
│                                      │
│  [📡 Connect KOT Printer]            │
│                                      │
│  ✓ KOT Printer saved! Kitchen        │
│    orders will print here            │
│    automatically.                    │
│                                      │
└──────────────────────────────────────┘
```

## Print Output Comparison

### Customer Bill (Original):
```
╔════════════════════════════════╗
║         YOUR CANTEEN           ║
║    123 Main St, City           ║
║    Tel: 123-456-7890           ║
╠════════════════════════════════╣
║ ORDER: A1B2                    ║
║ #42                            ║
║ 28 Jan 2026 | 3:45 PM         ║
║ DINE-IN | CASH                ║
╠════════════════════════════════╣
║                                ║
║ DELIVER TO:                    ║
║ John Doe                       ║
║ Phone: 123-456-7890           ║
║                                ║
╠════════════════════════════════╣
║ ITEM            QTY      AMT   ║
╠════════════════════════════════╣
║ Veg Burger       x2    Rs120  ║
║ French Fries     x1     Rs50  ║
╠════════════════════════════════╣
║ Subtotal              Rs170   ║
║ GST (5%)               Rs8.50 ║
║ Packaging              Rs10   ║
╠════════════════════════════════╣
║ TOTAL                 Rs188.50║
╠════════════════════════════════╣
║           [ PAID ]             ║
╠════════════════════════════════╣
║   Thank You for Ordering!      ║
║      Visit Again Soon          ║
║                                ║
║      Powered by ZLICE          ║
║       www.zlice.in             ║
╚════════════════════════════════╝
```

### KOT (NEW - No Prices):
```
╔════════════════════════════════╗
║            K O T               ║
║   Kitchen Order Ticket         ║
╚════════════════════════════════╝

               #42
         Order: A1B2
           3:45 PM

          [DINE-IN]

================================

        ITEMS TO PREPARE:

        2×
      Veg Burger

--------------------------------

        1×
     French Fries

--------------------------------

     For Kitchen Use Only
      Powered by ZLICE

╚════════════════════════════════╝
```

## Key Visual Differences

### Customer Bill:
✅ Shows all prices (Rs120, Rs50, etc.)
✅ Shows subtotal, GST, packaging
✅ Shows total amount (Rs188.50)
✅ Shows payment status (PAID)
✅ Shows customer info
✅ Professional receipt format

### KOT:
❌ **NO PRICES ANYWHERE**
✅ Large order number (#42) for easy reference
✅ **Extra large quantities** (2×, 1×) for visibility
✅ Clear item names
✅ Order time and type
✅ "For Kitchen Use Only" footer
❌ No totals or payment info

## Button Placement

### Desktop View:
```
┌────────────────────────────────────────┐
│ Order #A1B2          Serial: #42       │
│ 3:45 PM              DINE-IN           │
│                                        │
│ Items:                                 │
│ - Veg Burger x2                        │
│ - French Fries x1                      │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ [🔥 Start] [👨‍🍳 Cooking]          │  │
│ │ [✓ Ready]  [✅ Complete]          │  │
│ │                                   │  │
│ │ [🖨️ Bill]  [👨‍🍳 KOT]    [💰 PAID] │  │
│ └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Mobile View:
```
┌──────────────────┐
│ Order #A1B2      │
│ Serial: #42      │
│ 3:45 PM          │
│ DINE-IN          │
│                  │
│ Items:           │
│ - Veg Burger x2  │
│ - French Fries×1 │
│                  │
│ [🔥 Start Cook]  │
│ [✓ Ready]        │
│                  │
│ [🖨️ Bill]        │
│ [👨‍🍳 KOT]         │
│                  │
│ 💰 PAID          │
└──────────────────┘
```

## Color Coding

### Bill Button:
- Border: `slate-300` / `slate-700` (neutral)
- Background: Default (white/transparent)
- Hover: Standard hover effect

### KOT Button:
- Border: `orange-300` / `orange-700` (kitchen theme)
- Background: `orange-50` / `orange-900/20` (subtle orange)
- Hover: `orange-100` / `orange-900/30` (brighter orange)

## Icons Used

- **Bill**: `Printer` icon from lucide-react
- **KOT**: `ChefHat` icon from lucide-react

## Responsive Behavior

### Desktop (>768px):
- Buttons displayed in a row
- Icon + Text
- Larger padding

### Mobile (<768px):
- Buttons stacked or in flex wrap
- Icon + Text (compact)
- Smaller padding
- Still clearly distinguishable

## Accessibility

### Bill Button:
- Title: "Print Customer Bill"
- ARIA role: button
- Keyboard accessible

### KOT Button:
- Title: "Print KOT (Kitchen Order Ticket) - No Prices"
- ARIA role: button
- Keyboard accessible
- Distinct color for easy identification

---

## Quick Reference

| Action | Button | Output |
|--------|--------|--------|
| Print for customer | 🖨️ Bill | Full receipt with prices |
| Print for kitchen | 👨‍🍳 KOT | Order ticket without prices |
| Configure bill printer | Settings → Printer Settings → Connect Printer | Saves customer bill printer |
| Configure KOT printer | Settings → Printer Settings → KOT Section → Connect KOT Printer | Saves kitchen printer |

---

*Visual guide for KOT implementation*
*Part of ZLICE Canteen Management System*
</Parameter>
<parameter name="Complexity">3
