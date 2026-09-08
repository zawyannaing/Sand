import { InventoryItem, StockLog, MaterialType, CustomerOrderRequest } from '../types';
import { INITIAL_INVENTORY, INITIAL_STOCK_LOGS, INITIAL_CUSTOMER_ORDERS } from '../data/mockData';

const INVENTORY_STORAGE_KEY = 'sand_logistics_inventory_v1';
const STOCK_LOGS_STORAGE_KEY = 'sand_logistics_stock_logs_v1';
const CUSTOMER_ORDERS_KEY = 'sand_logistics_customer_orders_v1';

/**
 * Load inventory from localStorage or default
 */
export function getStoredInventory(): InventoryItem[] {
  try {
    const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge missing default categories/items if needed while preserving user's modifications
        const existingIds = new Set(parsed.map((p: any) => p.id));
        const merged = [...parsed];
        for (const defItem of INITIAL_INVENTORY) {
          if (!existingIds.has(defItem.id)) {
            merged.push(defItem);
          }
        }
        return merged.map(item => ({
          ...item,
          category: item.category || (item.materialType === 'soil' ? 'earthwork' : 'aggregates'),
          unit: item.unit || 'ကျင်း',
        }));
      }
    }
  } catch (err) {
    console.error('Error loading inventory:', err);
  }
  return INITIAL_INVENTORY;
}

/**
 * Save inventory
 */
export function saveStoredInventory(items: InventoryItem[]) {
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('inventory_updated'));
}

/**
 * Create a new custom store product
 */
export function createInventoryProduct(product: Omit<InventoryItem, 'id' | 'lastRestocked'> & { id?: string }): InventoryItem {
  const items = getStoredInventory();
  const newId = product.id || `inv-${Date.now()}`;
  const newItem: InventoryItem = {
    ...product,
    id: newId,
    lastRestocked: new Date().toISOString(),
  };
  const updated = [...items, newItem];
  saveStoredInventory(updated);

  if (Number(newItem.currentStock) > 0) {
    const log: StockLog = {
      id: `log-${Date.now()}`,
      inventoryItemId: newItem.id,
      materialType: newItem.materialType,
      type: 'in',
      quantity: Number(newItem.currentStock),
      unitPrice: newItem.purchaseCostPerUnit,
      totalCost: Number(newItem.currentStock) * (newItem.purchaseCostPerUnit || 0),
      supplierName: 'စတိုစတင်ဖွင့်လှစ်သည့် ကနဦးလက်ကျန် (Initial Stock)',
      notes: `ကုန်ပစ္စည်းအသစ် ဖန်တီး၍ စတိုလက်ကျန်ထည့်သွင်းခြင်း (${newItem.burmeseName})`,
      date: new Date().toISOString(),
      performedBy: 'Admin',
    };
    saveStoredStockLogs([log, ...getStoredStockLogs()]);
  }

  return newItem;
}

/**
 * Update an existing store product
 */
export function updateInventoryProduct(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
  const items = getStoredInventory();
  const index = items.findIndex(i => i.id === id);
  if (index === -1) return null;
  const updatedItem: InventoryItem = {
    ...items[index],
    ...updates,
  };
  items[index] = updatedItem;
  saveStoredInventory(items);
  return updatedItem;
}

/**
 * Delete a store product from inventory
 */
export function deleteInventoryProduct(id: string): boolean {
  const items = getStoredInventory();
  const filtered = items.filter(i => i.id !== id);
  if (filtered.length === items.length) return false;
  saveStoredInventory(filtered);
  return true;
}

/**
 * Load stock movement logs
 */
export function getStoredStockLogs(): StockLog[] {
  try {
    const saved = localStorage.getItem(STOCK_LOGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading stock logs:', err);
  }
  return INITIAL_STOCK_LOGS;
}

/**
 * Save stock movement logs
 */
export function saveStoredStockLogs(logs: StockLog[]) {
  localStorage.setItem(STOCK_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

/**
 * Load customer order requests
 */
export function getStoredCustomerOrders(): CustomerOrderRequest[] {
  try {
    const saved = localStorage.getItem(CUSTOMER_ORDERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error loading customer orders:', err);
  }
  return INITIAL_CUSTOMER_ORDERS;
}

/**
 * Save customer order requests
 */
export function saveStoredCustomerOrders(orders: CustomerOrderRequest[]) {
  localStorage.setItem(CUSTOMER_ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event('customer_orders_updated'));
}

/**
 * Add Stock Intake (Stock In)
 */
export function addStockIntake(params: {
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  supplierName: string;
  notes?: string;
  performedBy: string;
}): { success: boolean; updatedItem?: InventoryItem; log?: StockLog; error?: string } {
  const items = getStoredInventory();
  const itemIndex = items.findIndex(i => i.id === params.inventoryItemId);

  if (itemIndex === -1) {
    return { success: false, error: 'ကုန်ပစ္စည်း ရှာမတွေ့ပါ' };
  }

  const current = items[itemIndex];
  const newQty = Number(current.currentStock) + Number(params.quantity);

  const updatedItem: InventoryItem = {
    ...current,
    currentStock: newQty,
    purchaseCostPerUnit: params.unitPrice || current.purchaseCostPerUnit,
    lastRestocked: new Date().toISOString(),
  };

  items[itemIndex] = updatedItem;
  saveStoredInventory(items);

  const log: StockLog = {
    id: `log-${Date.now()}`,
    inventoryItemId: current.id,
    materialType: current.materialType,
    type: 'in',
    quantity: Number(params.quantity),
    unitPrice: params.unitPrice,
    totalCost: Number(params.quantity) * (params.unitPrice || 0),
    supplierName: params.supplierName,
    notes: params.notes,
    date: new Date().toISOString(),
    performedBy: params.performedBy || 'Admin',
  };

  const logs = [log, ...getStoredStockLogs()];
  saveStoredStockLogs(logs);

  return { success: true, updatedItem, log };
}

/**
 * Deduct stock when a trip is dispatched
 */
export function deductStockForTrip(params: {
  materialType: MaterialType;
  quantity: number;
  tripId: string;
  destination: string;
  performedBy: string;
}): { success: boolean; deducted: number; remainingStock: number; isLowStock: boolean } {
  const items = getStoredInventory();
  const itemIndex = items.findIndex(
    i => i.materialType === params.materialType || i.id === params.materialType || i.name.toLowerCase() === String(params.materialType).toLowerCase()
  );

  if (itemIndex === -1) {
    return { success: false, deducted: 0, remainingStock: 0, isLowStock: false };
  }

  const current = items[itemIndex];
  const remaining = Math.max(0, Number(current.currentStock) - Number(params.quantity));

  items[itemIndex] = {
    ...current,
    currentStock: remaining,
  };
  saveStoredInventory(items);

  const log: StockLog = {
    id: `log-${Date.now()}`,
    inventoryItemId: current.id,
    materialType: current.materialType,
    type: 'out',
    quantity: Number(params.quantity),
    referenceTripId: params.tripId,
    notes: `${params.destination} သို့ ပို့ဆောင်ရန် စတိုမှ ထုတ်ယူခြင်း`,
    date: new Date().toISOString(),
    performedBy: params.performedBy,
  };

  const logs = [log, ...getStoredStockLogs()];
  saveStoredStockLogs(logs);

  const isLowStock = remaining <= current.minimumThreshold;

  return {
    success: true,
    deducted: Number(params.quantity),
    remainingStock: remaining,
    isLowStock,
  };
}

/**
 * Refund / replenish stock if trip is cancelled or deleted
 */
export function refundStockForTrip(materialType: MaterialType, quantity: number, notes?: string) {
  const items = getStoredInventory();
  const itemIndex = items.findIndex(
    i => i.materialType === materialType || i.id === materialType || i.name.toLowerCase() === String(materialType).toLowerCase()
  );

  if (itemIndex >= 0) {
    const current = items[itemIndex];
    items[itemIndex] = {
      ...current,
      currentStock: Number(current.currentStock) + Number(quantity),
    };
    saveStoredInventory(items);

    const log: StockLog = {
      id: `log-${Date.now()}`,
      inventoryItemId: current.id,
      materialType: current.materialType,
      type: 'adjust',
      quantity: Number(quantity),
      notes: notes || 'ခရီးစဉ်ပယ်ဖျက်သဖြင့် စတိုသို့ ကုန်လက်ကျန် ပြန်လည်ဖြည့်သွင်းခြင်း',
      date: new Date().toISOString(),
      performedBy: 'System Refund',
    };
    saveStoredStockLogs([log, ...getStoredStockLogs()]);
  }
}

/**
 * Manual Stock Count Adjustment (Physical inventory audit)
 */
export function adjustStockLevel(params: {
  inventoryItemId: string;
  newStockCount: number;
  reason: string;
  performedBy: string;
}) {
  const items = getStoredInventory();
  const itemIndex = items.findIndex(i => i.id === params.inventoryItemId);

  if (itemIndex >= 0) {
    const current = items[itemIndex];
    const diff = Number(params.newStockCount) - Number(current.currentStock);

    items[itemIndex] = {
      ...current,
      currentStock: Number(params.newStockCount),
    };
    saveStoredInventory(items);

    const log: StockLog = {
      id: `log-${Date.now()}`,
      inventoryItemId: current.id,
      materialType: current.materialType,
      type: 'adjust',
      quantity: Math.abs(diff),
      notes: `စတိုစစ်ဆေးမှု: ${diff >= 0 ? '+' : ''}${diff} ကျင်း ပြင်ဆင်ချက် (${params.reason})`,
      date: new Date().toISOString(),
      performedBy: params.performedBy,
    };
    saveStoredStockLogs([log, ...getStoredStockLogs()]);
  }
}

/**
 * Create a new customer order request from the customer portal
 */
export function createCustomerOrder(order: Omit<CustomerOrderRequest, 'id' | 'status' | 'createdAt'>): CustomerOrderRequest {
  const newOrder: CustomerOrderRequest = {
    ...order,
    id: `ord-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const current = getStoredCustomerOrders();
  const updated = [newOrder, ...current];
  saveStoredCustomerOrders(updated);
  return newOrder;
}

/**
 * Update status of customer order (e.g. dispatched or completed)
 */
export function updateCustomerOrderStatus(orderId: string, status: CustomerOrderRequest['status']) {
  const orders = getStoredCustomerOrders();
  const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
  saveStoredCustomerOrders(updated);
}
