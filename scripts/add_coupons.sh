#!/bin/bash

# Script to add all 4 types of coupons to canteen
# Usage: ./add_coupons.sh

CANTEEN_ID="edb83997-8230-42f0-ade5-2a1fc798f22e"
API_URL="http://localhost:3000/api/coupons"

echo "🎫 Adding all 4 coupon types to canteen: $CANTEEN_ID"
echo "=================================================="
echo ""

# 1. Flat Discount Coupon
echo "1️⃣  Creating Flat Discount Coupon (FLAT50)..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "'"$CANTEEN_ID"'",
    "code": "FLAT50",
    "name": "Flat ₹50 Off",
    "type": "flat",
    "description": "Get flat ₹50 off on orders above ₹200",
    "tagline": "Save ₹50 Today!",
    "aura_cost": 100,
    "valid_from": "2026-02-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "is_active": true,
    "conditions": [
      {
        "type": "min_order_value",
        "value": 200
      }
    ],
    "rewards": [
      {
        "type": "flat_discount",
        "value": 50
      }
    ]
  }'
echo -e "\n\n"

# 2. Percentage Discount Coupon
echo "2️⃣  Creating Percentage Discount Coupon (SAVE20)..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "'"$CANTEEN_ID"'",
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
      {
        "type": "min_order_value",
        "value": 300
      },
      {
        "type": "max_discount",
        "value": 100
      }
    ],
    "rewards": [
      {
        "type": "percentage_discount",
        "value": 20
      }
    ]
  }'
echo -e "\n\n"

# 3. Free Delivery Coupon
echo "3️⃣  Creating Free Delivery Coupon (FREEDEL)..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "'"$CANTEEN_ID"'",
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
      {
        "type": "order_type",
        "value": "delivery"
      },
      {
        "type": "min_order_value",
        "value": 150
      }
    ],
    "rewards": [
      {
        "type": "free_delivery",
        "value": true
      }
    ]
  }'
echo -e "\n\n"

# 4. Free Item Coupon
echo "4️⃣  Creating Free Item Coupon (FREECOKE)..."
echo "⚠️  NOTE: You need to replace 'REPLACE_WITH_ACTUAL_MENU_ITEM_ID' with a real menu item ID"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "'"$CANTEEN_ID"'",
    "code": "FREECOKE",
    "name": "Free Coke",
    "type": "free_item",
    "description": "Get a free Coke with orders above ₹250",
    "tagline": "Free Coke on Us!",
    "aura_cost": 75,
    "valid_from": "2026-02-01T00:00:00Z",
    "valid_until": "2026-12-31T23:59:59Z",
    "is_active": true,
    "conditions": [
      {
        "type": "min_order_value",
        "value": 250
      }
    ],
    "rewards": [
      {
        "type": "free_item",
        "item_id": "REPLACE_WITH_ACTUAL_MENU_ITEM_ID",
        "quantity": 1
      }
    ]
  }'
echo -e "\n\n"

echo "=================================================="
echo "✅ All coupon creation requests sent!"
echo "Check the responses above for any errors."
