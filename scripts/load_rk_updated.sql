-- Load updated menu items from rk.json for canteen 9191d852-91df-4723-a438-e8ebf31cc626
-- This script will insert or update menu items with the latest prices

INSERT INTO menu_items (name, price, canteen_id, is_available, category, item_type, is_recommended) VALUES
-- ROLL
('Vegetable Roll', 25.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'veg', false),
('Vegetable Cheese Roll', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'veg', false),
('Paneer Roll', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'veg', false),
('Paneer Cheese Roll', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'veg', false),
('Egg Roll', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'non-veg', false),
('Egg Cheese Roll', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'non-veg', false),
('Chicken Roll', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'non-veg', false),
('Chicken Cheese Roll', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'non-veg', false),
('Mixed Roll', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'non-veg', false),
('Mixed Cheese Roll', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROLL', 'non-veg', false),

-- CHOWMIN / NOODLES (Updated +10)
('Veg Chow', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'veg', false),
('Veg Schezwan Chow', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'veg', false),
('Paneer Chow', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'veg', false),
('Paneer Schezwan Chow', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'veg', false),
('Egg Chow', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'non-veg', false),
('Egg Schezwan Chow', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'non-veg', false),
('Chicken Chow', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'non-veg', false),
('Chicken Schezwan Chow', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'non-veg', false),
('Mixed Chow', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'non-veg', false),
('Mixed Schezwan Chow', 90.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHOWMIN / NOODLES', 'non-veg', false),

-- SOUP (VEG / NON-VEG)
('Veg Hot & Sour Soup', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SOUP (VEG / NON-VEG)', 'veg', false),
('Tomato Soup', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SOUP (VEG / NON-VEG)', 'veg', false),
('Chicken Hot & Sour Soup', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SOUP (VEG / NON-VEG)', 'non-veg', false),
('Chicken Soup', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SOUP (VEG / NON-VEG)', 'non-veg', false),

-- PAAV BHAJI / PAKODA
('Paav Bhaji Special', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PAAV BHAJI / PAKODA', 'veg', false),
('Extra Paav', 15.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PAAV BHAJI / PAKODA', 'veg', false),
('Paneer Pakoda (6 pcs)', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PAAV BHAJI / PAKODA', 'veg', false),
('Chicken Pakoda (5 pcs)', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PAAV BHAJI / PAKODA', 'non-veg', false),

-- OIL FRY
('Finger Chips', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'OIL FRY', 'veg', false),
('Chicken Lollipop', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'OIL FRY', 'non-veg', false),

-- SANDWICH
('Veg Sandwich', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'veg', false),
('Cheese Sandwich', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'veg', false),
('Paneer Sandwich', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'veg', false),
('Paneer Cheese Sandwich', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'veg', false),
('Egg Sandwich', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'non-veg', false),
('Chicken Sandwich', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'non-veg', false),
('Cheese Egg Sandwich', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'non-veg', false),
('Chicken Egg Sandwich', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'non-veg', false),
('Cheese Chicken Sandwich', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'non-veg', false),
('Cheese Chicken Egg Sandwich', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'non-veg', false),
('Mayonnaise Sandwich', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH', 'veg', false),

-- SANDWICH (CORN)
('Corn Sandwich', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH (CORN)', 'veg', false),
('Cheese Corn Sandwich', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH (CORN)', 'veg', false),
('Paneer Corn Sandwich', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH (CORN)', 'veg', false),
('Paneer Corn Cheese Sandwich', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH (CORN)', 'veg', false),
('Corn Mayo Sandwich', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH (CORN)', 'veg', false),
('Cheese Mayo Sandwich', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SANDWICH (CORN)', 'veg', false),

-- BURGER
('Veg Burger', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'veg', false),
('Cheese Burger', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'veg', false),
('Paneer Burger', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'veg', false),
('Paneer Cheese Burger', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'veg', false),
('Egg Burger', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'non-veg', false),
('Chicken Burger', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'non-veg', false),
('Cheese Egg Burger', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'non-veg', false),
('Chicken Egg Burger', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'non-veg', false),
('Cheese Chicken Burger', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'non-veg', false),
('Cheese Chicken Egg Burger', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BURGER', 'non-veg', false),

-- BREAD
('Veg Bread Bhujia', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'veg', false),
('Paneer Bread Bhujia', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'veg', false),
('Egg Bread Bhujia', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'non-veg', false),
('Cheese Bread Bhujia', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'veg', false),
('Chicken Egg Bread Bhujia', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'non-veg', false),
('Bread Butter', 20.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'veg', false),
('Bread Omelet', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'non-veg', false),
('Cheese Bread Omelet', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BREAD', 'non-veg', false),

-- NON_VEG_STARTERS
('Chicken Tikka', 120.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'NON_VEG_STARTERS', 'non-veg', false),
('Tandoori Chicken', 390.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'NON_VEG_STARTERS', 'non-veg', false),
('Tengri Chicken', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'NON_VEG_STARTERS', 'non-veg', false),
('Rashmi Kabab', 130.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'NON_VEG_STARTERS', 'non-veg', false),

-- MAGGI (Updated +10)
('Plain Maggi', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Butter Maggi', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Cheese Maggi', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Onion Maggi', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Veg Maggi', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Masala Maggi', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Egg Maggi', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),
('Chicken Maggi', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),
('Veg Bhatu Maggi', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'veg', false),
('Egg Bhatu Maggi', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),
('Chicken Bhatu Maggi', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),
('Veg Egg Maggi', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),
('Egg Masala Maggi', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),
('Chicken Masala Maggi', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MAGGI', 'non-veg', false),

-- FRIED_MAGGI (Updated +10)
('Veg Fried Maggi', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'veg', false),
('Egg Fried Maggi', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'non-veg', false),
('Cheese Fried Maggi', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'veg', false),
('Masala Fried Maggi', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'veg', false),
('Schezwan Fried Maggi', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'veg', false),
('Chicken Fried Maggi', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'non-veg', false),
('Chicken Schezwan Fried Maggi', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'non-veg', false),
('Vatsal Maggi', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'FRIED_MAGGI', 'veg', false),

-- TOAST
('Salt Branch Toast', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TOAST', 'veg', false),
('Sweet French Toast', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TOAST', 'veg', false),
('Cheese French Toast', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TOAST', 'veg', false),

-- VEG
('Paneer Tikka', 120.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG', 'veg', false),

-- VEG NON VEG RICE (Updated +10)
('Veg Fried Rice', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG NON VEG RICE', 'veg', false),
('Egg Fried Rice', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG NON VEG RICE', 'non-veg', false),
('Chicken Fried Rice', 86.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG NON VEG RICE', 'non-veg', false),
('Mix Fried Rice', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG NON VEG RICE', 'non-veg', false),
('Paneer Fried Rice', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG NON VEG RICE', 'veg', false),

-- SEZWAN RICE (Updated +10)
('Veg Sezwan Rice', 75.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SEZWAN RICE', 'veg', false),
('Paneer Sezwan Rice', 90.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SEZWAN RICE', 'veg', false),
('Egg Sezwan Rice', 75.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SEZWAN RICE', 'non-veg', false),
('Chicken Sezwan Rice', 90.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SEZWAN RICE', 'non-veg', false),
('Mix Sezwan Rice', 105.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'SEZWAN RICE', 'non-veg', false),

-- MASALA RICE (Updated +10)
('Veg Masala Rice', 75.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MASALA RICE', 'veg', false),
('Paneer Masala Rice', 85.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MASALA RICE', 'veg', false),
('Egg Masala Rice', 85.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MASALA RICE', 'non-veg', false),
('Chicken Masala Rice', 95.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MASALA RICE', 'non-veg', false),
('Mix Masala Rice', 105.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MASALA RICE', 'non-veg', false),

-- BASMATI RICE (Updated +10)
('Plain Rice', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),
('Jeera Rice', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),
('Lemon Rice', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),
('Tomato Rice', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),
('Curd Rice', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),
('Capsicum Rice', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),
('Tomato Capsicum Rice', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BASMATI RICE', 'veg', false),

-- DAHI CURD
('Plain Dahi', 26.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'DAHI CURD', 'veg', false),
('Masala Dahi', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'DAHI CURD', 'veg', false),

-- EGG
('Boiled Egg', 20.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Boiled Chaat', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Double Omelet', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Cheese Omelet', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Double Egg Bhujia', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Double Poach Double Fry', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Double Poach', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),
('Masala Boiled Egg', 20.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG', 'non-veg', false),

-- VEG_MAIN_COURSE (Updated +10)
('Mix Veg', 90.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Chilly Chana', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Chana Masala', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Green Peas Masala', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Dal Makhani', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Tadka Dal', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Dal Fry', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Dal Butter Fry', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Tomato Fry', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Dum', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Jeera', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Matar', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Methi', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Sezwan Masala', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Do Pyaza', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Capsicum', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Gobi', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Gobi Masala', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Chilly Gobi', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Gobi Manchurian', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Alu Palak', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Veg Manchurian', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Corn Masala', 85.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),
('Corn Palak', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'VEG_MAIN_COURSE', 'veg', false),

-- BHINDI (Updated +10)
('Bhindi Fry', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BHINDI', 'veg', false),
('Bhindi Masala', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BHINDI', 'veg', false),
('Alu Bhindi', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'BHINDI', 'veg', false),

-- PANEER_MAIN_COURSE (Updated +10)
('Paneer Butter Masala', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Do Pyaza', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Bharta', 115.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Kadai Paneer', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Matar Paneer', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Palak Paneer', 80.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Manchurian', 85.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Chilly Paneer', 75.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Schezwan Paneer', 90.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Tikka Masala', 150.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Corn Masala', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Punjabi', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Garlic Paneer', 85.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Paneer Kolhapuri', 110.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Malai Paneer', 110.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),
('Shahi Paneer', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PANEER_MAIN_COURSE', 'veg', false),

-- CHICKEN_MAIN_COURSE (Updated +10)
('Chicken Kosha', 110.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Kadai Chicken', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Curry', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Cubry', 110.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Bharta', 160.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Do Pyaza', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Butter Masala', 105.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Manchurian', 120.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chilly Chicken', 120.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Garlic Chicken', 120.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Lemon Chicken', 120.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Schezwan Chicken', 125.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Tikka Masala', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Tengri Masala', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Reshmi Chicken Masala', 160.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Malai Chicken ', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Kolhapuri', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Punjabi', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),
('Chicken Hyderabad', 140.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'CHICKEN_MAIN_COURSE', 'non-veg', false),

-- EGG_MAIN_COURSE (Updated +10)
('Egg Bhujia Curry', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),
('Egg Malai Masala', 100.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),
('Egg Curry', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),
('Egg Chilly', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),
('Egg Tadka Dal', 60.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),
('Egg Do Pyaza', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),
('Egg Kolhapuri', 90.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'EGG_MAIN_COURSE', 'non-veg', false),

-- ROTI PARATHA
('Plain Roti', 6.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Butter Roti', 8.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Plain Paratha', 10.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Alu Paratha', 20.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Onion Paratha', 20.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Alu Onion Paratha', 25.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Alu Cheese Paratha', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Paneer Paratha', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Paneer Cheese Paratha', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'veg', false),
('Egg Paratha', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'non-veg', false),
('Egg Cheese Paratha', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'non-veg', false),
('Chicken Paratha', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'non-veg', false),
('Chicken Cheese Paratha', 55.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'ROTI PARATHA', 'non-veg', false),


-- TANDOORI NAAN
('Plain Naan', 25.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TANDOORI NAAN', 'veg', false),
('Butter Naan', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TANDOORI NAAN', 'veg', false),
('Garlic Naan', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TANDOORI NAAN', 'veg', false),
('Garlic CheeseNaan', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TANDOORI NAAN', 'veg', false),
('Chilly Naan', 40.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TANDOORI NAAN', 'veg', false),
('Chilly Cheese Naan', 65.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'TANDOORI NAAN', 'veg', false),

-- PARATHA
('Paneer Kulcha', 70.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PARATHA', 'veg', false),
('Paneer Cheese Kulcha', 85.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PARATHA', 'veg', false),
('Masala Kulcha', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PARATHA', 'veg', false),
('Sattu Paratha', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'PARATHA', 'veg', false),


-- MILK
('Tea', 10.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK', 'veg', false),
('Plain Milk', 20.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK', 'veg', false),
('Haldi Milk', 22.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK', 'veg', false),
('Hot Bournvita', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK', 'veg', false),
('Hot Horlicks', 30.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK', 'veg', false),

-- MILK SHAKES
('Double Oreo', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK SHAKES', 'veg', false),
('Chocolate Shake (Hot/Cold)', 50.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK SHAKES', 'veg', false),
('Rose Shake', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK SHAKES', 'veg', false),
('Cold Bournvita', 35.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK SHAKES', 'veg', false),
('Lassi', 45.0, '9191d852-91df-4723-a438-e8ebf31cc626', true, 'MILK SHAKES', 'veg', false)

ON CONFLICT (name, canteen_id) 
DO UPDATE SET 
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    item_type = EXCLUDED.item_type,
    is_available = EXCLUDED.is_available,
    is_recommended = EXCLUDED.is_recommended;
