# Unified Printer Configuration - Bills & KOTs

## ✅ Same Printer for Both Bills and Kitchen KOTs

Your KOT (Kitchen Order Ticket) system now uses the **SAME printer** as your customer billing system. This gives you a simpler, more efficient setup!

---

## 🎯 Key Benefits

### 1. **Single Printer Configuration**
- Configure once in **Printer Settings**
- Works for both customer bills and kitchen KOTs
- No duplicate setup needed!

### 2. **Same Bluetooth Connection**
- One printer pairing
- Uses same saved printer ID from localStorage: `bluetooth-printer-id`
- Consistent connection logic

### 3. **Different Print Formats**
The **same physical printer** prints different formats:

#### Customer Bill Format:
```
================================
      ZLICE CANTEEN
================================
Order: #5 | Serial: CJ6L
Time: 12:57 AM
Type: DINE-IN
================================
QTY  ITEM           PRICE
--------------------------------
1x   Item Name       ₹50.00
--------------------------------
Subtotal:            ₹50.00
GST (5%):            ₹2.50
TOTAL:              ₹52.50
================================
Powered by ZLICE
```

#### Kitchen KOT Format (No Prices):
```
================================
        ZLICE KOT
================================
              #5
   CJ6L 12:57 am [DINE-IN]
         TABLE: 12
--------------------------------
QTY  ITEM
1x   Item Name
--------------------------------
Kitchen Use Only
ZLICE
```

---

## 📋 How It Works

### In Code (`lib/printer/kot-printer.ts`):

The KOT printer NOW uses:
- ✅ Same `localStorage.getItem('bluetooth-printer-id')` as billing
- ✅ Same printer connection logic  
- ✅ Same Bluetooth device cache
- ❌ No separate `bluetooth-kot-printer-id`

### Shared Configuration:
```typescript
// Both use this:
getSavedPrinterId() {
  return localStorage.getItem('bluetooth-printer-id'); // SAME KEY
}
```

---

## 🖨️ Usage

### Step 1: Configure Printer (One Time)
1. Go to **Settings** → **Printer Settings**
2. Click **"Connect Bluetooth Printer"**
3. Select your thermal printer
4. Printer is now saved for BOTH bills and KOTs!

###Step 2: Print Customer Bill
```typescript
printOrder(order); // Prints with prices
```

### Step 3: Print Kitchen KOT
```typescript
printKOTForOrder(order); // Prints without prices, same printer!
```

---

## 🔧 Technical Details

### Printer Settings UI (`printer-settings.tsx`):
- **Single printer section** (not two)
- Description: "Configure Bluetooth thermal printer for customer bills and kitchen KOTs"
- One "Connect Bluetooth Printer" button
- Info box: "This printer will be used for both customer bills and kitchen KOTs"

### KOT Printer Module (`kot-printer.ts`):
- Uses billing printer's saved device ID
- No separate KOT printer state
- Same reconnection logic
- Different ESC/POS commands (no prices)

---

## 🎨 Print Button UI

In `order-builder.tsx`, you have **two distinct buttons**:

### Desktop View:
```tsx
<Button onClick={() => printOrder(order)}>
  <Printer /> Bill
</Button>

<Button onClick={() => printKOTForOrder(order, true)}>
  <ChefHat /> KOT
</Button>
```

---

## 📊 Comparison Chart

| Feature | Customer Bill | Kitchen KOT |
|---------|--------------|-------------|
| **Printer Used** | Saved Bluetooth Printer | SAME Printer ✅ |
| **localStorage Key** | `bluetooth-printer-id` | `bluetooth-printer-id` ✅ |
| **Shows Prices** | ✅ Yes | ❌ No |
| **Shows Items** | ✅ Yes | ✅ Yes |
| **Shows Quantities** | ✅ Yes | ✅ Yes |
| **Shows Table #** | Optional | ✅ Yes (for dine-in) |
| **Print Format** | Detailed Bill | Compact KOT |
| **Target Audience** | Customer | Kitchen Staff |

---

## 🚀 Workflow Example

### Scenario: New Order Placed

1. **Cashier** clicks "**Bill**" button
   - Same printer prints customer receipt WITH prices
   - Customer gets bill

2. **Cashier** clicks "**KOT**" button  
   - Same printer prints kitchen ticket WITHOUT prices
   - Kitchen gets order details

3. **One Printer** - Two Formats! 🎯

---

## 💡 Why This Approach?

### **Simpler for Users:**
- ✅ No confusion about which printer to use
- ✅ Single setup process
- ✅ One device to manage

### **Cost Effective:**
- ✅ No need for second thermal printer
- ✅ Shared paper roll
- ✅ Less maintenance

### **Practical:**
- ✅ Print bills and KOTs from same location
- ✅ Cashier can hand KOT to kitchen directly
- ✅ Streamlined workflow

---

## 🔄 Migration from Separate Printers

If you previously had separate KOT printer config:

```typescript
// OLD (Separate):
bluetooth-printer-id → Customer Bill Printer
bluetooth-kot-printer-id → Kitchen KOT Printer

// NEW (Unified):
bluetooth-printer-id → BOTH Bills and KOTs ✅
```

**What Changed:**
- Removed `bluetooth-kot-printer-id` from localStorage
- Removed KOT printer section from Printer Settings UI
- KOT now uses same device as billing

**What Stays The Same:**
- Print button functionality  
- KOT format (no prices)
- Bill format (with prices)

---

## 📱 User Instructions

### For Cashier/Staff:

1. **First Time Setup:**
   - Go to Settings
   - Click "Connect Bluetooth Printer"
   - Choose your thermal printer
   - Done! ✅

2. **Daily Use:**
   - For customer: Click "**Bill**" → receipt prints with prices
   - For kitchen: Click "**KOT**" → order prints without prices
   - Both use same printer!

3. **If Printer Changes:**
   - Go to Settings
   - Click "Forget Printer"
   - Connect new printer
   - Both bills and KOTs will use new printer

---

## ✔️ Summary

🎯 **One Printer, Two Formats**
- Same physical Bluetooth thermal printer
- Different content (bills have prices, KOTs don't)
- Simplified configuration
- Cost-effective solution

🚀 **Smart Implementation**
- Shared printer settings
- Unified connection logic
- Distinct print formats
- Professional results

💪 **Benefits**
- Easier to set up
- Less to manage
- More economical
- Practical workflow

---

**Result:** A streamlined printing system that's easier to configure, maintain, and use! 🎉

*Powered by ZLICE*
