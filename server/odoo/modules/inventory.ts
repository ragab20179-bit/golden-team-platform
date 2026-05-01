/**
 * server/odoo/modules/inventory.ts
 *
 * Inventory domain — products, stock pickings, warehouses, product search.
 */

import { odooSearchRead } from "../helpers";
import type { Product, StockPicking, Warehouse } from "../types";

const PRODUCT_FIELDS = [
  "name", "default_code", "barcode", "qty_available",
  "virtual_available", "incoming_qty", "outgoing_qty",
  "list_price", "standard_price", "categ_id", "uom_id",
  "type", "active",
];

const STOCK_PICKING_FIELDS = [
  "name", "partner_id", "scheduled_date", "date_done",
  "state", "picking_type_id", "origin", "location_id",
  "location_dest_id", "move_type",
];

const WAREHOUSE_FIELDS = [
  "name", "code", "lot_stock_id", "company_id",
];

export async function getProducts(limit = 100): Promise<Product[]> {
  return odooSearchRead<Product>("product.product", [], PRODUCT_FIELDS, {
    limit,
    order: "name asc",
  });
}

export async function getStockPickings(limit = 50): Promise<StockPicking[]> {
  return odooSearchRead<StockPicking>("stock.picking", [], STOCK_PICKING_FIELDS, {
    limit,
    order: "scheduled_date desc",
  });
}

export async function getWarehouses(): Promise<Warehouse[]> {
  return odooSearchRead<Warehouse>("stock.warehouse", [], WAREHOUSE_FIELDS, { limit: 20 });
}

/**
 * Search products by name or default_code (SKU). Used by the bid-evaluation
 * router and the procurement NEO module to look up products before creating
 * a PO line.
 */
export async function searchProducts(query: string, limit = 20): Promise<Product[]> {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim();
  return odooSearchRead<Product>(
    "product.product",
    [["|"], ["name", "ilike", q], ["default_code", "ilike", q]] as unknown[][],
    PRODUCT_FIELDS,
    { limit, order: "name asc" },
  );
}
