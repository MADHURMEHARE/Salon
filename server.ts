import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("salon.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee', -- 'master_admin', 'admin', 'employee'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT,
    last_visit DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    commission_pct REAL NOT NULL DEFAULT 30,
    duration_mins INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5,
    unit TEXT,
    price REAL,
    image_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration for image_url if table existed before
try {
  db.prepare("SELECT image_url FROM inventory LIMIT 1").get();
} catch (e) {
  try {
    db.exec("ALTER TABLE inventory ADD COLUMN image_url TEXT;");
  } catch (err) {
    console.log("Migration skipped or failed:", err);
  }
}

// Migration for customer passwords if table existed before
try {
  db.prepare("SELECT password FROM customers LIMIT 1").get();
} catch (e) {
  try {
    db.exec("ALTER TABLE customers ADD COLUMN password TEXT;");
  } catch (err) {
    console.log("Customer password migration skipped or failed:", err);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    employee_id INTEGER,
    service_id INTEGER,
    start_time DATETIME NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
    notes TEXT,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY(employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    customer_id INTEGER,
    employee_id INTEGER,
    total_amount REAL NOT NULL,
    commission_amount REAL NOT NULL,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY(employee_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payout_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY(employee_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Seed initial admin if not exists
const adminCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Master Admin",
    "admin@salon.com",
    hashedPassword,
    "master_admin"
  );
}

// Seed initial services if empty
const serviceCount = db.prepare("SELECT count(*) as count FROM services").get() as { count: number };
if (serviceCount.count === 0) {
  const defaultServices = [
    // Hair Services
    ["Hair Cut", 100, 30],
    ["Stylish Hair Cut", 149, 45],
    ["Hair Cut + Hair Wash", 149, 45],
    ["Hair Cut + Beard Wash", 199, 60],
    ["Beard", 79, 15],
    ["Hair Waxing", 999, 60],
    
    // Colour
    ["Cosmo Global Colour", 300, 60],
    ["Matrix Global Colour", 400, 60],
    ["Loreal Global Colour", 500, 75],
    
    // Treatments
    ["Spa Nourishment (Loreal)", 600, 60],
    ["Dandruff Treatment", 400, 45],
    ["Spa Nourishment + Dandruff", 999, 90],
    ["Hair Highlighting", 450, 120],
    ["Hair Straightening (Loreal Xtenso)", 1999, 180],
    ["Keratine Hair Treatment", 2999, 180],
    
    // Facial
    ["Clean Up", 499, 30],
    ["Normal Facial", 799, 45],
    ["VLCC Facial Kit", 1199, 60],
    ["LOTUS GOLD Facial Kit", 1499, 60],
    ["SHARLY Facial Kit", 1799, 60],
    ["SHAHNAZ HUSAIN Facial Kit", 2499, 75],
    ["O3 Facial Kit", 2999, 90],
    
    // Massage
    ["Detaining", 399, 30],
    ["Steam Massage", 299, 30],
    ["Detain Scrub Massage", 299, 45],
    
    // Special
    ["Groom's Wedding Special", 6999, 240],
  ];

  const stmt = db.prepare("INSERT INTO services (name, price, duration_mins) VALUES (?, ?, ?)");
  for (const [name, price, duration] of defaultServices) {
    stmt.run(name, price, duration);
  }
}

// Seed initial inventory if empty
const productCount = db.prepare("SELECT count(*) as count FROM inventory").get() as { count: number };
if (productCount.count === 0) {
  const defaultProducts = [
    ["Professional Hair Wax", 50, 5, "Jar", 450, "https://images.unsplash.com/photo-1590159763121-7c9ff6189605?auto=format&fit=crop&w=400&q=80"],
    ["Loreal Argan Oil", 30, 3, "Bottle", 1200, "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80"],
    ["Matte Finish Pomade", 40, 5, "Jar", 550, "https://images.unsplash.com/photo-1585232351009-aa87416fca90?auto=format&fit=crop&w=400&q=80"],
    ["Beard Maintenance Kit", 20, 2, "Set", 1599, "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=400&q=80"],
    ["Moisturizing Shaving Cream", 45, 5, "Tube", 350, "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=400&q=80"],
  ];

  const stmt = db.prepare("INSERT INTO inventory (name, stock, min_stock, unit, price, image_url) VALUES (?, ?, ?, ?, ?, ?)");
  for (const [name, stock, min, unit, price, img] of defaultProducts) {
    stmt.run(name, stock, min, unit, price, img);
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "salon-secret-key-123";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user;
      next();
    });
  };

  // Helper: Validate Phone Number (Basic regex for 10 digits or more)
  const isValidPhone = (phone: string) => /^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''));

  // Helper: Check Availability
  const isAvailable = (employeeId: number, startTime: string) => {
    const existing = db.prepare(`
      SELECT id FROM appointments 
      WHERE employee_id = ? 
      AND start_time = ? 
      AND status != 'cancelled'
    `).get(employeeId, startTime);
    return !existing;
  };

  // --- Public API Routes ---
  app.get("/api/public/services", (req, res) => {
    const services = db.prepare("SELECT id, name, price, duration_mins FROM services").all();
    res.json(services);
  });

  app.get("/api/public/employees", (req, res) => {
    const employees = db.prepare("SELECT id, name FROM users").all();
    res.json(employees);
  });

  app.get("/api/public/availability", (req, res) => {
    const { date, employee_id } = req.query;
    if (!date || !employee_id) return res.status(400).json({ message: "Missing date or employee_id" });

    // Get all non-cancelled appointments for this employee on this date
    const appointments = db.prepare(`
      SELECT start_time, duration_mins 
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      WHERE a.employee_id = ? 
      AND date(a.start_time) = date(?)
      AND a.status != 'cancelled'
    `).all(employee_id, date) as { start_time: string, duration_mins: number }[];

    res.json(appointments.map(a => ({
      start: a.start_time,
      end: new Date(new Date(a.start_time).getTime() + a.duration_mins * 60000).toISOString()
    })));
  });

  // Customer Auth
  app.post("/api/public/customer/register", (req, res) => {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password) return res.status(400).json({ message: "Missing required fields" });
    if (!isValidPhone(phone)) return res.status(400).json({ message: "Invalid phone number format" });

    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = db.prepare("INSERT INTO customers (name, phone, email, password) VALUES (?, ?, ?, ?)").run(name, phone, email || null, hashedPassword);
      const token = jwt.sign({ id: result.lastInsertRowid, type: 'customer' }, JWT_SECRET);
      res.status(201).json({ token, customer: { id: result.lastInsertRowid, name, phone, email } });
    } catch (e) {
      res.status(400).json({ message: "Phone number already registered" });
    }
  });

  app.post("/api/public/customer/login", (req, res) => {
    const { phone, password } = req.body;
    const customer = db.prepare("SELECT * FROM customers WHERE phone = ?").get(phone) as any;

    if (customer && customer.password && bcrypt.compareSync(password, customer.password)) {
      const token = jwt.sign({ id: customer.id, type: 'customer' }, JWT_SECRET);
      res.json({ token, customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.get("/api/public/customer/me", (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err || decoded.type !== 'customer') return res.sendStatus(403);
      const customer = db.prepare("SELECT id, name, phone, email FROM customers WHERE id = ?").get(decoded.id) as any;
      if (!customer) return res.sendStatus(404);
      res.json(customer);
    });
  });

  app.get("/api/public/inventory", (req, res) => {
    const items = db.prepare("SELECT id, name, stock, unit, price, image_url FROM inventory WHERE stock > 0").all();
    res.json(items);
  });

  app.post("/api/public/inventory/buy", (req, res) => {
    const { item_id, quantity, customer_id, name, phone } = req.body;
    if (!item_id || !quantity) return res.status(400).json({ message: "Missing item info" });

    try {
      db.transaction(() => {
        const item = db.prepare("SELECT stock, name, price FROM inventory WHERE id = ?").get(item_id) as any;
        if (!item || item.stock < quantity) throw new Error("INSUFFICIENT_STOCK");

        // Record sale as a ghost appointment for accounting or just update inventory
        db.prepare("UPDATE inventory SET stock = stock - ? WHERE id = ?").run(quantity, item_id);
        
        // Find or create customer if not logged in
        let finalCustomerId = customer_id;
        if (!finalCustomerId && phone) {
           let customer = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone) as any;
           if (!customer) {
             const result = db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(name || "Customer", phone);
             finalCustomerId = result.lastInsertRowid;
           } else {
             finalCustomerId = customer.id;
           }
        }
      })();
      res.json({ message: "Purchase successful!" });
    } catch (e: any) {
      res.status(400).json({ message: e.message === "INSUFFICIENT_STOCK" ? "Sorry, item is out of stock" : "Purchase failed" });
    }
  });

  app.post("/api/public/book", (req, res) => {
    const { name, phone, email, service_id, employee_id, start_time, notes, customer_id } = req.body;
    
    if ((!name || !phone) && !customer_id) {
      return res.status(400).json({ message: "Missing identity information" });
    }
    if (!service_id || !employee_id || !start_time) {
      return res.status(400).json({ message: "Missing required booking information" });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!isAvailable(Number(employee_id), start_time)) {
      return res.status(400).json({ message: "This slot was just booked. Please pick another time." });
    }

    try {
      db.transaction(() => {
        let finalCustomerId = customer_id;

        if (!finalCustomerId) {
          // Find or create customer (anonymous)
          let customer = db.prepare("SELECT id, name, password FROM customers WHERE phone = ?").get(phone) as any;
          
          if (!customer) {
            const result = db.prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)").run(name, phone, email || null);
            finalCustomerId = result.lastInsertRowid;
          } else {
            // Check for potential identity spoofing if account has a password
            if (customer.password && !customer_id) {
               throw new Error("ACCOUNT_EXISTS");
            }
            finalCustomerId = customer.id;
          }
        }

        // Create appointment
        db.prepare("INSERT INTO appointments (customer_id, employee_id, service_id, start_time, notes, status) VALUES (?, ?, ?, ?, ?, 'pending')").run(
          finalCustomerId, employee_id, service_id, start_time, notes || ""
        );
      })();
      res.status(201).json({ message: "Booking request received" });
    } catch (e: any) {
      if (e.message === "ACCOUNT_EXISTS") {
        return res.status(403).json({ message: "This phone number is linked to a registered account. Please login to book." });
      }
      console.error("Public booking error:", e);
      res.status(500).json({ message: "Failed to process booking" });
    }
  });

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // Users / Employees
  app.get("/api/employees", authenticateToken, (req, res) => {
    const employees = db.prepare("SELECT id, name, email, role, created_at FROM users").all();
    res.json(employees);
  });

  app.post("/api/employees", authenticateToken, (req, res) => {
    if ((req as any).user.role !== 'master_admin') return res.sendStatus(403);
    const { name, email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, role);
      res.status(201).json({ message: "Employee created" });
    } catch (e) {
      res.status(400).json({ message: "Email already exists" });
    }
  });

  app.delete("/api/employees/:id", authenticateToken, (req, res) => {
    if ((req as any).user.role !== 'master_admin') return res.sendStatus(403);
    
    try {
      db.transaction(() => {
        // Manually clean up related records to avoid foreign key constraints failing
        db.prepare("DELETE FROM payouts WHERE employee_id = ?").run(req.params.id);
        db.prepare("DELETE FROM appointments WHERE employee_id = ?").run(req.params.id);
        db.prepare("UPDATE transactions SET employee_id = NULL WHERE employee_id = ?").run(req.params.id);
        db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      })();
      res.sendStatus(200);
    } catch (e) {
      console.error("Failed to delete artist:", e);
      res.status(500).json({ message: "Failed to delete artist. They may have active dependencies." });
    }
  });

  app.post("/api/employees/:id/payouts", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'employee') return res.sendStatus(403);
    const { amount, notes } = req.body;
    db.prepare("INSERT INTO payouts (employee_id, amount, notes) VALUES (?, ?, ?)").run(req.params.id, amount, notes);
    res.sendStatus(201);
  });

  app.get("/api/employees/:id/payouts", authenticateToken, (req, res) => {
    const payouts = db.prepare("SELECT * FROM payouts WHERE employee_id = ? ORDER BY payout_date DESC").all(req.params.id);
    res.json(payouts);
  });

  // Customers
  app.get("/api/customers", authenticateToken, (req, res) => {
    const customers = db.prepare(`
      SELECT c.*, 
      (SELECT s.name FROM transactions t JOIN appointments a ON t.appointment_id = a.id JOIN services s ON a.service_id = s.id WHERE t.customer_id = c.id ORDER BY t.created_at DESC LIMIT 1) as last_service,
      (SELECT t.total_amount FROM transactions t WHERE t.customer_id = c.id ORDER BY t.created_at DESC LIMIT 1) as last_bill_amount
      FROM customers c 
      ORDER BY c.last_visit DESC, c.created_at DESC
    `).all();
    res.json(customers);
  });

  app.post("/api/customers", authenticateToken, (req, res) => {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ message: "Name and phone are required" });
    if (!isValidPhone(phone)) return res.status(400).json({ message: "Invalid phone number format" });

    try {
      const result = db.prepare("INSERT INTO customers (name, phone, email) VALUES (?, ?, ?)").run(name, phone, email || null);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed: customers.phone')) {
        const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone) as any;
        if (existing) {
          return res.json({ id: existing.id });
        }
      }
      res.status(400).json({ message: "Phone number already exists" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, (req, res) => {
    const { name, phone, email } = req.body;
    if (!name || !phone) return res.status(400).json({ message: "Name and phone are required" });
    if (!isValidPhone(phone)) return res.status(400).json({ message: "Invalid phone number format" });

    try {
      db.prepare("UPDATE customers SET name = ?, phone = ?, email = ? WHERE id = ?").run(name, phone, email, req.params.id);
      res.sendStatus(200);
    } catch (e) {
      res.status(400).json({ message: "Phone number already exists on another customer" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'employee') return res.sendStatus(403);
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM appointments WHERE customer_id = ?").run(req.params.id);
        db.prepare("DELETE FROM transactions WHERE customer_id = ?").run(req.params.id);
        db.prepare("DELETE FROM customers WHERE id = ?").run(req.params.id);
      })();
      res.sendStatus(200);
    } catch (e) {
      console.error("Failed to delete customer:", e);
      res.status(500).json({ message: "Failed to delete customer record." });
    }
  });

  // Services
  app.get("/api/services", authenticateToken, (req, res) => {
    const services = db.prepare("SELECT * FROM services").all();
    res.json(services);
  });

  app.post("/api/services", authenticateToken, (req, res) => {
    const { name, price, commission_pct, duration_mins } = req.body;
    db.prepare("INSERT INTO services (name, price, commission_pct, duration_mins) VALUES (?, ?, ?, ?)").run(name, price, commission_pct, duration_mins);
    res.sendStatus(201);
  });

  app.put("/api/services/:id", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'employee') return res.sendStatus(403);
    const { name, price, commission_pct, duration_mins } = req.body;
    db.prepare("UPDATE services SET name = ?, price = ?, commission_pct = ?, duration_mins = ? WHERE id = ?").run(name, price, commission_pct, duration_mins, req.params.id);
    res.sendStatus(200);
  });

  app.delete("/api/services/:id", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'employee') return res.sendStatus(403);
    try {
      db.transaction(() => {
        db.prepare("DELETE FROM appointments WHERE service_id = ?").run(req.params.id);
        db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
      })();
      res.sendStatus(200);
    } catch (e) {
      console.error("Failed to delete service:", e);
      res.status(500).json({ message: "Failed to delete service. It might be linked to active appointments." });
    }
  });

  // Appointments
  app.get("/api/appointments", authenticateToken, (req, res) => {
    const user = (req as any).user;
    const isEmployee = user.role === 'employee';
    const appointments = db.prepare(`
      SELECT a.*, c.name as customer_name, c.phone as customer_phone, u.name as employee_name, s.name as service_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN users u ON a.employee_id = u.id
      JOIN services s ON a.service_id = s.id
      ${isEmployee ? "WHERE a.employee_id = ?" : ""}
      ORDER BY a.start_time DESC
    `).all(isEmployee ? [user.id] : []);
    res.json(appointments);
  });

  app.post("/api/appointments", authenticateToken, (req, res) => {
    const { customer_id, employee_id, service_id, start_time, notes } = req.body;
    db.prepare("INSERT INTO appointments (customer_id, employee_id, service_id, start_time, notes) VALUES (?, ?, ?, ?, ?)").run(
      customer_id, employee_id, service_id, start_time, notes
    );
    res.sendStatus(201);
  });

  app.put("/api/appointments/:id", authenticateToken, (req, res) => {
    const { customer_id, employee_id, service_id, start_time, notes, status } = req.body;
    db.prepare("UPDATE appointments SET customer_id = ?, employee_id = ?, service_id = ?, start_time = ?, notes = ?, status = ? WHERE id = ?").run(
      customer_id, employee_id, service_id, start_time, notes, status, req.params.id
    );
    res.sendStatus(200);
  });

  app.delete("/api/appointments/:id", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'employee') return res.sendStatus(403);
    db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
    res.sendStatus(200);
  });

  app.patch("/api/appointments/:id/status", authenticateToken, (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE appointments SET status = ? WHERE id = ?").run(status, req.params.id);
    res.sendStatus(200);
  });

  // Billing / Transactions
  app.post("/api/billing/checkout", authenticateToken, (req, res) => {
    const { appointment_id, customer_id, employee_id, service_id, service_ids, payment_method } = req.body;
    
    const ids = service_ids || (service_id ? [service_id] : []);
    if (ids.length === 0) return res.status(400).json({ message: "No services selected" });

    db.transaction(() => {
      let total_amount = 0;
      let total_commission = 0;

      for (const id of ids) {
        const service = db.prepare("SELECT price, commission_pct FROM services WHERE id = ?").get(id) as any;
        if (service) {
          total_amount += service.price;
          total_commission += (service.price * service.commission_pct) / 100;
        }
      }

      db.prepare("INSERT INTO transactions (appointment_id, customer_id, employee_id, total_amount, commission_amount, payment_method) VALUES (?, ?, ?, ?, ?, ?)").run(
        appointment_id || null, customer_id, employee_id, total_amount, total_commission, payment_method
      );

      if (appointment_id) {
        db.prepare("UPDATE appointments SET status = 'completed' WHERE id = ?").run(appointment_id);
      }
      
      db.prepare("UPDATE customers SET last_visit = CURRENT_TIMESTAMP WHERE id = ?").run(customer_id);
    })();

    res.sendStatus(201);
  });

  app.get("/api/analytics/dashboard", authenticateToken, (req, res) => {
    const user = (req as any).user;
    const selectedEmployeeId = req.query.employeeId;
    
    let isFiltered = user.role === 'employee';
    let filterId = user.id;

    if (user.role !== 'employee' && selectedEmployeeId) {
      isFiltered = true;
      filterId = selectedEmployeeId;
    }

    const whereClause = isFiltered ? "WHERE employee_id = ?" : "";
    const params = isFiltered ? [filterId] : [];

    // Periodic Reporting
    const period = req.query.period || 'day'; // 'day', 'month', 'year'
    let groupFormat = '%Y-%m-%d';
    if (period === 'month') groupFormat = '%Y-%m';
    if (period === 'year') groupFormat = '%Y';

    const totalRevenue = db.prepare(`SELECT SUM(total_amount) as total FROM transactions ${whereClause}`).get(...params) as any;
    const totalCommissions = db.prepare(`SELECT SUM(commission_amount) as total FROM transactions ${whereClause}`).get(...params) as any;
    
    // Calculate Payout Balance (for employees)
    let pendingCommission = 0;
    if (isFiltered) {
      const lastPayout = db.prepare("SELECT MAX(payout_date) as date FROM payouts WHERE employee_id = ?").get(filterId) as any;
      const lastDate = lastPayout?.date || '1970-01-01';
      const pending = db.prepare("SELECT SUM(commission_amount) as total FROM transactions WHERE employee_id = ? AND created_at > ?").get(filterId, lastDate) as any;
      pendingCommission = pending.total || 0;
    }

    const apptWhere = isFiltered ? "WHERE status != 'cancelled' AND employee_id = ?" : "WHERE status != 'cancelled'";
    const appointmentCount = db.prepare(`SELECT COUNT(*) as count FROM appointments ${apptWhere}`).get(...params) as any;
    
    const custCountQuery = isFiltered 
      ? "SELECT COUNT(DISTINCT customer_id) as count FROM transactions WHERE employee_id = ?" 
      : "SELECT COUNT(*) as count FROM customers";
    const customerCount = db.prepare(custCountQuery).get(...params) as any;

    const recentRevenue = db.prepare(`
      SELECT strftime('${groupFormat}', created_at) as date, SUM(${isFiltered ? 'commission_amount' : 'total_amount'}) as amount 
      FROM transactions 
      ${whereClause}
      GROUP BY date
      ORDER BY date DESC LIMIT 12
    `).all(...params);

    const topServices = db.prepare(`
      SELECT s.name, COUNT(a.id) as count
      FROM services s
      JOIN appointments a ON s.id = a.service_id
      ${isFiltered ? "WHERE a.employee_id = ?" : ""}
      GROUP BY s.id
      ORDER BY count DESC LIMIT 5
    `).all(...params);

    const recentAppointments = db.prepare(`
      SELECT a.*, c.name as customer_name, c.phone as customer_phone, u.name as employee_name, s.name as service_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN users u ON a.employee_id = u.id
      JOIN services s ON a.service_id = s.id
      ${isFiltered ? "WHERE a.employee_id = ?" : ""}
      ORDER BY a.start_time DESC LIMIT 5
    `).all(...params);

    res.json({
      metrics: {
        totalRevenue: totalRevenue.total || 0,
        salonProfit: isFiltered ? (totalCommissions.total || 0) : ((totalRevenue.total || 0) - (totalCommissions.total || 0)),
        appointments: appointmentCount.count,
        customers: customerCount.count,
        pendingCommission: pendingCommission
      },
      recentRevenue: recentRevenue.reverse(),
      topServices,
      recentAppointments
    });
  });

  // Inventory
  app.get("/api/inventory", authenticateToken, (req, res) => {
    const items = db.prepare("SELECT * FROM inventory").all();
    res.json(items);
  });

  app.post("/api/inventory", authenticateToken, (req, res) => {
    const { name, stock, min_stock, unit, price, image_url } = req.body;
    db.prepare("INSERT INTO inventory (name, stock, min_stock, unit, price, image_url) VALUES (?, ?, ?, ?, ?, ?)").run(name, stock, min_stock, unit, price, image_url);
    res.sendStatus(201);
  });

  app.put("/api/inventory/:id", authenticateToken, (req, res) => {
    const { name, stock, min_stock, unit, price, image_url } = req.body;
    db.prepare("UPDATE inventory SET name = ?, stock = ?, min_stock = ?, unit = ?, price = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(name, stock, min_stock, unit, price, image_url, req.params.id);
    res.sendStatus(200);
  });

  app.delete("/api/inventory/:id", authenticateToken, (req, res) => {
    if ((req as any).user.role === 'employee') return res.sendStatus(403);
    db.prepare("DELETE FROM inventory WHERE id = ?").run(req.params.id);
    res.sendStatus(200);
  });

  // --- Vite / Static Files ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Initial Admin: admin@salon.com / admin123`);
  });
}

startServer();
