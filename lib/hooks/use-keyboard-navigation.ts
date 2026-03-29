'use client';

import { useCallback, useEffect, useState } from 'react';

interface KeyboardNavigationOptions {
  menuItemsCount: number;
  cartItemsCount: number;
  ordersCount: number;
  onAddItem: (index: number) => void;
  onSubtractItem?: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onSetQuantity: (index: number, quantity: number) => void;
  onSubmitOrder: () => void;
  onResetOrder: () => void;
  onSetOrderType: (type: 'dine-in' | 'takeaway' | 'delivery') => void;
  onTogglePayment: () => void;
  onFocusSearch: () => void;
  onFocusNote: () => void;
  // Order management
  onUpdateOrderStatus: (index: number) => void;
  onPrintBill: (index: number) => void;
  onPrintKOT: (index: number) => void;
  onToggleOrderPayment: (index: number) => void;
  enabled?: boolean;
}

type FocusSection = 'menu' | 'cart' | 'orderType' | 'payment' | 'note' | 'orders';

export function useKeyboardNavigation({
  menuItemsCount,
  cartItemsCount,
  ordersCount,
  onAddItem,
  onSubtractItem,
  onUpdateQuantity,

  onRemoveItem,
  onSetQuantity,
  onSubmitOrder,
  onResetOrder,
  onSetOrderType,
  onTogglePayment,
  onFocusSearch,
  onFocusNote,
  onUpdateOrderStatus,
  onPrintBill,
  onPrintKOT,
  onToggleOrderPayment,
  enabled = true,
}: KeyboardNavigationOptions) {
  const [focusSection, setFocusSection] = useState<FocusSection>('menu');
  const [menuIndex, setMenuIndex] = useState(0);
  const [cartIndex, setCartIndex] = useState(0);
  const [orderIndex, setOrderIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Track if we're in an input field
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      setIsInputFocused(isInput);
    };

    const handleBlur = () => {
      setIsInputFocused(false);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;

    // Always allow these shortcuts even in input fields
    if (e.key === 'Escape') {
      e.preventDefault();
      (document.activeElement as HTMLElement)?.blur();
      setIsInputFocused(false);
      setFocusSection('menu');
      return;
    }

    // Global shortcuts with Cmd/Ctrl
    if (cmdKey && e.key === 'Enter') {
      e.preventDefault();
      onSubmitOrder();
      return;
    }

    if (cmdKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      onResetOrder();
      return;
    }

    // Skip other shortcuts when in input field
    if (isInputFocused) return;

    // Focus search
    if (e.key === '/') {
      e.preventDefault();
      onFocusSearch();
      return;
    }

    // Focus note
    if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      onFocusNote();
      return;
    }

    // Toggle payment globally
    if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (focusSection === 'orders' && ordersCount > 0) {
        onToggleOrderPayment(orderIndex);
      } else {
        onTogglePayment();
      }
      return;
    }

    // Order type shortcuts (global when not focused on orders)
    if (e.key.toLowerCase() === 'd' && focusSection !== 'orders') {
      e.preventDefault();
      onSetOrderType('dine-in');
      return;
    }
    if (e.key.toLowerCase() === 't' && focusSection !== 'orders') {
      e.preventDefault();
      onSetOrderType('takeaway');
      return;
    }
    if (e.key.toLowerCase() === 'y' && focusSection !== 'orders') {
      e.preventDefault();
      onSetOrderType('delivery');
      return;
    }

    // Switch to orders panel
    if (e.key.toLowerCase() === 'o') {
      e.preventDefault();
      setFocusSection('orders');
      setOrderIndex(0);
      return;
    }

    // Switch to menu panel
    if (e.key.toLowerCase() === 'm') {
      e.preventDefault();
      setFocusSection('menu');
      setMenuIndex(0);
      return;
    }

    // Switch to cart
    if (e.key.toLowerCase() === 'c' && cartItemsCount > 0) {
      e.preventDefault();
      setFocusSection('cart');
      setCartIndex(0);
      return;
    }

    // Tab navigation between sections
    if (e.key === 'Tab') {
      e.preventDefault();
      const sections: FocusSection[] = ['menu', 'cart', 'orderType', 'payment', 'orders'];
      const currentIndex = sections.indexOf(focusSection);
      if (e.shiftKey) {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
        setFocusSection(sections[newIndex]);
      } else {
        const newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
        setFocusSection(sections[newIndex]);
      }
      return;
    }

    // Section-specific navigation
    if (focusSection === 'menu') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenuIndex(prev => Math.min(prev + 1, menuItemsCount - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenuIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onAddItem(menuIndex);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onAddItem(menuIndex);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (onSubtractItem) onSubtractItem(menuIndex);
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        onAddItem(menuIndex);
        // Set quantity after adding
        setTimeout(() => onSetQuantity(cartItemsCount, parseInt(e.key)), 50);
      }
    }

    if (focusSection === 'cart' && cartItemsCount > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCartIndex(prev => Math.min(prev + 1, cartItemsCount - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCartIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onUpdateQuantity(cartIndex, 1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onUpdateQuantity(cartIndex, -1);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onRemoveItem(cartIndex);
        if (cartIndex >= cartItemsCount - 1) {
          setCartIndex(Math.max(0, cartItemsCount - 2));
        }
      } else if (e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        onSetQuantity(cartIndex, parseInt(e.key));
      }
    }

    if (focusSection === 'orders' && ordersCount > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOrderIndex(prev => Math.min(prev + 1, ordersCount - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setOrderIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onUpdateOrderStatus(orderIndex);
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        onPrintBill(orderIndex);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        onPrintKOT(orderIndex);
      }
    }
  }, [
    enabled,
    isInputFocused,
    focusSection,
    menuIndex,
    cartIndex,
    orderIndex,
    menuItemsCount,
    cartItemsCount,
    ordersCount,
    onAddItem,
    onSubtractItem,
    onUpdateQuantity,
    onRemoveItem,
    onSetQuantity,
    onSubmitOrder,
    onResetOrder,
    onSetOrderType,
    onTogglePayment,
    onFocusSearch,
    onFocusNote,
    onUpdateOrderStatus,
    onPrintBill,
    onPrintKOT,
    onToggleOrderPayment,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset indices when counts change
  useEffect(() => {
    if (menuIndex >= menuItemsCount) setMenuIndex(Math.max(0, menuItemsCount - 1));
  }, [menuItemsCount, menuIndex]);

  useEffect(() => {
    if (cartIndex >= cartItemsCount) setCartIndex(Math.max(0, cartItemsCount - 1));
  }, [cartItemsCount, cartIndex]);

  useEffect(() => {
    if (orderIndex >= ordersCount) setOrderIndex(Math.max(0, ordersCount - 1));
  }, [ordersCount, orderIndex]);

  return {
    focusSection,
    menuIndex,
    cartIndex,
    orderIndex,
    setFocusSection,
    setMenuIndex,
    setCartIndex,
    setOrderIndex,
  };
}
