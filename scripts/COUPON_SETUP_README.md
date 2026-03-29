# Coupon Creation Scripts

This directory contains scripts to help you create all 4 types of coupons for your canteen.

## Canteen ID
`edb83997-8230-42f0-ade5-2a1fc798f22e`

## Available Coupon Types

1. **Flat Discount** (`FLAT50`) - ₹50 off on orders above ₹200
2. **Percentage Discount** (`SAVE20`) - 20% off with max ₹100 discount
3. **Free Delivery** (`FREEDEL`) - Free delivery on orders above ₹150
4. **Free Item** (`FREECOKE`) - Free item with orders above ₹250

---

## Option 1: Using Postman

1. Import `postman_coupon_samples.json` into Postman
2. You'll see a collection with 4 requests
3. Make sure your dev server is running at `http://localhost:3000`
4. Execute each request one by one
5. **Important:** For the Free Item coupon, replace `REPLACE_WITH_ACTUAL_MENU_ITEM_ID` with an actual menu item ID from your database

---

## Option 2: Using Bash Script

```bash
# Make sure your dev server is running first
cd scripts
./add_coupons.sh
```

**Note:** The free item coupon requires a real menu item ID. Update the script before running.

---

## Manual Testing via cURL

### 1. Flat Discount
```bash
curl -X POST http://localhost:3000/api/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "edb83997-8230-42f0-ade5-2a1fc798f22e",
    "code": "FLAT50",
    "name": "Flat ₹50 Off",
    "type": "flat",
    "description": "Get flat ₹50 off on orders above ₹200",
    "tagline": "Save ₹50 Today!",
    "aura_cost": 100,
    "valid_from": "2026-02-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "is_active": true,
    "conditions": [{"type": "min_order_value", "value": 200}],
    "rewards": [{"type": "flat_discount", "value": 50}]
  }'
```

### 2. Percentage Discount
```bash
curl -X POST http://localhost:3000/api/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "edb83997-8230-42f0-ade5-2a1fc798f22e",
    "code": "SAVE20",
    "name": "20% Off",
    "type": "percentage",
    "description": "Get 20% off on your entire order",
    "tagline": "Flash Sale: 20% Off!",
    "aura_cost": 150,
    "valid_from": "2026-02-01T00:00:00Z",
    "valid_until": "2026-06-30T23:59:59Z",
    "is_active": true,
    "conditions": [
      {"type": "min_order_value", "value": 300},
      {"type": "max_discount", "value": 100}
    ],
    "rewards": [{"type": "percentage_discount", "value": 20}]
  }'
```

### 3. Free Delivery
```bash
curl -X POST http://localhost:3000/api/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "edb83997-8230-42f0-ade5-2a1fc798f22e",
    "code": "FREEDEL",
    "name": "Free Delivery",
    "type": "free_delivery",
    "description": "Get free delivery on all orders",
    "tagline": "Zero Delivery Charges!",
    "aura_cost": 50,
    "valid_from": "2026-02-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "is_active": true,
    "conditions": [
      {"type": "order_type", "value": "delivery"},
      {"type": "min_order_value", "value": 150}
    ],
    "rewards": [{"type": "free_delivery", "value": true}]
  }'
```

### 4. Free Item (Update menu_item_id!)
```bash
curl -X POST http://localhost:3000/api/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "edb83997-8230-42f0-ade5-2a1fc798f22e",
    "code": "FREECOKE",
    "name": "Free Coke",
    "type": "free_item",
    "description": "Get a free Coke with orders above ₹250",
    "tagline": "Free Coke on Us!",
    "aura_cost": 75,
    "valid_from": "2026-02-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "is_active": true,
    "conditions": [{"type": "min_order_value", "value": 250}],
    "rewards": [
      {
        "type": "free_item",
        "item_id": "YOUR_MENU_ITEM_ID_HERE",
        "quantity": 1
      }
    ]
  }'
```

---

## Getting Menu Item IDs

To get a menu item ID for the free item coupon:

```bash
# Get all menu items for your canteen
curl "http://localhost:3000/api/menu?canteen_id=edb83997-8230-42f0-ade5-2a1fc798f22e"
```

Copy an `id` from the response and use it in the free item coupon.

---

## Verifying Created Coupons

```bash
curl "http://localhost:3000/api/coupons?canteen_id=edb83997-8230-42f0-ade5-2a1fc798f22e"
```
