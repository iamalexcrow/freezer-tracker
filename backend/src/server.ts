import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to get today's date in local timezone (YYYY-MM-DD format)
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Database setup
const dbPath = process.env.DB_PATH || path.join(__dirname, "../data/freezer.db");
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  -- Raw Food items
  CREATE TABLE IF NOT EXISTS raw_food (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sub_category TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    measuring_unit TEXT NOT NULL CHECK (measuring_unit IN ('kg', 'pieces')),
    date_added TEXT NOT NULL,
    comment TEXT,
    date_removed TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Prepared Meals
  CREATE TABLE IF NOT EXISTS prepared_meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    portions INTEGER NOT NULL,
    date_added TEXT NOT NULL,
    comment TEXT,
    date_removed TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Breast Milk
  CREATE TABLE IF NOT EXISTS breast_milk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_expressed TEXT NOT NULL,
    date_added TEXT NOT NULL,
    volume_ml INTEGER NOT NULL,
    comment TEXT,
    date_removed TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Freshness Settings
  CREATE TABLE IF NOT EXISTS freshness_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    sub_category TEXT,
    fresh_days INTEGER NOT NULL,
    good_days INTEGER NOT NULL,
    use_soon_days INTEGER NOT NULL,
    UNIQUE(category, sub_category)
  );

  -- Red Zone Dismissals (tracks daily dismissals)
  CREATE TABLE IF NOT EXISTS red_zone_dismissals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dismissed_date TEXT NOT NULL UNIQUE
  );
`);

// Insert default freshness settings if not exist
const defaultFreshness = [
  // Raw food sub-categories
  { category: 'raw_food', sub_category: 'Poultry', fresh_days: 90, good_days: 180, use_soon_days: 270 },
  { category: 'raw_food', sub_category: 'Red Meat', fresh_days: 120, good_days: 240, use_soon_days: 365 },
  { category: 'raw_food', sub_category: 'Fish/Seafood', fresh_days: 90, good_days: 180, use_soon_days: 270 },
  { category: 'raw_food', sub_category: 'Ground Meat', fresh_days: 60, good_days: 120, use_soon_days: 180 },
  { category: 'raw_food', sub_category: 'Vegetables', fresh_days: 180, good_days: 300, use_soon_days: 365 },
  { category: 'raw_food', sub_category: 'Fruits', fresh_days: 180, good_days: 300, use_soon_days: 365 },
  { category: 'raw_food', sub_category: 'Other', fresh_days: 90, good_days: 180, use_soon_days: 270 },
  // Prepared meals
  { category: 'prepared_meals', sub_category: null, fresh_days: 30, good_days: 60, use_soon_days: 90 },
  // Breast milk
  { category: 'breast_milk', sub_category: null, fresh_days: 90, good_days: 180, use_soon_days: 270 },
];

const insertFreshness = db.prepare(`
  INSERT OR IGNORE INTO freshness_settings (category, sub_category, fresh_days, good_days, use_soon_days)
  VALUES (?, ?, ?, ?, ?)
`);

for (const f of defaultFreshness) {
  insertFreshness.run(f.category, f.sub_category, f.fresh_days, f.good_days, f.use_soon_days);
}

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend in production
const staticPath = path.join(__dirname, "../public");
app.use(express.static(staticPath));

// ============ RAW FOOD ROUTES ============

// Get all active raw food items
app.get("/api/raw-food", (_req, res) => {
  const items = db.prepare(`
    SELECT * FROM raw_food 
    WHERE date_removed IS NULL 
    ORDER BY date_added DESC
  `).all();
  res.json(items);
});

// Get consumed raw food items
app.get("/api/raw-food/consumed", (_req, res) => {
  const items = db.prepare(`
    SELECT * FROM raw_food 
    WHERE date_removed IS NOT NULL 
    ORDER BY date_removed DESC
  `).all();
  res.json(items);
});

// Get unique names for dropdown (filtered by sub_category)
app.get("/api/raw-food/names/:subCategory", (req, res) => {
  const names = db.prepare(`
    SELECT DISTINCT name FROM raw_food 
    WHERE sub_category = ? 
    ORDER BY name
  `).all(req.params.subCategory);
  res.json(names.map((n: any) => n.name));
});

// Create raw food item
app.post("/api/raw-food", (req, res) => {
  const { sub_category, name, amount, measuring_unit, date_added, comment } = req.body;
  
  if (!sub_category || !name?.trim() || !amount || !measuring_unit || !date_added) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const result = db.prepare(`
    INSERT INTO raw_food (sub_category, name, amount, measuring_unit, date_added, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(sub_category, name.trim(), amount, measuring_unit, date_added, comment?.trim() || null);

  const item = db.prepare("SELECT * FROM raw_food WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Take out raw food (with split support)
app.post("/api/raw-food/:id/take-out", (req, res) => {
  const { id } = req.params;
  const { amount_taken } = req.body;

  const existing = db.prepare("SELECT * FROM raw_food WHERE id = ?").get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: "Item not found" });
  }

  const today = getLocalDateString();

  if (amount_taken >= existing.amount) {
    // Take entire item
    db.prepare(`
      UPDATE raw_food SET date_removed = ? WHERE id = ?
    `).run(today, id);
  } else {
    // Split: reduce original, create consumed portion
    db.prepare(`
      UPDATE raw_food SET amount = amount - ? WHERE id = ?
    `).run(amount_taken, id);

    db.prepare(`
      INSERT INTO raw_food (sub_category, name, amount, measuring_unit, date_added, comment, date_removed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      existing.sub_category,
      existing.name,
      amount_taken,
      existing.measuring_unit,
      existing.date_added,
      existing.comment,
      today
    );
  }

  res.json({ success: true });
});

// Update raw food item
app.patch("/api/raw-food/:id", (req, res) => {
  const { id } = req.params;
  const { sub_category, name, amount, measuring_unit, date_added, comment } = req.body;

  const existing = db.prepare("SELECT * FROM raw_food WHERE id = ?").get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: "Item not found" });
  }

  db.prepare(`
    UPDATE raw_food 
    SET sub_category = ?, name = ?, amount = ?, measuring_unit = ?, date_added = ?, comment = ?
    WHERE id = ?
  `).run(
    sub_category ?? existing.sub_category,
    name?.trim() ?? existing.name,
    amount ?? existing.amount,
    measuring_unit ?? existing.measuring_unit,
    date_added ?? existing.date_added,
    comment?.trim() ?? existing.comment,
    id
  );

  const item = db.prepare("SELECT * FROM raw_food WHERE id = ?").get(id);
  res.json(item);
});

// Delete raw food item
app.delete("/api/raw-food/:id", (req, res) => {
  const result = db.prepare("DELETE FROM raw_food WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json({ success: true });
});

// Put back raw food (undo take out)
app.post("/api/raw-food/:id/put-back", (req, res) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM raw_food WHERE id = ? AND date_removed IS NOT NULL").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Item not found or not removed" });
  }

  db.prepare("UPDATE raw_food SET date_removed = NULL WHERE id = ?").run(id);
  res.json({ success: true });
});

// ============ PREPARED MEALS ROUTES ============

// Get all active prepared meals
app.get("/api/prepared-meals", (_req, res) => {
  const items = db.prepare(`
    SELECT * FROM prepared_meals 
    WHERE date_removed IS NULL 
    ORDER BY date_added DESC
  `).all();
  res.json(items);
});

// Get consumed prepared meals
app.get("/api/prepared-meals/consumed", (_req, res) => {
  const items = db.prepare(`
    SELECT * FROM prepared_meals 
    WHERE date_removed IS NOT NULL 
    ORDER BY date_removed DESC
  `).all();
  res.json(items);
});

// Get unique names for dropdown
app.get("/api/prepared-meals/names", (_req, res) => {
  const names = db.prepare(`
    SELECT DISTINCT name FROM prepared_meals ORDER BY name
  `).all();
  res.json(names.map((n: any) => n.name));
});

// Create prepared meal(s) - creates multiple rows if quantity > 1
app.post("/api/prepared-meals", (req, res) => {
  const { name, portions, date_added, comment, quantity = 1 } = req.body;
  
  if (!name?.trim() || !portions || !date_added) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const insert = db.prepare(`
    INSERT INTO prepared_meals (name, portions, date_added, comment)
    VALUES (?, ?, ?, ?)
  `);

  const items: any[] = [];
  for (let i = 0; i < quantity; i++) {
    const result = insert.run(name.trim(), portions, date_added, comment?.trim() || null);
    const item = db.prepare("SELECT * FROM prepared_meals WHERE id = ?").get(result.lastInsertRowid);
    items.push(item);
  }

  res.status(201).json(items);
});

// Take out prepared meal (whole bag)
app.post("/api/prepared-meals/:id/take-out", (req, res) => {
  const { id } = req.params;
  const today = getLocalDateString();

  const result = db.prepare(`
    UPDATE prepared_meals SET date_removed = ? WHERE id = ? AND date_removed IS NULL
  `).run(today, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Item not found or already removed" });
  }

  res.json({ success: true });
});

// Update prepared meal
app.patch("/api/prepared-meals/:id", (req, res) => {
  const { id } = req.params;
  const { name, portions, date_added, comment } = req.body;

  const existing = db.prepare("SELECT * FROM prepared_meals WHERE id = ?").get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: "Item not found" });
  }

  db.prepare(`
    UPDATE prepared_meals 
    SET name = ?, portions = ?, date_added = ?, comment = ?
    WHERE id = ?
  `).run(
    name?.trim() ?? existing.name,
    portions ?? existing.portions,
    date_added ?? existing.date_added,
    comment?.trim() ?? existing.comment,
    id
  );

  const item = db.prepare("SELECT * FROM prepared_meals WHERE id = ?").get(id);
  res.json(item);
});

// Delete prepared meal
app.delete("/api/prepared-meals/:id", (req, res) => {
  const result = db.prepare("DELETE FROM prepared_meals WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json({ success: true });
});

// Put back prepared meal (undo take out)
app.post("/api/prepared-meals/:id/put-back", (req, res) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM prepared_meals WHERE id = ? AND date_removed IS NOT NULL").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Item not found or not removed" });
  }

  db.prepare("UPDATE prepared_meals SET date_removed = NULL WHERE id = ?").run(id);
  res.json({ success: true });
});

// ============ BREAST MILK ROUTES ============

// Get all active breast milk
app.get("/api/breast-milk", (_req, res) => {
  const items = db.prepare(`
    SELECT * FROM breast_milk 
    WHERE date_removed IS NULL 
    ORDER BY date_added DESC
  `).all();
  res.json(items);
});

// Get consumed breast milk
app.get("/api/breast-milk/consumed", (_req, res) => {
  const items = db.prepare(`
    SELECT * FROM breast_milk 
    WHERE date_removed IS NOT NULL 
    ORDER BY date_removed DESC
  `).all();
  res.json(items);
});

// Create breast milk entry
app.post("/api/breast-milk", (req, res) => {
  const { date_expressed, date_added, volume_ml, comment } = req.body;
  
  if (!date_expressed || !date_added || !volume_ml) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const result = db.prepare(`
    INSERT INTO breast_milk (date_expressed, date_added, volume_ml, comment)
    VALUES (?, ?, ?, ?)
  `).run(date_expressed, date_added, volume_ml, comment?.trim() || null);

  const item = db.prepare("SELECT * FROM breast_milk WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(item);
});

// Take out breast milk (whole bag)
app.post("/api/breast-milk/:id/take-out", (req, res) => {
  const { id } = req.params;
  const today = getLocalDateString();

  const result = db.prepare(`
    UPDATE breast_milk SET date_removed = ? WHERE id = ? AND date_removed IS NULL
  `).run(today, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Item not found or already removed" });
  }

  res.json({ success: true });
});

// Update breast milk
app.patch("/api/breast-milk/:id", (req, res) => {
  const { id } = req.params;
  const { date_expressed, date_added, volume_ml, comment } = req.body;

  const existing = db.prepare("SELECT * FROM breast_milk WHERE id = ?").get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: "Item not found" });
  }

  db.prepare(`
    UPDATE breast_milk 
    SET date_expressed = ?, date_added = ?, volume_ml = ?, comment = ?
    WHERE id = ?
  `).run(
    date_expressed ?? existing.date_expressed,
    date_added ?? existing.date_added,
    volume_ml ?? existing.volume_ml,
    comment?.trim() ?? existing.comment,
    id
  );

  const item = db.prepare("SELECT * FROM breast_milk WHERE id = ?").get(id);
  res.json(item);
});

// Delete breast milk
app.delete("/api/breast-milk/:id", (req, res) => {
  const result = db.prepare("DELETE FROM breast_milk WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json({ success: true });
});

// Put back breast milk (undo take out)
app.post("/api/breast-milk/:id/put-back", (req, res) => {
  const { id } = req.params;

  const existing = db.prepare("SELECT * FROM breast_milk WHERE id = ? AND date_removed IS NOT NULL").get(id);
  if (!existing) {
    return res.status(404).json({ error: "Item not found or not removed" });
  }

  db.prepare("UPDATE breast_milk SET date_removed = NULL WHERE id = ?").run(id);
  res.json({ success: true });
});

// ============ STATS ROUTES ============

app.get("/api/stats", (_req, res) => {
  // Raw food stats
  const rawInFreezerKg = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM raw_food 
    WHERE date_removed IS NULL AND measuring_unit = 'kg'
  `).get() as { total: number };
  
  const rawInFreezerPieces = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM raw_food 
    WHERE date_removed IS NULL AND measuring_unit = 'pieces'
  `).get() as { total: number };
  
  const rawConsumedKg = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM raw_food 
    WHERE date_removed IS NOT NULL AND measuring_unit = 'kg'
  `).get() as { total: number };
  
  const rawConsumedPieces = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM raw_food 
    WHERE date_removed IS NOT NULL AND measuring_unit = 'pieces'
  `).get() as { total: number };

  // Prepared meals stats
  const preparedBagsInFreezer = db.prepare(`
    SELECT COUNT(*) as total FROM prepared_meals WHERE date_removed IS NULL
  `).get() as { total: number };
  
  const preparedPortionsInFreezer = db.prepare(`
    SELECT COALESCE(SUM(portions), 0) as total FROM prepared_meals WHERE date_removed IS NULL
  `).get() as { total: number };
  
  const preparedPortionsConsumed = db.prepare(`
    SELECT COALESCE(SUM(portions), 0) as total FROM prepared_meals WHERE date_removed IS NOT NULL
  `).get() as { total: number };

  // Breast milk stats
  const milkInFreezer = db.prepare(`
    SELECT COALESCE(SUM(volume_ml), 0) as total FROM breast_milk WHERE date_removed IS NULL
  `).get() as { total: number };
  
  const milkConsumed = db.prepare(`
    SELECT COALESCE(SUM(volume_ml), 0) as total FROM breast_milk WHERE date_removed IS NOT NULL
  `).get() as { total: number };

  res.json({
    rawFood: {
      inFreezerKg: rawInFreezerKg.total,
      inFreezerPieces: rawInFreezerPieces.total,
      consumedKg: rawConsumedKg.total,
      consumedPieces: rawConsumedPieces.total,
    },
    preparedMeals: {
      bagsInFreezer: preparedBagsInFreezer.total,
      portionsInFreezer: preparedPortionsInFreezer.total,
      portionsConsumed: preparedPortionsConsumed.total,
    },
    breastMilk: {
      inFreezerMl: milkInFreezer.total,
      consumedMl: milkConsumed.total,
    },
  });
});

// ============ FRESHNESS SETTINGS ROUTES ============

app.get("/api/freshness-settings", (_req, res) => {
  const settings = db.prepare("SELECT * FROM freshness_settings").all();
  res.json(settings);
});

app.patch("/api/freshness-settings/:id", (req, res) => {
  const { id } = req.params;
  const { fresh_days, good_days, use_soon_days } = req.body;

  db.prepare(`
    UPDATE freshness_settings 
    SET fresh_days = ?, good_days = ?, use_soon_days = ?
    WHERE id = ?
  `).run(fresh_days, good_days, use_soon_days, id);

  const setting = db.prepare("SELECT * FROM freshness_settings WHERE id = ?").get(id);
  res.json(setting);
});

// ============ RED ZONE DISMISSAL ============

app.get("/api/red-zone-dismissed", (_req, res) => {
  const today = getLocalDateString();
  const dismissed = db.prepare(`
    SELECT * FROM red_zone_dismissals WHERE dismissed_date = ?
  `).get(today);
  res.json({ dismissed: !!dismissed });
});

app.post("/api/red-zone-dismiss", (_req, res) => {
  const today = getLocalDateString();
  db.prepare(`
    INSERT OR IGNORE INTO red_zone_dismissals (dismissed_date) VALUES (?)
  `).run(today);
  res.json({ success: true });
});

// ============ EXCEL EXPORT ============

app.get("/api/export", async (_req, res) => {
  try {
    // Fetch all data
    const rawFoodActive = db.prepare("SELECT * FROM raw_food WHERE date_removed IS NULL ORDER BY date_added DESC").all() as any[];
    const rawFoodConsumed = db.prepare("SELECT * FROM raw_food WHERE date_removed IS NOT NULL ORDER BY date_removed DESC").all() as any[];
    const preparedActive = db.prepare("SELECT * FROM prepared_meals WHERE date_removed IS NULL ORDER BY date_added DESC").all() as any[];
    const preparedConsumed = db.prepare("SELECT * FROM prepared_meals WHERE date_removed IS NOT NULL ORDER BY date_removed DESC").all() as any[];
    const milkActive = db.prepare("SELECT * FROM breast_milk WHERE date_removed IS NULL ORDER BY date_added DESC").all() as any[];
    const milkConsumed = db.prepare("SELECT * FROM breast_milk WHERE date_removed IS NOT NULL ORDER BY date_removed DESC").all() as any[];

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Freezer Tracker";
    workbook.created = new Date();

    // Define styles
    const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    const headerFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0EA5E9" } };
    const greenHeaderFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } };
    const headerAlignment: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };
    const headerBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FF0284C7" } },
      bottom: { style: "thin", color: { argb: "FF0284C7" } },
      left: { style: "thin", color: { argb: "FF0284C7" } },
      right: { style: "thin", color: { argb: "FF0284C7" } },
    };

    const subHeaderFont = { bold: true, color: { argb: "FF1E3A5F" }, size: 11 };
    const subHeaderFill: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
    const subHeaderAlignment: Partial<ExcelJS.Alignment> = { horizontal: "left", vertical: "middle" };

    const dataAlignment: Partial<ExcelJS.Alignment> = { vertical: "middle" };
    const dataBorder: Partial<ExcelJS.Borders> = {
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
    };

    const consumedFont = { color: { argb: "FF6B7280" } };

    // ============ SUMMARY SHEET ============
    const summarySheet = workbook.addWorksheet("Summary", {
      properties: { tabColor: { argb: "FF0EA5E9" } },
    });

    // Title
    summarySheet.mergeCells("A1:D1");
    const titleCell = summarySheet.getCell("A1");
    titleCell.value = "❄️ Freezer Inventory Summary";
    titleCell.font = { bold: true, size: 18, color: { argb: "FF0369A1" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    summarySheet.getRow(1).height = 35;

    // Export date
    summarySheet.mergeCells("A2:D2");
    const dateCell = summarySheet.getCell("A2");
    dateCell.value = `Generated: ${new Date().toLocaleString()}`;
    dateCell.font = { italic: true, color: { argb: "FF6B7280" } };
    dateCell.alignment = { horizontal: "center" };

    // Stats section
    let row = 4;

    // Raw Food Stats
    summarySheet.getCell(`A${row}`).value = "🥩 Raw Food";
    summarySheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    summarySheet.mergeCells(`A${row}:D${row}`);
    row++;

    const rawKgInFreezer = rawFoodActive.filter(i => i.measuring_unit === "kg").reduce((sum, i) => sum + i.amount, 0);
    const rawPcsInFreezer = rawFoodActive.filter(i => i.measuring_unit === "pieces").reduce((sum, i) => sum + i.amount, 0);
    const rawKgConsumed = rawFoodConsumed.filter(i => i.measuring_unit === "kg").reduce((sum, i) => sum + i.amount, 0);
    const rawPcsConsumed = rawFoodConsumed.filter(i => i.measuring_unit === "pieces").reduce((sum, i) => sum + i.amount, 0);

    summarySheet.getCell(`A${row}`).value = "In Freezer:";
    summarySheet.getCell(`B${row}`).value = `${rawKgInFreezer.toFixed(1)} kg`;
    summarySheet.getCell(`C${row}`).value = `${rawPcsInFreezer} pieces`;
    row++;
    summarySheet.getCell(`A${row}`).value = "Consumed:";
    summarySheet.getCell(`B${row}`).value = `${rawKgConsumed.toFixed(1)} kg`;
    summarySheet.getCell(`C${row}`).value = `${rawPcsConsumed} pieces`;
    row += 2;

    // Prepared Meals Stats
    summarySheet.getCell(`A${row}`).value = "🍱 Prepared Meals";
    summarySheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    summarySheet.mergeCells(`A${row}:D${row}`);
    row++;

    const preparedBags = preparedActive.length;
    const preparedPortions = preparedActive.reduce((sum, i) => sum + i.portions, 0);
    const preparedConsumedPortions = preparedConsumed.reduce((sum, i) => sum + i.portions, 0);

    summarySheet.getCell(`A${row}`).value = "In Freezer:";
    summarySheet.getCell(`B${row}`).value = `${preparedBags} bags`;
    summarySheet.getCell(`C${row}`).value = `${preparedPortions} portions`;
    row++;
    summarySheet.getCell(`A${row}`).value = "Consumed:";
    summarySheet.getCell(`B${row}`).value = `${preparedConsumed.length} bags`;
    summarySheet.getCell(`C${row}`).value = `${preparedConsumedPortions} portions`;
    row += 2;

    // Breast Milk Stats
    summarySheet.getCell(`A${row}`).value = "🍼 Breast Milk";
    summarySheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    summarySheet.mergeCells(`A${row}:D${row}`);
    row++;

    const milkInFreezer = milkActive.reduce((sum, i) => sum + i.volume_ml, 0);
    const milkConsumedTotal = milkConsumed.reduce((sum, i) => sum + i.volume_ml, 0);

    summarySheet.getCell(`A${row}`).value = "In Freezer:";
    summarySheet.getCell(`B${row}`).value = `${milkInFreezer} ml`;
    summarySheet.getCell(`C${row}`).value = `${milkActive.length} bags`;
    row++;
    summarySheet.getCell(`A${row}`).value = "Consumed:";
    summarySheet.getCell(`B${row}`).value = `${milkConsumedTotal} ml`;
    summarySheet.getCell(`C${row}`).value = `${milkConsumed.length} bags`;

    summarySheet.columns = [
      { width: 18 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    // ============ RAW FOOD SHEET ============
    const rawSheet = workbook.addWorksheet("Raw Food", {
      properties: { tabColor: { argb: "FFEF4444" } },
    });

    // Title
    rawSheet.mergeCells("A1:G1");
    rawSheet.getCell("A1").value = "🥩 Raw Food Inventory";
    rawSheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFDC2626" } };
    rawSheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    rawSheet.getRow(1).height = 30;

    // Active items section
    rawSheet.getCell("A3").value = "📦 Currently in Freezer";
    rawSheet.getCell("A3").font = subHeaderFont;
    rawSheet.getCell("A3").fill = subHeaderFill;
    rawSheet.getCell("A3").alignment = subHeaderAlignment;
    rawSheet.mergeCells("A3:G3");

    // Headers
    const rawHeaders = ["Sub-Category", "Name", "Amount", "Unit", "Date Added", "Days Stored", "Comment"];
    const headerRow = rawSheet.getRow(4);
    rawHeaders.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    });
    headerRow.height = 25;

    // Active data
    let rawRow = 5;
    for (const item of rawFoodActive) {
      const daysStored = Math.floor((Date.now() - new Date(item.date_added).getTime()) / (1000 * 60 * 60 * 24));
      const row = rawSheet.getRow(rawRow);
      
      row.getCell(1).value = item.sub_category;
      row.getCell(2).value = item.name;
      row.getCell(3).value = Number(item.amount);
      row.getCell(3).numFmt = '0.00';
      row.getCell(4).value = item.measuring_unit;
      row.getCell(5).value = new Date(item.date_added);
      row.getCell(5).numFmt = 'yyyy-mm-dd';
      row.getCell(6).value = daysStored;
      row.getCell(6).numFmt = '0';
      row.getCell(7).value = item.comment || "";
      
      row.eachCell((cell) => {
        cell.alignment = dataAlignment;
        cell.border = dataBorder;
      });
      rawRow++;
    }

    if (rawFoodActive.length === 0) {
      rawSheet.getCell(`A${rawRow}`).value = "No items in freezer";
      rawSheet.getCell(`A${rawRow}`).font = { italic: true, color: { argb: "FF9CA3AF" } };
      rawRow++;
    }

    // Consumed items section
    rawRow += 2;
    rawSheet.getCell(`A${rawRow}`).value = "✓ Consumed Items";
    rawSheet.getCell(`A${rawRow}`).font = subHeaderFont;
    rawSheet.getCell(`A${rawRow}`).fill = subHeaderFill;
    rawSheet.getCell(`A${rawRow}`).alignment = subHeaderAlignment;
    rawSheet.mergeCells(`A${rawRow}:G${rawRow}`);
    rawRow++;

    const rawConsumedHeaders = ["Sub-Category", "Name", "Amount", "Unit", "Date Added", "Date Removed", "Comment"];
    const rawConsumedHeaderRow = rawSheet.getRow(rawRow);
    rawConsumedHeaders.forEach((header, idx) => {
      const cell = rawConsumedHeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = greenHeaderFill;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    });
    rawRow++;

    for (const item of rawFoodConsumed) {
      const row = rawSheet.getRow(rawRow);
      
      row.getCell(1).value = item.sub_category;
      row.getCell(2).value = item.name;
      row.getCell(3).value = Number(item.amount);
      row.getCell(3).numFmt = '0.00';
      row.getCell(4).value = item.measuring_unit;
      row.getCell(5).value = new Date(item.date_added);
      row.getCell(5).numFmt = 'yyyy-mm-dd';
      row.getCell(6).value = new Date(item.date_removed);
      row.getCell(6).numFmt = 'yyyy-mm-dd';
      row.getCell(7).value = item.comment || "";
      
      row.eachCell((cell) => {
        cell.font = consumedFont;
        cell.alignment = dataAlignment;
        cell.border = dataBorder;
      });
      rawRow++;
    }

    rawSheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 10 },
      { width: 10 },
      { width: 14 },
      { width: 14 },
      { width: 30 },
    ];

    // ============ PREPARED MEALS SHEET ============
    const preparedSheet = workbook.addWorksheet("Prepared Meals", {
      properties: { tabColor: { argb: "FFF59E0B" } },
    });

    preparedSheet.mergeCells("A1:F1");
    preparedSheet.getCell("A1").value = "🍱 Prepared Meals Inventory";
    preparedSheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFD97706" } };
    preparedSheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    preparedSheet.getRow(1).height = 30;

    // Active items
    preparedSheet.getCell("A3").value = "📦 Currently in Freezer";
    preparedSheet.getCell("A3").font = subHeaderFont;
    preparedSheet.getCell("A3").fill = subHeaderFill;
    preparedSheet.getCell("A3").alignment = subHeaderAlignment;
    preparedSheet.mergeCells("A3:F3");

    const preparedHeaders = ["Name", "Portions", "Date Added", "Days Stored", "Comment"];
    const prepHeaderRow = preparedSheet.getRow(4);
    preparedHeaders.forEach((header, idx) => {
      const cell = prepHeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    });
    prepHeaderRow.height = 25;

    let prepRow = 5;
    for (const item of preparedActive) {
      const daysStored = Math.floor((Date.now() - new Date(item.date_added).getTime()) / (1000 * 60 * 60 * 24));
      const row = preparedSheet.getRow(prepRow);
      
      row.getCell(1).value = item.name;
      row.getCell(2).value = Number(item.portions);
      row.getCell(2).numFmt = '0';
      row.getCell(3).value = new Date(item.date_added);
      row.getCell(3).numFmt = 'yyyy-mm-dd';
      row.getCell(4).value = daysStored;
      row.getCell(4).numFmt = '0';
      row.getCell(5).value = item.comment || "";
      
      row.eachCell((cell) => {
        cell.alignment = dataAlignment;
        cell.border = dataBorder;
      });
      prepRow++;
    }

    if (preparedActive.length === 0) {
      preparedSheet.getCell(`A${prepRow}`).value = "No items in freezer";
      preparedSheet.getCell(`A${prepRow}`).font = { italic: true, color: { argb: "FF9CA3AF" } };
      prepRow++;
    }

    // Consumed
    prepRow += 2;
    preparedSheet.getCell(`A${prepRow}`).value = "✓ Consumed Items";
    preparedSheet.getCell(`A${prepRow}`).font = subHeaderFont;
    preparedSheet.getCell(`A${prepRow}`).fill = subHeaderFill;
    preparedSheet.getCell(`A${prepRow}`).alignment = subHeaderAlignment;
    preparedSheet.mergeCells(`A${prepRow}:F${prepRow}`);
    prepRow++;

    const prepConsumedHeaders = ["Name", "Portions", "Date Added", "Date Removed", "Comment"];
    const prepConsumedHeaderRow = preparedSheet.getRow(prepRow);
    prepConsumedHeaders.forEach((header, idx) => {
      const cell = prepConsumedHeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = greenHeaderFill;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    });
    prepRow++;

    for (const item of preparedConsumed) {
      const row = preparedSheet.getRow(prepRow);
      
      row.getCell(1).value = item.name;
      row.getCell(2).value = Number(item.portions);
      row.getCell(2).numFmt = '0';
      row.getCell(3).value = new Date(item.date_added);
      row.getCell(3).numFmt = 'yyyy-mm-dd';
      row.getCell(4).value = new Date(item.date_removed);
      row.getCell(4).numFmt = 'yyyy-mm-dd';
      row.getCell(5).value = item.comment || "";
      
      row.eachCell((cell) => {
        cell.font = consumedFont;
        cell.alignment = dataAlignment;
        cell.border = dataBorder;
      });
      prepRow++;
    }

    preparedSheet.columns = [
      { width: 30 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 35 },
    ];

    // ============ BREAST MILK SHEET ============
    const milkSheet = workbook.addWorksheet("Breast Milk", {
      properties: { tabColor: { argb: "FF8B5CF6" } },
    });

    milkSheet.mergeCells("A1:F1");
    milkSheet.getCell("A1").value = "🍼 Breast Milk Inventory";
    milkSheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF7C3AED" } };
    milkSheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
    milkSheet.getRow(1).height = 30;

    // Active items
    milkSheet.getCell("A3").value = "📦 Currently in Freezer";
    milkSheet.getCell("A3").font = subHeaderFont;
    milkSheet.getCell("A3").fill = subHeaderFill;
    milkSheet.getCell("A3").alignment = subHeaderAlignment;
    milkSheet.mergeCells("A3:F3");

    const milkHeaders = ["Volume (ml)", "Date Expressed", "Date Added", "Days Stored", "Comment"];
    const milkHeaderRow = milkSheet.getRow(4);
    milkHeaders.forEach((header, idx) => {
      const cell = milkHeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = headerFill;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    });
    milkHeaderRow.height = 25;

    let milkRow = 5;
    for (const item of milkActive) {
      const daysStored = Math.floor((Date.now() - new Date(item.date_added).getTime()) / (1000 * 60 * 60 * 24));
      const row = milkSheet.getRow(milkRow);
      
      row.getCell(1).value = Number(item.volume_ml);
      row.getCell(1).numFmt = '0';
      row.getCell(2).value = new Date(item.date_expressed);
      row.getCell(2).numFmt = 'yyyy-mm-dd';
      row.getCell(3).value = new Date(item.date_added);
      row.getCell(3).numFmt = 'yyyy-mm-dd';
      row.getCell(4).value = daysStored;
      row.getCell(4).numFmt = '0';
      row.getCell(5).value = item.comment || "";
      
      row.eachCell((cell) => {
        cell.alignment = dataAlignment;
        cell.border = dataBorder;
      });
      milkRow++;
    }

    if (milkActive.length === 0) {
      milkSheet.getCell(`A${milkRow}`).value = "No items in freezer";
      milkSheet.getCell(`A${milkRow}`).font = { italic: true, color: { argb: "FF9CA3AF" } };
      milkRow++;
    }

    // Consumed
    milkRow += 2;
    milkSheet.getCell(`A${milkRow}`).value = "✓ Consumed Items";
    milkSheet.getCell(`A${milkRow}`).font = subHeaderFont;
    milkSheet.getCell(`A${milkRow}`).fill = subHeaderFill;
    milkSheet.getCell(`A${milkRow}`).alignment = subHeaderAlignment;
    milkSheet.mergeCells(`A${milkRow}:F${milkRow}`);
    milkRow++;

    const milkConsumedHeaders = ["Volume (ml)", "Date Expressed", "Date Added", "Date Removed", "Comment"];
    const milkConsumedHeaderRow = milkSheet.getRow(milkRow);
    milkConsumedHeaders.forEach((header, idx) => {
      const cell = milkConsumedHeaderRow.getCell(idx + 1);
      cell.value = header;
      cell.font = headerFont;
      cell.fill = greenHeaderFill;
      cell.alignment = headerAlignment;
      cell.border = headerBorder;
    });
    milkRow++;

    for (const item of milkConsumed) {
      const row = milkSheet.getRow(milkRow);
      
      row.getCell(1).value = Number(item.volume_ml);
      row.getCell(1).numFmt = '0';
      row.getCell(2).value = new Date(item.date_expressed);
      row.getCell(2).numFmt = 'yyyy-mm-dd';
      row.getCell(3).value = new Date(item.date_added);
      row.getCell(3).numFmt = 'yyyy-mm-dd';
      row.getCell(4).value = new Date(item.date_removed);
      row.getCell(4).numFmt = 'yyyy-mm-dd';
      row.getCell(5).value = item.comment || "";
      
      row.eachCell((cell) => {
        cell.font = consumedFont;
        cell.alignment = dataAlignment;
        cell.border = dataBorder;
      });
      milkRow++;
    }

    milkSheet.columns = [
      { width: 14 },
      { width: 16 },
      { width: 14 },
      { width: 14 },
      { width: 35 },
    ];

    // Generate buffer and send
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="freezer-inventory-${getLocalDateString()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to generate export" });
  }
});

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
