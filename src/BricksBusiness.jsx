import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://sienbwtsrenqmkapjjmc.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXJL4hideCViOkp_tyNGyA_XqxbE051";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── THEME ─────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0d1117",
  surface: "#161b22",
  card: "#1c2128",
  border: "#30363d",
  accent: "#f97316",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#eab308",
  purple: "#a855f7",
  cyan: "#06b6d4",
  text: "#e6edf3",
  muted: "#8b949e",
  b4: "#f97316",
  b6: "#3b82f6",
  b7: "#a855f7",
  b9: "#22c55e",
};

const BRICKS = [
  { id: "4inch", label: '4"', color: T.b4 },
  { id: "6inch", label: '6"', color: T.b6 },
  { id: "7inch", label: '7"', color: T.b7 },
  { id: "9inch", label: '9"', color: T.b9 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RM_LIST = ["Flyash", "Cement", "Sand", "Lime"];
const RM_UNITS = { Flyash: "Tonnes", Cement: "Bags", Sand: "Tonnes", Lime: "Bags" };
const PAY_MODES = ["Cash", "UPI", "Cheque", "Bank Transfer"];
const WORKER_ROLES = ["Machine Operator", "Helper", "Driver", "Security", "Supervisor", "Other"];
const EXP_CATS = ["Electricity", "Maintenance", "Marketing", "Transport", "Miscellaneous"];

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtN = (n) => Number(n || 0).toLocaleString("en-IN");

const today = () => new Date().toISOString().split("T")[0];

const addDays = (s, d) => {
  const dt = new Date(s);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split("T")[0];
};

const weekOf = (s) => {
  const d = new Date(s);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  return (
    mon.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " – " +
    sun.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  );
};

const saleDue = (s) =>
  Number(s.total_amount || 0) -
  (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);

const supOwed = (s) =>
  (s.bills || []).reduce((a, b) => a + Number(b.amount || 0), 0) -
  (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);

// ── PRIMITIVES ────────────────────────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: 16,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    {children}
  </div>
);

const Hr = () => <div style={{ borderTop: `1px solid ${T.border}`, margin: "10px 0" }} />;

const Badge = ({ children, color = T.accent }) => (
  <span
    style={{
      background: color + "22",
      color,
      borderRadius: 6,
      padding: "2px 9px",
      fontSize: 11,
      fontWeight: 700,
      border: `1px solid ${color}44`,
    }}
  >
    {children}
  </span>
);

const Stat = ({ label, value, sub, color = T.accent, icon }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 16 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: "Georgia, serif", marginTop: 4 }}>
      {value}
    </div>
    {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Inp = ({ label, value, onChange, type = "text", options, placeholder, sm }) => {
  const s = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: sm ? "7px 10px" : "10px 12px",
    color: T.text,
    fontSize: sm ? 12 : 14,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{label}</label>}
      {options ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={s}>
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ""}
          style={s}
        />
      )}
    </div>
  );
};

const Btn = ({ children, onClick, color = T.accent, outline = false, sm = false }) => (
  <button
    onClick={onClick}
    style={{
      background: outline ? "transparent" : color,
      color: outline ? color : "#fff",
      border: `2px solid ${color}`,
      borderRadius: 8,
      padding: sm ? "5px 11px" : "10px 20px",
      fontSize: sm ? 11 : 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </button>
);

const IBtn = ({ label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    style={{
      background: "none",
      border: `1px solid ${danger ? T.red + "55" : T.border}`,
      borderRadius: 6,
      color: danger ? T.red : T.muted,
      fontSize: 11,
      cursor: "pointer",
      padding: "3px 8px",
    }}
  >
    {label}
  </button>
);

const Modal = ({ title, children, onClose }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#000c",
      zIndex: 300,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
    }}
  >
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 22,
        width: "100%",
        maxWidth: 440,
        maxHeight: "92vh",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: T.text, fontSize: 16 }}>{title}</h3>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 22, cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div
    style={{
      display: "flex",
      background: T.surface,
      borderRadius: 10,
      padding: 3,
      marginBottom: 14,
      overflowX: "auto",
    }}
  >
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => onChange(t)}
        style={{
          flex: "0 0 auto",
          padding: "7px 12px",
          background: active === t ? T.accent : "transparent",
          color: active === t ? "#fff" : T.muted,
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 11,
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        {t}
      </button>
    ))}
  </div>
);

const SH = ({ title, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
    <h2 style={{ margin: 0, color: T.text, fontSize: 19 }}>{title}</h2>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{action}</div>
  </div>
);

const G2 = ({ children, gap = 10 }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>
);

const Row = ({ children, gap = 8 }) => (
  <div style={{ display: "flex", gap, alignItems: "center", flexWrap: "wrap" }}>{children}</div>
);

const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 40 }}>
    <div style={{ color: T.muted, fontSize: 14 }}>Loading…</div>
  </div>
);

// ── DATA HOOK ─────────────────────────────────────────────────────────────────
function useData() {
  const [data, setDataRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [inv, rm, prod, workers, salaries, suppliers, customers, sales, expenses] = await Promise.all([
        sb.from("inventory").select("*"),
        sb.from("raw_materials").select("*").order("id"),
        sb.from("production").select("*").order("date", { ascending: false }),
        sb.from("workers").select("*").order("id"),
        sb.from("salary_payments").select("*").order("created_at", { ascending: false }),
        sb.from("suppliers").select("*").order("id"),
        sb.from("customers").select("*").order("id"),
        sb.from("sales").select("*").order("date", { ascending: false }),
        sb.from("expenses").select("*").order("date", { ascending: false }),
      ]);

      const inventory = {};
      BRICKS.forEach((b) => {
        inventory[b.id] = 0;
      });

      (inv.data || []).forEach((r) => {
        inventory[r.brick_type] = Number(r.qty || 0);
      });

      setDataRaw({
        inventory,
        rawMaterials: rm.data || [],
        production: prod.data || [],
        workers: workers.data || [],
        salaryPayments: (salaries.data || []).map((s) => ({ ...s, payments: s.payments || [] })),
        suppliers: (suppliers.data || []).map((s) => ({ ...s, bills: s.bills || [], payments: s.payments || [] })),
        customers: customers.data || [],
        sales: (sales.data || []).map((s) => ({ ...s, payments: s.payments || [] })),
        expenses: expenses.data || [],
      });

      setError(null);
    } catch (e) {
      setError("Failed to load data. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

// ── DB HELPERS ────────────────────────────────────────────────────────────────
const DB = {
  async updateInventory(brickType, qty) {
    await sb.from("inventory").update({ qty }).eq("brick_type", brickType);
  },

  async adjustInventory(brickType, delta, currentQty) {
    const newQty = Math.max(0, Number(currentQty || 0) + Number(delta || 0));
    await sb.from("inventory").update({ qty: newQty }).eq("brick_type", brickType);
    return newQty;
  },

  async updateRM(id, stock) {
    await sb.from("raw_materials").update({ stock }).eq("id", id);
  },

  async updateRMFull(rm) {
    await sb
      .from("raw_materials")
      .update({
        stock: Number(rm.stock || 0),
        reorder: Number(rm.reorder || 0),
        cost_per_unit: Number(rm.cost_per_unit || 0),
      })
      .eq("id", rm.id);
  },

  async addProduction(entry) {
    const { data } = await sb
      .from("production")
      .insert([
        {
          date: entry.date,
          brick_type: entry.brickType,
          qty: Number(entry.qty || 0),
          rejections: Number(entry.rejections || 0),
          materials: entry.materials,
          added_to_stock: false,
        },
      ])
      .select()
      .single();

    return data;
  },

  async updateProduction(id, fields) {
    await sb.from("production").update(fields).eq("id", id);
  },

  async deleteProduction(id) {
    await sb.from("production").delete().eq("id", id);
  },

  async addWorker(w) {
    const { data } = await sb
      .from("workers")
      .insert([{ name: w.name, role: w.role, rate_per_brick: Number(w.ratePerBrick || 0) }])
      .select()
      .single();

    return data;
  },

  async updateWorker(w) {
    await sb
      .from("workers")
      .update({
        name: w.name,
        role: w.role,
        rate_per_brick: Number(w.ratePerBrick || 0),
      })
      .eq("id", w.id);
  },

  async deleteWorker(id) {
    await sb.from("workers").delete().eq("id", id);
  },

  async addSalaryPayment(rec) {
    const { data } = await sb
      .from("salary_payments")
      .insert([
        {
          week_label: rec.weekLabel,
          total_bricks: Number(rec.totalBricks || 0),
          payments: rec.payments,
        },
      ])
      .select()
      .single();

    return data;
  },

  async updateSalaryPayment(id, payments) {
    await sb.from("salary_payments").update({ payments }).eq("id", id);
  },

  async addSupplier(s) {
    const { data } = await sb
      .from("suppliers")
      .insert([
        {
          name: s.name,
          contact: s.contact,
          material: s.material,
          price_per_unit: Number(s.pricePerUnit || 0),
          unit: s.unit,
          terms: s.terms,
          bills: [],
          payments: [],
        },
      ])
      .select()
      .single();

    return data;
  },

  async updateSupplier(id, fields) {
    await sb.from("suppliers").update(fields).eq("id", id);
  },

  async deleteSupplier(id) {
    await sb.from("suppliers").delete().eq("id", id);
  },

  async addCustomer(c) {
    const { data } = await sb.from("customers").insert([c]).select().single();
    return data;
  },

  async updateCustomer(c) {
    await sb
      .from("customers")
      .update({
        name: c.name,
        contact: c.contact,
        location: c.location,
        note: c.note,
      })
      .eq("id", c.id);
  },

  async deleteCustomer(id) {
    await sb.from("customers").delete().eq("id", id);
  },

  async addSale(s) {
    const { data } = await sb
      .from("sales")
      .insert([
        {
          date: s.date,
          customer: s.customer,
          brick_type: s.brickType,
          qty: Number(s.qty || 0),
          price_per_brick: Number(s.pricePerBrick || 0),
          total_amount: Number(s.totalAmount || 0),
          location: s.location,
          note: s.note,
          payments: [],
        },
      ])
      .select()
      .single();

    return data;
  },

  async updateSale(id, fields) {
    await sb.from("sales").update(fields).eq("id", id);
  },

  async deleteSale(id) {
    await sb.from("sales").delete().eq("id", id);
  },

  async addExpense(e) {
    const { data } = await sb
      .from("expenses")
      .insert([
        {
          date: e.date,
          category: e.category,
          description: e.description,
          amount: Number(e.amount || 0),
        },
      ])
      .select()
      .single();

    return data;
  },

  async updateExpense(e) {
    await sb
      .from("expenses")
      .update({
        date: e.date,
        category: e.category,
        description: e.description,
        amount: Number(e.amount || 0),
      })
      .eq("id", e.id);
  },

  async deleteExpense(id) {
    await sb.from("expenses").delete().eq("id", id);
  },
};

// ── SAVING INDICATOR ──────────────────────────────────────────────────────────
function useSaving() {
  const [saving, setSaving] = useState(false);

  const save = async (fn) => {
    setSaving(true);
    try {
      await fn();
    } finally {
      setSaving(false);
    }
  };

  return { saving, save };
}
// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ data }) {
  const totalRev = data.sales.reduce((a, s) => a + Number(s.total_amount || 0), 0);
  const totalOut = data.sales.reduce((a, s) => a + saleDue(s), 0);
  const totalStock = Object.values(data.inventory).reduce((a, v) => a + Number(v || 0), 0);

  const lowRM = data.rawMaterials.filter((r) => Number(r.stock || 0) <= Number(r.reorder || 0));
  const tod = today();

  const todProd = data.production
    .filter((p) => p.date === tod)
    .reduce((a, p) => a + Number(p.qty || 0), 0);

  const thisWk = weekOf(tod);

  const wkProd = data.production
    .filter((p) => weekOf(p.date) === thisWk)
    .reduce((a, p) => a + Number(p.qty || 0), 0);

  const readyNow = data.production.filter(
    (p) => !p.added_to_stock && addDays(p.date, 5) <= tod
  );

  const monthly = MONTHS.map((m, i) => ({
    month: m,
    revenue: data.sales
      .filter((s) => new Date(s.date).getMonth() === i)
      .reduce((a, s) => a + Number(s.total_amount || 0), 0),
    expenses: data.expenses
      .filter((e) => new Date(e.date).getMonth() === i)
      .reduce((a, e) => a + Number(e.amount || 0), 0),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <G2>
        <Stat label="TOTAL REVENUE" value={fmt(totalRev)} color={T.green} icon="💰" />
        <Stat label="OUTSTANDING" value={fmt(totalOut)} color={T.red} icon="⏳" sub="To collect" />
        <Stat
          label="TODAY PRODUCTION"
          value={fmtN(todProd) + " bricks"}
          color={T.accent}
          icon="🏭"
          sub={"Week: " + fmtN(wkProd)}
        />
        <Stat label="TOTAL STOCK" value={fmtN(totalStock)} color={T.cyan} icon="🧱" sub="All 4 types" />
      </G2>

      {(lowRM.length > 0 || readyNow.length > 0) && (
        <Card style={{ borderColor: T.yellow + "55", background: T.yellow + "08" }}>
          <div style={{ fontWeight: 700, color: T.yellow, marginBottom: 8 }}>⚠️ Alerts</div>

          {lowRM.map((r) => (
            <div key={r.id} style={{ fontSize: 13, color: T.text, marginBottom: 4 }}>
              Low stock: <b>{r.name}</b> — {r.stock || 0} {r.unit} left
            </div>
          ))}

          {readyNow.length > 0 && (
            <div style={{ fontSize: 13, color: T.green }}>
              {readyNow.length} batch(es) curing done — go to Production to add to stock
            </div>
          )}
        </Card>
      )}

      <Card>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 10 }}>
          Monthly Revenue vs Expenses
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis tick={{ fill: T.muted, fontSize: 9 }} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip
              formatter={(v) => fmt(v)}
              contentStyle={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
              }}
            />
            <Bar dataKey="revenue" fill={T.green} radius={[3, 3, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill={T.red} radius={[3, 3, 0, 0]} name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 10 }}>Live Stock</div>

        {BRICKS.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ color: b.color, fontWeight: 600 }}>{b.label} Brick</span>
            <span style={{ color: T.text, fontWeight: 800 }}>
              {fmtN(data.inventory[b.id] || 0)}{" "}
              <span style={{ color: T.muted, fontSize: 11 }}>pcs</span>
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── PRODUCTION ────────────────────────────────────────────────────────────────
function Production({ data, reload }) {
  const { saving, save } = useSaving();

  const [sub, setSub] = useState("Daily Log");
  const [showAdd, setAdd] = useState(false);
  const [showOut, setOut] = useState(false);
  const [editEntry, setEE] = useState(null);

  const blank = () => ({
    date: today(),
    brickType: "4inch",
    qty: "",
    rejections: "0",
    Flyash: "",
    Cement: "",
    Sand: "",
    Lime: "",
  });

  const [form, setForm] = useState(blank());
  const [soForm, setSO] = useState({
    materialId: "",
    qty: "",
    reason: "",
    date: today(),
  });

  const fv = (v) => setForm((p) => ({ ...p, ...v }));

  const submitAdd = async () => {
    if (!form.date || !form.brickType || form.qty === "") return;

    const mats = {
      Flyash: Number(form.Flyash || 0),
      Cement: Number(form.Cement || 0),
      Sand: Number(form.Sand || 0),
      Lime: Number(form.Lime || 0),
    };

    await save(async () => {
      await DB.addProduction({
        date: form.date,
        brickType: form.brickType,
        qty: Number(form.qty || 0),
        rejections: Number(form.rejections || 0),
        materials: mats,
      });

      for (const rm of data.rawMaterials) {
        if (mats[rm.name] > 0) {
          await DB.updateRM(rm.id, Math.max(0, Number(rm.stock || 0) - mats[rm.name]));
        }
      }

      await reload();
    });

    setAdd(false);
    setForm(blank());
  };

  const submitEdit = async () => {
    if (!editEntry) return;

    await save(async () => {
      await DB.updateProduction(editEntry.id, {
        date: editEntry.date,
        brick_type: editEntry.brick_type,
        qty: Number(editEntry.qty || 0),
        rejections: Number(editEntry.rejections || 0),
        materials: editEntry.materials || {},
      });

      await reload();
    });

    setEE(null);
  };

  const delEntry = async (id) => {
    if (!window.confirm("Delete this entry?")) return;

    await save(async () => {
      await DB.deleteProduction(id);
      await reload();
    });
  };

  const addToStock = async (p) => {
    const net = Number(p.qty || 0) - Number(p.rejections || 0);

    await save(async () => {
      await DB.updateProduction(p.id, { added_to_stock: true });
      await DB.updateInventory(p.brick_type, Number(data.inventory[p.brick_type] || 0) + net);
      await reload();
    });
  };

  const submitStockOut = async () => {
    if (!soForm.materialId || !soForm.qty) return;

    const rm = data.rawMaterials.find((r) => r.id === Number(soForm.materialId));
    if (!rm) return;

    await save(async () => {
      await DB.updateRM(rm.id, Math.max(0, Number(rm.stock || 0) - Number(soForm.qty || 0)));
      await reload();
    });

    setOut(false);
    setSO({ materialId: "", qty: "", reason: "", date: today() });
  };

  const sorted = data.production || [];

  const byWeek = {};
  sorted.forEach((p) => {
    const w = weekOf(p.date);
    if (!byWeek[w]) byWeek[w] = [];
    byWeek[w].push(p);
  });

  const todProd = sorted
    .filter((p) => p.date === today())
    .reduce((a, p) => a + Number(p.qty || 0), 0);

  const wkLabel = weekOf(today());

  const wkProd = sorted
    .filter((p) => weekOf(p.date) === wkLabel)
    .reduce((a, p) => a + Number(p.qty || 0), 0);

  const readyNow = sorted.filter((p) => !p.added_to_stock && addDays(p.date, 5) <= today());

  const matTotals = RM_LIST.reduce(
    (acc, m) => ({
      ...acc,
      [m]: sorted.reduce((a, p) => a + Number(p.materials?.[m] || 0), 0),
    }),
    {}
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH
        title="🏭 Production"
        action={
          <>
            {saving && <span style={{ fontSize: 11, color: T.muted }}>Saving…</span>}
            <Btn sm outline color={T.red} onClick={() => setOut(true)}>
              Stock Out
            </Btn>
            <Btn
              sm
              onClick={() => {
                setForm(blank());
                setAdd(true);
              }}
            >
              + Add Day
            </Btn>
          </>
        }
      />

      <G2>
        <Stat label="TODAY" value={fmtN(todProd) + " bricks"} color={T.accent} icon="📅" />
        <Stat label="THIS WEEK" value={fmtN(wkProd) + " bricks"} color={T.green} icon="📆" />
      </G2>

      {readyNow.length > 0 && (
        <Card style={{ borderColor: T.green + "55", background: T.green + "08" }}>
          <div style={{ fontWeight: 700, color: T.green, marginBottom: 8 }}>
            Curing Done — Ready to Add to Stock
          </div>

          {readyNow.map((p) => {
            const br = BRICKS.find((b) => b.id === p.brick_type);

            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, color: T.text }}>
                  {p.date} · <span style={{ color: br?.color }}>{br?.label}</span> ·{" "}
                  {fmtN(Number(p.qty || 0) - Number(p.rejections || 0))} bricks
                </span>
                <Btn sm color={T.green} onClick={() => addToStock(p)}>
                  Add to Stock →
                </Btn>
              </div>
            );
          })}
        </Card>
      )}

      <Tabs tabs={["Daily Log", "Weekly View", "Materials Used"]} active={sub} onChange={setSub} />

      {sub === "Daily Log" &&
        sorted.map((p) => {
          const br = BRICKS.find((b) => b.id === p.brick_type);
          const net = Number(p.qty || 0) - Number(p.rejections || 0);
          const rdy = addDays(p.date, 5);
          const isRdy = rdy <= today();
          const isEdit = editEntry?.id === p.id;

          return (
            <Card
              key={p.id}
              style={{
                borderColor: p.added_to_stock ? T.green + "33" : isRdy ? T.cyan + "44" : T.border,
              }}
            >
              {isEdit ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: T.accent, marginBottom: 4 }}>
                    Edit — {p.date}
                  </div>

                  <G2>
                    <Inp
                      label="Date"
                      type="date"
                      value={editEntry.date}
                      onChange={(v) => setEE((e) => ({ ...e, date: v }))}
                    />
                    <Inp
                      label="Brick Type"
                      value={editEntry.brick_type}
                      onChange={(v) => setEE((e) => ({ ...e, brick_type: v }))}
                      options={BRICKS.map((b) => ({ value: b.id, label: b.label + " Brick" }))}
                    />
                  </G2>

                  <G2>
                    <Inp
                      label="Produced"
                      type="number"
                      value={editEntry.qty}
                      onChange={(v) => setEE((e) => ({ ...e, qty: Number(v || 0) }))}
                    />
                    <Inp
                      label="Rejections"
                      type="number"
                      value={editEntry.rejections}
                      onChange={(v) => setEE((e) => ({ ...e, rejections: Number(v || 0) }))}
                    />
                  </G2>

                  <div style={{ background: T.surface, borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginBottom: 8 }}>
                      Materials Used
                    </div>
                    <G2>
                      {RM_LIST.map((m) => (
                        <Inp
                          key={m}
                          label={m + " (" + RM_UNITS[m] + ")"}
                          type="number"
                          value={editEntry.materials?.[m] || 0}
                          onChange={(v) =>
                            setEE((e) => ({
                              ...e,
                              materials: {
                                ...(e.materials || {}),
                                [m]: Number(v || 0),
                              },
                            }))
                          }
                          sm
                        />
                      ))}
                    </G2>
                  </div>

                  <Row>
                    <Btn sm color={T.green} onClick={submitEdit}>
                      Save
                    </Btn>
                    <Btn sm outline onClick={() => setEE(null)}>
                      Cancel
                    </Btn>
                  </Row>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <Row gap={8}>
                      <span style={{ fontWeight: 700, color: T.text }}>{p.date}</span>
                      <Badge color={br?.color}>{br?.label}</Badge>

                      {p.added_to_stock ? (
                        <Badge color={T.green}>In Stock ✓</Badge>
                      ) : isRdy ? (
                        <Badge color={T.cyan}>Ready</Badge>
                      ) : (
                        <Badge color={T.yellow}>Curing till {rdy}</Badge>
                      )}
                    </Row>

                    <Row gap={5}>
                      <IBtn label="Edit" onClick={() => setEE({ ...p, materials: { ...(p.materials || {}) } })} />
                      <IBtn label="Delete" onClick={() => delEntry(p.id)} danger />
                    </Row>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[
                      ["PRODUCED", Number(p.qty || 0), T.text],
                      ["REJECTED", Number(p.rejections || 0), T.red],
                      ["NET GOOD", net, T.green],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ background: T.surface, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 9, color: T.muted }}>{l}</div>
                        <div style={{ fontWeight: 900, color: c, fontSize: 18 }}>{fmtN(v)}</div>
                      </div>
                    ))}
                  </div>

                  {p.materials && Object.values(p.materials).some((v) => Number(v || 0) > 0) && (
                    <div>
                      <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>Materials used:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {RM_LIST.map(
                          (m) =>
                            Number(p.materials[m] || 0) > 0 && (
                              <div
                                key={m}
                                style={{
                                  background: T.surface,
                                  borderRadius: 6,
                                  padding: "3px 9px",
                                  fontSize: 12,
                                }}
                              >
                                <span style={{ color: T.muted }}>{m}: </span>
                                <span style={{ color: T.accent, fontWeight: 700 }}>
                                  {p.materials[m]} {RM_UNITS[m]}
                                </span>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  {!p.added_to_stock && isRdy && (
                    <div style={{ marginTop: 10 }}>
                      <Btn sm color={T.green} onClick={() => addToStock(p)}>
                        Add {fmtN(net)} bricks to Inventory
                      </Btn>
                    </div>
                  )}
                </>
              )}
            </Card>
          );
        })}

      {sub === "Weekly View" &&
        Object.entries(byWeek).map(([week, entries]) => {
          const wQ = entries.reduce((a, p) => a + Number(p.qty || 0), 0);
          const wN = entries.reduce((a, p) => a + Number(p.qty || 0) - Number(p.rejections || 0), 0);
          const wR = entries.reduce((a, p) => a + Number(p.rejections || 0), 0);

          return (
            <Card key={week}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: T.accent }}>Week: {week}</div>
                <div style={{ fontWeight: 900, color: T.text, fontSize: 20 }}>
                  {fmtN(wQ)} <span style={{ fontSize: 12, color: T.muted }}>bricks</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  ["PRODUCED", wQ, T.text],
                  ["REJECTED", wR, T.red],
                  ["NET GOOD", wN, T.green],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: T.surface, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: T.muted }}>{l}</div>
                    <div style={{ fontWeight: 800, color: c, fontSize: 16 }}>{fmtN(v)}</div>
                  </div>
                ))}
              </div>

              {entries.map((p) => {
                const br = BRICKS.find((b) => b.id === p.brick_type);

                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      padding: "5px 0",
                      borderTop: `1px solid ${T.border}`,
                    }}
                  >
                    <span style={{ color: T.muted }}>{p.date}</span>
                    <Badge color={br?.color}>{br?.label}</Badge>
                    <span style={{ color: T.text, fontWeight: 600 }}>{fmtN(p.qty || 0)} bricks</span>
                    <span style={{ color: T.green }}>
                      {fmtN(Number(p.qty || 0) - Number(p.rejections || 0))} net
                    </span>
                  </div>
                );
              })}
            </Card>
          );
        })}

      {sub === "Materials Used" && (
        <>
          <Card>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Total Consumed — All Time</div>

            <G2>
              {data.rawMaterials.map((r) => (
                <div key={r.id} style={{ background: T.surface, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: T.muted }}>{r.name}</div>
                  <div style={{ fontWeight: 800, color: T.accent, fontSize: 20 }}>
                    {matTotals[r.name] || 0} <span style={{ fontSize: 11, color: T.muted }}>{r.unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    Stock left: {r.stock || 0} {r.unit}
                  </div>
                </div>
              ))}
            </G2>
          </Card>
        </>
      )}

      {showAdd && (
        <Modal title="Add Daily Production" onClose={() => setAdd(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <G2>
              <Inp label="Date" type="date" value={form.date} onChange={(v) => fv({ date: v })} />
              <Inp
                label="Brick Type"
                value={form.brickType}
                onChange={(v) => fv({ brickType: v })}
                options={BRICKS.map((b) => ({ value: b.id, label: b.label + " Brick" }))}
              />
            </G2>

            <G2>
              <Inp label="Bricks Produced" type="number" value={form.qty} onChange={(v) => fv({ qty: v })} />
              <Inp
                label="Rejections"
                type="number"
                value={form.rejections}
                onChange={(v) => fv({ rejections: v })}
              />
            </G2>

            <div style={{ background: T.surface, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 10 }}>
                Raw Materials Used Today
              </div>

              <G2>
                {data.rawMaterials.map((r) => (
                  <Inp
                    key={r.id}
                    label={r.name + " (" + r.unit + ")"}
                    type="number"
                    value={form[r.name]}
                    onChange={(v) => fv({ [r.name]: v })}
                    placeholder="0"
                    sm
                  />
                ))}
              </G2>
            </div>

            <div style={{ fontSize: 12, color: T.muted, background: T.surface, borderRadius: 8, padding: 8 }}>
              Ready after 5 days curing
            </div>

            <Btn onClick={submitAdd} color={T.accent}>
              {saving ? "Saving…" : "Save Production Entry"}
            </Btn>
          </div>
        </Modal>
      )}

      {showOut && (
        <Modal title="Stock Out" onClose={() => setOut(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: T.muted }}>
              Remove raw material manually, such as loss, spillage, or correction.
            </div>

            <Inp
              label="Material"
              value={soForm.materialId}
              onChange={(v) => setSO((f) => ({ ...f, materialId: v }))}
              options={data.rawMaterials.map((r) => ({ value: String(r.id), label: r.name }))}
            />

            <Inp
              label="Quantity to Remove"
              type="number"
              value={soForm.qty}
              onChange={(v) => setSO((f) => ({ ...f, qty: v }))}
            />

            <Inp
              label="Reason (optional)"
              value={soForm.reason}
              onChange={(v) => setSO((f) => ({ ...f, reason: v }))}
            />

            <Btn onClick={submitStockOut} color={T.red}>
              {saving ? "Saving…" : "Remove from Stock"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
// ── SALARIES ──────────────────────────────────────────────────────────────────
function Salaries({ data, reload }) {
  const { saving, save } = useSaving();

  const [sub, setSub] = useState("This Week");
  const [showAddW, setAddW] = useState(false);
  const [editW, setEditW] = useState(null);
  const [payModal, setPay] = useState(null);
  const [editPayId, setEPI] = useState(null);
  const [wForm, setWF] = useState({ name: "", role: "", ratePerBrick: "" });

  const calc = (worker, bricks) =>
    Math.round(Number(worker.rate_per_brick || 0) * Number(bricks || 0));

  const prodByWeek = {};
  data.production.forEach((p) => {
    const w = weekOf(p.date);
    prodByWeek[w] = (prodByWeek[w] || 0) + Number(p.qty || 0);
  });

  const thisWk = weekOf(today());
  const thisWkBricks = prodByWeek[thisWk] || 0;

  const totalPaid = data.salaryPayments.reduce(
    (a, w) => a + (w.payments || []).reduce((b, p) => b + Number(p.paid || 0), 0),
    0
  );

  const openPay = (weekLabel, bricks) => {
    const wa = {};
    data.workers.forEach((w) => {
      wa[w.id] = String(calc(w, bricks));
    });
    setPay({ weekLabel, bricks, wa });
  };

  const submitPay = async () => {
    if (!payModal) return;

    const payments = data.workers.map((w) => ({
      workerId: w.id,
      rate: Number(w.rate_per_brick || 0),
      earned: calc(w, payModal.bricks),
      paid: Number(payModal.wa[w.id] || 0),
    }));

    await save(async () => {
      await DB.addSalaryPayment({
        weekLabel: payModal.weekLabel,
        totalBricks: payModal.bricks,
        payments,
      });
      await reload();
    });

    setPay(null);
  };

  const addWorker = async () => {
    if (!wForm.name) return;

    await save(async () => {
      await DB.addWorker({
        name: wForm.name,
        role: wForm.role,
        ratePerBrick: Number(wForm.ratePerBrick || 0),
      });
      await reload();
    });

    setAddW(false);
    setWF({ name: "", role: "", ratePerBrick: "" });
  };

  const saveEditW = async () => {
    await save(async () => {
      await DB.updateWorker({
        ...editW,
        ratePerBrick: Number(editW.rate_per_brick || 0),
      });
      await reload();
    });

    setEditW(null);
  };

  const delWorker = async (id) => {
    if (!window.confirm("Remove this worker?")) return;

    await save(async () => {
      await DB.deleteWorker(id);
      await reload();
    });
  };

  const updatePaid = async (weekId, payments) => {
    await save(async () => {
      await DB.updateSalaryPayment(weekId, payments);
      await reload();
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH
        title="👷 Salaries"
        action={
          <>
            {saving && <span style={{ fontSize: 11, color: T.muted }}>Saving…</span>}
            <Btn sm onClick={() => setAddW(true)}>
              + Worker
            </Btn>
          </>
        }
      />

      <Stat
        label="TOTAL SALARY PAID"
        value={fmt(totalPaid)}
        color={T.blue}
        icon="💵"
        sub={data.salaryPayments.length + " weeks recorded"}
      />

      <Tabs tabs={["This Week", "Workers", "History"]} active={sub} onChange={setSub} />

      {sub === "This Week" && (
        <>
          <Card style={{ borderColor: T.accent + "44" }}>
            <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Week: {thisWk}</div>

            <G2 gap={10}>
              <Stat label="BRICKS THIS WEEK" value={fmtN(thisWkBricks)} color={T.accent} icon="🧱" />
              <Stat
                label="TOTAL TO PAY"
                value={fmt(data.workers.reduce((a, w) => a + calc(w, thisWkBricks), 0))}
                color={T.green}
                icon="💵"
              />
            </G2>

            <div style={{ marginTop: 14 }}>
              {data.workers.length === 0 && (
                <div style={{ color: T.muted, fontSize: 13 }}>
                  No workers added yet. Tap “+ Worker” to start.
                </div>
              )}

              {data.workers.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: T.text }}>{w.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>
                      {w.role || "Worker"} · ₹{Number(w.rate_per_brick || 0)}/brick
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, color: T.green }}>{fmt(calc(w, thisWkBricks))}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {fmtN(thisWkBricks)} × ₹{Number(w.rate_per_brick || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data.workers.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Btn color={T.green} onClick={() => openPay(thisWk, thisWkBricks)}>
                  Record This Week's Payment
                </Btn>
              </div>
            )}
          </Card>

          {Object.entries(prodByWeek)
            .filter(([w]) => w !== thisWk && !data.salaryPayments.find((s) => s.week_label === w))
            .map(([week, bricks]) => (
              <Card key={week} style={{ borderColor: T.yellow + "44" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.yellow }}>Unpaid: {week}</div>
                    <div style={{ fontSize: 13, color: T.muted }}>
                      {fmtN(bricks)} bricks · Est.{" "}
                      {fmt(data.workers.reduce((a, w) => a + calc(w, bricks), 0))}
                    </div>
                  </div>
                  <Btn sm color={T.yellow} onClick={() => openPay(week, bricks)}>
                    Pay Now
                  </Btn>
                </div>
              </Card>
            ))}
        </>
      )}

      {sub === "Workers" &&
        data.workers.map((w) => (
          <Card key={w.id}>
            {editW?.id === w.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Inp label="Name" value={editW.name} onChange={(v) => setEditW((e) => ({ ...e, name: v }))} />
                <Inp
                  label="Role"
                  value={editW.role}
                  onChange={(v) => setEditW((e) => ({ ...e, role: v }))}
                  options={WORKER_ROLES}
                />
                <Inp
                  label="Rate Per Brick (₹)"
                  type="number"
                  value={editW.rate_per_brick}
                  onChange={(v) => setEditW((e) => ({ ...e, rate_per_brick: Number(v || 0) }))}
                />
                <Row>
                  <Btn sm color={T.green} onClick={saveEditW}>
                    Save
                  </Btn>
                  <Btn sm outline onClick={() => setEditW(null)}>
                    Cancel
                  </Btn>
                </Row>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: T.text }}>{w.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{w.role || "Worker"}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Rate:{" "}
                    <span style={{ color: T.accent, fontWeight: 700 }}>
                      ₹{Number(w.rate_per_brick || 0)}/brick
                    </span>{" "}
                    · This week:{" "}
                    <span style={{ color: T.green, fontWeight: 600 }}>{fmt(calc(w, thisWkBricks))}</span>
                  </div>
                </div>

                <Row gap={5}>
                  <IBtn label="Edit" onClick={() => setEditW({ ...w })} />
                  <IBtn label="Delete" onClick={() => delWorker(w.id)} danger />
                </Row>
              </div>
            )}
          </Card>
        ))}

      {sub === "Workers" && data.workers.length === 0 && (
        <Card>
          <div style={{ color: T.muted, fontSize: 13 }}>No workers added yet.</div>
        </Card>
      )}

      {sub === "History" &&
        data.salaryPayments.map((week) => {
          const totalP = (week.payments || []).reduce((a, p) => a + Number(p.paid || 0), 0);
          const totalE = (week.payments || []).reduce((a, p) => a + Number(p.earned || 0), 0);
          const isEdit = editPayId === week.id;

          return (
            <Card key={week.id}>
              {isEdit ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontWeight: 700, color: T.accent, marginBottom: 4 }}>
                    Edit: {week.week_label}
                  </div>

                  {(week.payments || []).map((p, i) => {
                    const w = data.workers.find((x) => x.id === p.workerId);

                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: T.text, fontSize: 13, minWidth: 70 }}>{w?.name || "Worker"}</span>
                        <span style={{ fontSize: 11, color: T.muted }}>Earned {fmt(p.earned)}</span>
                        <div style={{ flex: 1 }}>
                          <Inp
                            type="number"
                            value={p.paid}
                            onChange={(v) => {
                              const newP = [...week.payments];
                              newP[i] = { ...p, paid: Number(v || 0) };
                              updatePaid(week.id, newP);
                            }}
                            sm
                          />
                        </div>
                      </div>
                    );
                  })}

                  <Btn sm color={T.green} onClick={() => setEPI(null)}>
                    Done
                  </Btn>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.accent }}>Week: {week.week_label}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{fmtN(week.total_bricks)} bricks</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: T.blue, fontSize: 18 }}>{fmt(totalP)}</div>
                      {totalP !== totalE && <div style={{ fontSize: 11, color: T.yellow }}>Earned: {fmt(totalE)}</div>}
                    </div>
                  </div>

                  {(week.payments || []).map((p, i) => {
                    const w = data.workers.find((x) => x.id === p.workerId);

                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: T.text }}>
                          {w?.name || "Worker"} <span style={{ color: T.muted }}>· ₹{p.rate}/brick</span>
                        </span>
                        <span style={{ color: T.green, fontWeight: 600 }}>
                          {fmt(p.paid)}
                          {p.paid !== p.earned && (
                            <span style={{ color: T.muted, fontSize: 11, marginLeft: 6 }}>
                              /{fmt(p.earned)}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  <div style={{ marginTop: 8 }}>
                    <IBtn label="Edit Payments" onClick={() => setEPI(week.id)} />
                  </div>
                </>
              )}
            </Card>
          );
        })}

      {sub === "History" && data.salaryPayments.length === 0 && (
        <Card>
          <div style={{ color: T.muted, fontSize: 13 }}>No salary payments recorded yet.</div>
        </Card>
      )}

      {showAddW && (
        <Modal title="+ Add Worker" onClose={() => setAddW(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp label="Worker Name" value={wForm.name} onChange={(v) => setWF((f) => ({ ...f, name: v }))} />
            <Inp
              label="Role"
              value={wForm.role}
              onChange={(v) => setWF((f) => ({ ...f, role: v }))}
              options={WORKER_ROLES}
            />
            <Inp
              label="Rate Per Brick (₹)"
              type="number"
              value={wForm.ratePerBrick}
              onChange={(v) => setWF((f) => ({ ...f, ratePerBrick: v }))}
              placeholder="0"
            />

            <div style={{ background: T.surface, borderRadius: 8, padding: 10, fontSize: 12, color: T.muted }}>
              Enter the worker's rate per brick. You can change this later.
            </div>

            <Btn onClick={addWorker}>{saving ? "Saving…" : "Add Worker"}</Btn>
          </div>
        </Modal>
      )}

      {payModal && (
        <Modal title="Record Weekly Salary" onClose={() => setPay(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: T.surface, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, color: T.muted }}>Week</div>
              <div style={{ fontWeight: 700, color: T.text }}>{payModal.weekLabel}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                Bricks: <span style={{ color: T.accent, fontWeight: 700 }}>{fmtN(payModal.bricks)}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>
              Auto-calculated — edit if different.
            </div>

            {data.workers.map((w) => (
              <div key={w.id}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>
                  {w.name} ({w.role || "Worker"}) · ₹{Number(w.rate_per_brick || 0)}/brick · Earned:{" "}
                  {fmt(calc(w, payModal.bricks))}
                </div>
                <Inp
                  type="number"
                  value={payModal.wa[w.id] || ""}
                  onChange={(v) => setPay((p) => ({ ...p, wa: { ...p.wa, [w.id]: v } }))}
                />
              </div>
            ))}

            <div style={{ background: T.green + "18", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: T.muted }}>Total Paying</span>
              <span style={{ color: T.green, fontWeight: 900, fontSize: 18 }}>
                {fmt(Object.values(payModal.wa).reduce((a, v) => a + Number(v || 0), 0))}
              </span>
            </div>

            <Btn onClick={submitPay} color={T.green}>
              {saving ? "Saving…" : "Confirm Payment"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── SALES & CUSTOMERS ─────────────────────────────────────────────────────────
function CustomersSales({ data, reload }) {
  const { saving, save } = useSaving();

  const [sub, setSub] = useState("Sales");
  const [showSaleM, setSaleM] = useState(false);
  const [showCustM, setCustM] = useState(false);
  const [editSale, setES] = useState(null);
  const [editCust, setEC] = useState(null);
  const [addPayTo, setAPT] = useState(null);
  const [editPay, setEP] = useState(null);
  const [filterMon, setFM] = useState("");

  const [sForm, setSF] = useState({
    date: today(),
    customer: "",
    brickType: "4inch",
    qty: "",
    pricePerBrick: "",
    location: "",
    note: "",
  });

  const [cForm, setCF] = useState({ name: "", contact: "", location: "", note: "" });
  const [payForm, setPF] = useState({ date: today(), amount: "", mode: "Cash", note: "" });
  const [ePF, setEPF] = useState({ date: "", amount: "", mode: "Cash", note: "" });

  const sf = (v) => setSF((p) => ({ ...p, ...v }));

  const submitSale = async () => {
    if (!sForm.date || !sForm.customer || sForm.qty === "" || sForm.pricePerBrick === "") return;

    const total = Number(sForm.qty || 0) * Number(sForm.pricePerBrick || 0);

    await save(async () => {
      await DB.addSale({
        ...sForm,
        qty: Number(sForm.qty || 0),
        pricePerBrick: Number(sForm.pricePerBrick || 0),
        totalAmount: total,
      });

      await DB.adjustInventory(
        sForm.brickType,
        -Number(sForm.qty || 0),
        data.inventory[sForm.brickType] || 0
      );

      await reload();
    });

    setSaleM(false);
    setSF({
      date: today(),
      customer: "",
      brickType: "4inch",
      qty: "",
      pricePerBrick: "",
      location: "",
      note: "",
    });
  };

  const saveSaleEdit = async () => {
    await save(async () => {
      await DB.updateSale(editSale.id, {
        date: editSale.date,
        customer: editSale.customer,
        brick_type: editSale.brick_type,
        qty: Number(editSale.qty || 0),
        price_per_brick: Number(editSale.price_per_brick || 0),
        total_amount: Number(editSale.total_amount || 0),
        location: editSale.location,
        note: editSale.note,
      });

      await reload();
    });

    setES(null);
  };

  const delSale = async (id) => {
    if (!window.confirm("Delete sale?")) return;

    await save(async () => {
      await DB.deleteSale(id);
      await reload();
    });
  };

  const submitPay = async () => {
    if (!payForm.amount || !payForm.date) return;

    const sale = data.sales.find((s) => s.id === addPayTo);
    if (!sale) return;

    const newPays = [
      ...(sale.payments || []),
      { id: Date.now(), ...payForm, amount: Number(payForm.amount || 0) },
    ];

    await save(async () => {
      await DB.updateSale(sale.id, { payments: newPays });
      await reload();
    });

    setAPT(null);
    setPF({ date: today(), amount: "", mode: "Cash", note: "" });
  };

  const saveEditPay = async () => {
    const { saleId, payId } = editPay;
    const sale = data.sales.find((s) => s.id === saleId);
    if (!sale) return;

    const newPays = (sale.payments || []).map((p) =>
      p.id === payId ? { ...p, ...ePF, amount: Number(ePF.amount || 0) } : p
    );

    await save(async () => {
      await DB.updateSale(saleId, { payments: newPays });
      await reload();
    });

    setEP(null);
  };

  const delPay = async (saleId, payId) => {
    const sale = data.sales.find((s) => s.id === saleId);
    if (!sale) return;

    const newPays = (sale.payments || []).filter((p) => p.id !== payId);

    await save(async () => {
      await DB.updateSale(saleId, { payments: newPays });
      await reload();
    });
  };

  const addCust = async () => {
    if (!cForm.name) return;

    await save(async () => {
      await DB.addCustomer(cForm);
      await reload();
    });

    setCustM(false);
    setCF({ name: "", contact: "", location: "", note: "" });
  };

  const saveEditCust = async () => {
    await save(async () => {
      await DB.updateCustomer(editCust);
      await reload();
    });

    setEC(null);
  };

  const delCust = async (id) => {
    if (!window.confirm("Delete customer?")) return;

    await save(async () => {
      await DB.deleteCustomer(id);
      await reload();
    });
  };

  const filtered = filterMon
    ? data.sales.filter((s) => new Date(s.date).getMonth() === Number(filterMon))
    : data.sales;

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const totalRev = data.sales.reduce((a, s) => a + Number(s.total_amount || 0), 0);
  const totalOut = data.sales.reduce((a, s) => a + saleDue(s), 0);

  const pcol = { Cash: T.green, UPI: T.blue, Cheque: T.purple, "Bank Transfer": T.cyan };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH
        title="💰 Sales & Customers"
        action={
          <>
            {saving && <span style={{ fontSize: 11, color: T.muted }}>Saving…</span>}
            <Btn sm outline onClick={() => setCustM(true)}>
              + Customer
            </Btn>
            <Btn sm onClick={() => setSaleM(true)}>
              + Sale
            </Btn>
          </>
        }
      />

      <G2>
        <Stat label="TOTAL REVENUE" value={fmt(totalRev)} color={T.green} icon="💰" />
        <Stat label="OUTSTANDING" value={fmt(totalOut)} color={T.red} icon="⏳" sub="To collect" />
      </G2>

      <Tabs tabs={["Sales", "By Customer", "Dues"]} active={sub} onChange={setSub} />

      {sub === "Sales" && (
        <>
          <Inp
            label="Filter by Month"
            value={filterMon}
            onChange={setFM}
            options={MONTHS.map((m, i) => ({ value: String(i), label: m }))}
          />

          {sorted.length === 0 && (
            <Card>
              <div style={{ color: T.muted, fontSize: 13 }}>No sales added yet.</div>
            </Card>
          )}

          {sorted.map((s) => {
            const br = BRICKS.find((b) => b.id === s.brick_type);
            const paid = (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
            const due = Number(s.total_amount || 0) - paid;
            const isEdit = editSale?.id === s.id;

            return (
              <Card key={s.id} style={{ borderColor: due > 0 ? T.yellow + "44" : T.green + "33" }}>
                {isEdit ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontWeight: 700, color: T.accent, marginBottom: 4 }}>Edit Sale</div>

                    <Inp label="Date" type="date" value={editSale.date} onChange={(v) => setES((e) => ({ ...e, date: v }))} />

                    <Inp
                      label="Customer"
                      value={editSale.customer}
                      onChange={(v) => setES((e) => ({ ...e, customer: v }))}
                      options={data.customers.map((c) => c.name)}
                    />

                    <Inp
                      label="Brick Type"
                      value={editSale.brick_type}
                      onChange={(v) => setES((e) => ({ ...e, brick_type: v }))}
                      options={BRICKS.map((b) => ({ value: b.id, label: b.label + " Brick" }))}
                    />

                    <G2>
                      <Inp label="Qty" type="number" value={editSale.qty} onChange={(v) => setES((e) => ({ ...e, qty: Number(v || 0) }))} />
                      <Inp label="Price/Brick (₹)" type="number" value={editSale.price_per_brick} onChange={(v) => setES((e) => ({ ...e, price_per_brick: Number(v || 0) }))} />
                    </G2>

                    <Inp label="Total Amount (₹) — override if needed" type="number" value={editSale.total_amount} onChange={(v) => setES((e) => ({ ...e, total_amount: Number(v || 0) }))} />
                    <Inp label="Location" value={editSale.location} onChange={(v) => setES((e) => ({ ...e, location: v }))} />
                    <Inp label="Note" value={editSale.note} onChange={(v) => setES((e) => ({ ...e, note: v }))} />

                    <Row>
                      <Btn sm color={T.green} onClick={saveSaleEdit}>Save</Btn>
                      <Btn sm outline onClick={() => setES(null)}>Cancel</Btn>
                    </Row>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: T.text }}>{s.customer}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{s.date}{s.location ? " · " + s.location : ""}</div>

                        <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                          <Badge color={br?.color}>{br?.label}</Badge>
                          <span style={{ fontSize: 13, color: T.muted }}>
                            {fmtN(s.qty)} bricks × ₹{Number(s.price_per_brick || 0)}
                          </span>
                        </div>

                        {s.note && <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>{s.note}</div>}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, color: T.green, fontSize: 20 }}>{fmt(s.total_amount)}</div>
                        {due > 0 ? (
                          <div style={{ color: T.red, fontWeight: 700, fontSize: 13 }}>Due: {fmt(due)}</div>
                        ) : (
                          <Badge color={T.green}>Paid ✓</Badge>
                        )}
                      </div>
                    </div>

                    {(s.payments || []).length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: T.muted, marginBottom: 5 }}>Payments received:</div>

                        {(s.payments || []).map((p) => (
                          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 5 }}>
                            {editPay?.saleId === s.id && editPay?.payId === p.id ? (
                              <div style={{ display: "flex", gap: 5, flex: 1, alignItems: "center", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: 90 }}>
                                  <Inp type="date" value={ePF.date} onChange={(v) => setEPF((f) => ({ ...f, date: v }))} sm />
                                </div>
                                <div style={{ flex: 1, minWidth: 80 }}>
                                  <Inp type="number" value={ePF.amount} onChange={(v) => setEPF((f) => ({ ...f, amount: v }))} sm />
                                </div>
                                <div style={{ flex: 1, minWidth: 90 }}>
                                  <Inp value={ePF.mode} onChange={(v) => setEPF((f) => ({ ...f, mode: v }))} options={PAY_MODES} sm />
                                </div>
                                <Btn sm color={T.green} onClick={saveEditPay}>✓</Btn>
                                <Btn sm outline onClick={() => setEP(null)}>✕</Btn>
                              </div>
                            ) : (
                              <>
                                <span style={{ color: T.text }}>
                                  {p.date} · <Badge color={pcol[p.mode] || T.muted}>{p.mode}</Badge>{p.note ? " · " + p.note : ""}
                                </span>

                                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                  <span style={{ color: T.green, fontWeight: 700 }}>+{fmt(p.amount)}</span>
                                  <IBtn label="Edit" onClick={() => { setEP({ saleId: s.id, payId: p.id }); setEPF({ date: p.date, amount: p.amount, mode: p.mode, note: p.note || "" }); }} />
                                  <IBtn label="Delete" onClick={() => delPay(s.id, p.id)} danger />
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Row>
                      <Btn sm color={T.blue} onClick={() => { setAPT(s.id); setPF({ date: today(), amount: String(Math.max(0, due)), mode: "Cash", note: "" }); }}>
                        + Add Payment
                      </Btn>
                      <IBtn label="Edit Sale" onClick={() => setES({ ...s })} />
                      <IBtn label="Delete" onClick={() => delSale(s.id)} danger />
                    </Row>
                  </>
                )}
              </Card>
            );
          })}
        </>
      )}

      {sub === "By Customer" &&
        data.customers.map((c) => {
          const cs = data.sales.filter((s) => s.customer === c.name);
          const totalB = cs.reduce((a, s) => a + Number(s.total_amount || 0), 0);
          const totalD = cs.reduce((a, s) => a + saleDue(s), 0);

          return (
            <Card key={c.id} style={{ borderColor: totalD > 0 ? T.yellow + "44" : T.border }}>
              {editCust?.id === c.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Inp label="Name" value={editCust.name} onChange={(v) => setEC((e) => ({ ...e, name: v }))} />
                  <Inp label="Phone" value={editCust.contact} onChange={(v) => setEC((e) => ({ ...e, contact: v }))} />
                  <Inp label="Location" value={editCust.location} onChange={(v) => setEC((e) => ({ ...e, location: v }))} />
                  <Inp label="Note" value={editCust.note} onChange={(v) => setEC((e) => ({ ...e, note: v }))} />
                  <Row>
                    <Btn sm color={T.green} onClick={saveEditCust}>Save</Btn>
                    <Btn sm outline onClick={() => setEC(null)}>Cancel</Btn>
                  </Row>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>
                        {c.contact ? c.contact + " · " : ""}{c.location}
                      </div>
                      {c.note && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{c.note}</div>}
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        Total: <span style={{ color: T.green, fontWeight: 700 }}>{fmt(totalB)}</span> · {cs.length} sale(s)
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {totalD > 0 ? (
                        <>
                          <div style={{ fontWeight: 900, color: T.red, fontSize: 18 }}>{fmt(totalD)}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>outstanding</div>
                        </>
                      ) : (
                        <Badge color={T.green}>Clear ✓</Badge>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                    <IBtn label="Edit" onClick={() => setEC({ ...c })} />
                    <IBtn label="Delete" onClick={() => delCust(c.id)} danger />
                  </div>
                </>
              )}
            </Card>
          );
        })}

      {sub === "By Customer" && data.customers.length === 0 && (
        <Card>
          <div style={{ color: T.muted, fontSize: 13 }}>No customers added yet.</div>
        </Card>
      )}

      {sub === "Dues" && (
        <>
          <div style={{ fontSize: 13, color: T.muted }}>All pending collections</div>

          {[...data.sales]
            .filter((s) => saleDue(s) > 0)
            .sort((a, b) => saleDue(b) - saleDue(a))
            .map((s) => {
              const br = BRICKS.find((b) => b.id === s.brick_type);
              const paid = (s.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
              const due = saleDue(s);

              return (
                <Card key={s.id} style={{ borderColor: T.red + "44" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.text }}>{s.customer}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{s.date}{s.location ? " · " + s.location : ""}</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        <Badge color={br?.color}>{br?.label}</Badge>{" "}
                        <span style={{ color: T.muted, marginLeft: 6 }}>{fmtN(s.qty)} bricks</span>
                      </div>
                      <div style={{ fontSize: 13, marginTop: 6 }}>
                        Sale: <span style={{ color: T.text, fontWeight: 600 }}>{fmt(s.total_amount)}</span> · Paid:{" "}
                        <span style={{ color: T.green, fontWeight: 600 }}>{fmt(paid)}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, color: T.red, fontSize: 22 }}>{fmt(due)}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>remaining</div>
                    </div>
                  </div>

                  {(s.payments || []).length > 0 && (
                    <>
                      <Hr />
                      {(s.payments || []).map((p) => (
                        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                          <span style={{ color: T.muted }}>
                            {p.date} · {p.mode}{p.note ? " · " + p.note : ""}
                          </span>
                          <span style={{ color: T.green, fontWeight: 600 }}>+{fmt(p.amount)}</span>
                        </div>
                      ))}
                    </>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <Btn sm color={T.blue} onClick={() => { setAPT(s.id); setPF({ date: today(), amount: String(due), mode: "Cash", note: "" }); setSub("Sales"); }}>
                      + Add Payment
                    </Btn>
                  </div>
                </Card>
              );
            })}

          {data.sales.filter((s) => saleDue(s) > 0).length === 0 && (
            <Card>
              <div style={{ textAlign: "center", color: T.green, fontWeight: 700, padding: 20 }}>
                No outstanding dues!
              </div>
            </Card>
          )}
        </>
      )}

      {showSaleM && (
        <Modal title="New Sale" onClose={() => setSaleM(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp label="Date" type="date" value={sForm.date} onChange={(v) => sf({ date: v })} />
            <Inp label="Customer" value={sForm.customer} onChange={(v) => sf({ customer: v })} options={data.customers.map((c) => c.name)} />
            <Inp label="Brick Type" value={sForm.brickType} onChange={(v) => sf({ brickType: v })} options={BRICKS.map((b) => ({ value: b.id, label: b.label + " Brick" }))} />

            <G2>
              <Inp label="Qty (bricks)" type="number" value={sForm.qty} onChange={(v) => sf({ qty: v })} />
              <Inp label="Price/Brick (₹)" type="number" value={sForm.pricePerBrick} onChange={(v) => sf({ pricePerBrick: v })} />
            </G2>

            {sForm.qty && sForm.pricePerBrick && (
              <div style={{ background: T.green + "18", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.muted }}>Total</span>
                <span style={{ color: T.green, fontWeight: 900, fontSize: 18 }}>
                  {fmt(Number(sForm.qty || 0) * Number(sForm.pricePerBrick || 0))}
                </span>
              </div>
            )}

            <Inp label="Location / City" value={sForm.location} onChange={(v) => sf({ location: v })} />
            <Inp label="Note (optional)" value={sForm.note} onChange={(v) => sf({ note: v })} />

            <div style={{ fontSize: 12, color: T.muted, background: T.surface, borderRadius: 8, padding: 8 }}>
              Add payments after saving — full, partial, or installments.
            </div>

            <Btn onClick={submitSale} color={T.green}>{saving ? "Saving…" : "Record Sale"}</Btn>
          </div>
        </Modal>
      )}

      {showCustM && (
        <Modal title="+ New Customer" onClose={() => setCustM(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp label="Customer Name" value={cForm.name} onChange={(v) => setCF((f) => ({ ...f, name: v }))} />
            <Inp label="Phone Number" value={cForm.contact} onChange={(v) => setCF((f) => ({ ...f, contact: v }))} />
            <Inp label="Location / City" value={cForm.location} onChange={(v) => setCF((f) => ({ ...f, location: v }))} />
            <Inp label="Note" value={cForm.note} onChange={(v) => setCF((f) => ({ ...f, note: v }))} />
            <Btn onClick={addCust}>{saving ? "Saving…" : "Add Customer"}</Btn>
          </div>
        </Modal>
      )}

      {addPayTo && (
        <Modal title="Add Payment" onClose={() => setAPT(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(() => {
              const s = data.sales.find((x) => x.id === addPayTo);
              const due = s ? saleDue(s) : 0;

              return (
                <div style={{ background: T.surface, borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    Customer: <b style={{ color: T.text }}>{s?.customer}</b>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    Sale Total: <b style={{ color: T.text }}>{fmt(s?.total_amount || 0)}</b>
                  </div>
                  <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>
                    Outstanding: {fmt(due)}
                  </div>
                </div>
              );
            })()}

            <Inp label="Date" type="date" value={payForm.date} onChange={(v) => setPF((f) => ({ ...f, date: v }))} />
            <Inp label="Amount Received (₹)" type="number" value={payForm.amount} onChange={(v) => setPF((f) => ({ ...f, amount: v }))} />
            <Inp label="Payment Mode" value={payForm.mode} onChange={(v) => setPF((f) => ({ ...f, mode: v }))} options={PAY_MODES} />
            <Inp label="Note (e.g. 1st installment)" value={payForm.note} onChange={(v) => setPF((f) => ({ ...f, note: v }))} />

            <Btn onClick={submitPay} color={T.blue}>{saving ? "Saving…" : "Save Payment"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
// ── SUPPLIERS ─────────────────────────────────────────────────────────────────
function Suppliers({ data, reload }) {
  const { saving, save } = useSaving();

  const [sel, setSel] = useState(null);
  const [showAdd, setAdd] = useState(false);
  const [showBill, setBill] = useState(false);
  const [showPay, setPay] = useState(false);
  const [editB, setEB] = useState(null);
  const [editP, setEP] = useState(null);
  const [editS, setES] = useState(null);

  const [sF, setSF] = useState({
    name: "",
    contact: "",
    material: "",
    pricePerUnit: "",
    unit: "",
    terms: "Cash",
  });

  const [bF, setBF] = useState({
    date: today(),
    qty: "",
    amount: "",
    note: "",
  });

  const [pF, setPF] = useState({
    date: today(),
    amount: "",
    mode: "Cash",
    note: "",
  });

  const addS = async () => {
    if (!sF.name) return;

    await save(async () => {
      await DB.addSupplier(sF);
      await reload();
    });

    setAdd(false);
    setSF({
      name: "",
      contact: "",
      material: "",
      pricePerUnit: "",
      unit: "",
      terms: "Cash",
    });
  };

  const saveES = async () => {
    await save(async () => {
      await DB.updateSupplier(editS.id, {
        name: editS.name,
        contact: editS.contact,
        material: editS.material,
        price_per_unit: Number(editS.price_per_unit || 0),
        unit: editS.unit,
        terms: editS.terms,
      });
      await reload();
    });

    setES(null);
  };

  const delS = async (id) => {
    if (!window.confirm("Delete supplier?")) return;

    await save(async () => {
      await DB.deleteSupplier(id);
      await reload();
    });

    setSel(null);
  };

  const withSup = (id, fn) => {
    const sup = data.suppliers.find((s) => s.id === id);
    if (!sup) return;
    return fn(sup);
  };

  const addBill = async () => {
    if (!bF.date || !bF.amount) return;

    await withSup(sel, async (sup) => {
      const bills = [
        ...(sup.bills || []),
        {
          id: Date.now(),
          ...bF,
          qty: Number(bF.qty || 0),
          amount: Number(bF.amount || 0),
        },
      ];

      await save(async () => {
        await DB.updateSupplier(sel, { bills });
        await reload();
      });
    });

    setBill(false);
    setBF({ date: today(), qty: "", amount: "", note: "" });
  };

  const saveEB = async () => {
    await withSup(sel, async (sup) => {
      const bills = (sup.bills || []).map((b) =>
        b.id === editB.id
          ? {
              ...editB,
              qty: Number(editB.qty || 0),
              amount: Number(editB.amount || 0),
            }
          : b
      );

      await save(async () => {
        await DB.updateSupplier(sel, { bills });
        await reload();
      });
    });

    setEB(null);
  };

  const delBill = async (id) => {
    await withSup(sel, async (sup) => {
      const bills = (sup.bills || []).filter((b) => b.id !== id);

      await save(async () => {
        await DB.updateSupplier(sel, { bills });
        await reload();
      });
    });
  };

  const addPay = async () => {
    if (!pF.date || !pF.amount) return;

    await withSup(sel, async (sup) => {
      const payments = [
        ...(sup.payments || []),
        {
          id: Date.now(),
          ...pF,
          amount: Number(pF.amount || 0),
        },
      ];

      await save(async () => {
        await DB.updateSupplier(sel, { payments });
        await reload();
      });
    });

    setPay(false);
    setPF({ date: today(), amount: "", mode: "Cash", note: "" });
  };

  const saveEP = async () => {
    await withSup(sel, async (sup) => {
      const payments = (sup.payments || []).map((p) =>
        p.id === editP.id
          ? {
              ...editP,
              amount: Number(editP.amount || 0),
            }
          : p
      );

      await save(async () => {
        await DB.updateSupplier(sel, { payments });
        await reload();
      });
    });

    setEP(null);
  };

  const delPay = async (id) => {
    await withSup(sel, async (sup) => {
      const payments = (sup.payments || []).filter((p) => p.id !== id);

      await save(async () => {
        await DB.updateSupplier(sel, { payments });
        await reload();
      });
    });
  };

  if (sel !== null) {
    const sup = data.suppliers.find((s) => s.id === sel);

    if (!sup) {
      setSel(null);
      return null;
    }

    const totalB = (sup.bills || []).reduce((a, b) => a + Number(b.amount || 0), 0);
    const totalP = (sup.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
    const balance = totalB - totalP;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => setSel(null)}
            style={{
              background: "none",
              border: "none",
              color: T.accent,
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ←
          </button>

          {editS?.id === sup.id ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <Inp value={editS.name} onChange={(v) => setES((e) => ({ ...e, name: v }))} placeholder="Name" />
              <Inp value={editS.contact} onChange={(v) => setES((e) => ({ ...e, contact: v }))} placeholder="Phone" />
              <Inp
                label="Material"
                value={editS.material}
                onChange={(v) => setES((e) => ({ ...e, material: v }))}
                options={RM_LIST}
              />
              <Inp
                label="Price/Unit (₹)"
                type="number"
                value={editS.price_per_unit}
                onChange={(v) => setES((e) => ({ ...e, price_per_unit: Number(v || 0) }))}
              />
              <Inp
                label="Unit"
                value={editS.unit}
                onChange={(v) => setES((e) => ({ ...e, unit: v }))}
                options={["Tonnes", "Bags", "Kg", "Litres"]}
              />
              <Inp
                label="Terms"
                value={editS.terms}
                onChange={(v) => setES((e) => ({ ...e, terms: v }))}
                options={["Cash", "Net 15", "Net 30", "Net 60"]}
              />

              <Row>
                <Btn sm color={T.green} onClick={saveES}>
                  Save
                </Btn>
                <Btn sm outline onClick={() => setES(null)}>
                  Cancel
                </Btn>
              </Row>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, color: T.text, fontSize: 18 }}>{sup.name}</h2>
                <div style={{ fontSize: 12, color: T.muted }}>{sup.contact}</div>
              </div>

              <Row gap={5}>
                <IBtn label="Edit" onClick={() => setES({ ...sup })} />
                <IBtn label="Delete" onClick={() => delS(sup.id)} danger />
              </Row>
            </div>
          )}
        </div>

        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              ["Material", sup.material],
              ["Rate", "₹" + Number(sup.price_per_unit || 0) + "/" + (sup.unit || "")],
              ["Terms", sup.terms],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                <div style={{ fontWeight: 600, color: T.text }}>{v}</div>
              </div>
            ))}
          </div>

          <Hr />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              ["BILLED", totalB, T.yellow],
              ["PAID", totalP, T.green],
              ["BALANCE", balance, balance > 0 ? T.red : T.green],
            ].map(([l, v, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T.muted }}>{l}</div>
                <div style={{ fontWeight: 800, color: c, fontSize: 18 }}>{fmt(v)}</div>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: T.text }}>Bills ({(sup.bills || []).length})</div>
          <Btn sm color={T.yellow} onClick={() => setBill(true)}>
            + Add Bill
          </Btn>
        </div>

        {[...(sup.bills || [])]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((b) => (
            <Card key={b.id} style={{ padding: "12px 14px" }}>
              {editB?.id === b.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Inp label="Date" type="date" value={editB.date} onChange={(v) => setEB((e) => ({ ...e, date: v }))} />
                  <Inp label="Qty" type="number" value={editB.qty} onChange={(v) => setEB((e) => ({ ...e, qty: Number(v || 0) }))} />
                  <Inp label="Amount (₹)" type="number" value={editB.amount} onChange={(v) => setEB((e) => ({ ...e, amount: Number(v || 0) }))} />
                  <Inp label="Note" value={editB.note} onChange={(v) => setEB((e) => ({ ...e, note: v }))} />
                  <Row>
                    <Btn sm color={T.green} onClick={saveEB}>Save</Btn>
                    <Btn sm outline onClick={() => setEB(null)}>Cancel</Btn>
                  </Row>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.text }}>{b.date}</div>
                    {Number(b.qty || 0) > 0 && (
                      <div style={{ fontSize: 12, color: T.muted }}>
                        {b.qty} {sup.unit} supplied
                      </div>
                    )}
                    {b.note && <div style={{ fontSize: 12, color: T.muted }}>{b.note}</div>}
                  </div>

                  <Row gap={5}>
                    <div style={{ fontWeight: 800, color: T.yellow, fontSize: 18 }}>{fmt(b.amount)}</div>
                    <IBtn label="Edit" onClick={() => setEB({ ...b })} />
                    <IBtn label="Delete" onClick={() => delBill(b.id)} danger />
                  </Row>
                </div>
              )}
            </Card>
          ))}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, color: T.text }}>Payments ({(sup.payments || []).length})</div>
          <Btn sm color={T.green} onClick={() => setPay(true)}>
            + Record Payment
          </Btn>
        </div>

        {[...(sup.payments || [])]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((p) => (
            <Card key={p.id} style={{ padding: "12px 14px" }}>
              {editP?.id === p.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Inp label="Date" type="date" value={editP.date} onChange={(v) => setEP((e) => ({ ...e, date: v }))} />
                  <Inp label="Amount (₹)" type="number" value={editP.amount} onChange={(v) => setEP((e) => ({ ...e, amount: Number(v || 0) }))} />
                  <Inp label="Mode" value={editP.mode} onChange={(v) => setEP((e) => ({ ...e, mode: v }))} options={PAY_MODES} />
                  <Inp label="Note" value={editP.note} onChange={(v) => setEP((e) => ({ ...e, note: v }))} />
                  <Row>
                    <Btn sm color={T.green} onClick={saveEP}>Save</Btn>
                    <Btn sm outline onClick={() => setEP(null)}>Cancel</Btn>
                  </Row>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: T.text }}>
                      {p.date} · <Badge color={T.blue}>{p.mode}</Badge>
                    </div>
                    {p.note && <div style={{ fontSize: 12, color: T.muted }}>{p.note}</div>}
                  </div>

                  <Row gap={5}>
                    <div style={{ fontWeight: 800, color: T.green, fontSize: 18 }}>{fmt(p.amount)}</div>
                    <IBtn label="Edit" onClick={() => setEP({ ...p })} />
                    <IBtn label="Delete" onClick={() => delPay(p.id)} danger />
                  </Row>
                </div>
              )}
            </Card>
          ))}

        {showBill && (
          <Modal title="Add Bill" onClose={() => setBill(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Inp label="Date" type="date" value={bF.date} onChange={(v) => setBF((f) => ({ ...f, date: v }))} />
              <Inp label={"Qty (" + (sup.unit || "units") + ")"} type="number" value={bF.qty} onChange={(v) => setBF((f) => ({ ...f, qty: v }))} />
              <Inp label="Bill Amount (₹)" type="number" value={bF.amount} onChange={(v) => setBF((f) => ({ ...f, amount: v }))} />
              <Inp label="Note" value={bF.note} onChange={(v) => setBF((f) => ({ ...f, note: v }))} />
              <Btn onClick={addBill} color={T.yellow}>{saving ? "Saving…" : "Add Bill"}</Btn>
            </div>
          </Modal>
        )}

        {showPay && (
          <Modal title="Record Payment" onClose={() => setPay(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: T.surface, borderRadius: 8, padding: 10, color: T.red, fontWeight: 700 }}>
                Balance due: {fmt(balance)}
              </div>
              <Inp label="Date" type="date" value={pF.date} onChange={(v) => setPF((f) => ({ ...f, date: v }))} />
              <Inp label="Amount (₹)" type="number" value={pF.amount} onChange={(v) => setPF((f) => ({ ...f, amount: v }))} />
              <Inp label="Mode" value={pF.mode} onChange={(v) => setPF((f) => ({ ...f, mode: v }))} options={PAY_MODES} />
              <Inp label="Note" value={pF.note} onChange={(v) => setPF((f) => ({ ...f, note: v }))} />
              <Btn onClick={addPay} color={T.green}>{saving ? "Saving…" : "Confirm Payment"}</Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH title="🚛 Suppliers" action={<Btn sm onClick={() => setAdd(true)}>+ Add Supplier</Btn>} />

      <div style={{ fontSize: 13, color: T.muted }}>Tap a supplier to view bills & payment history</div>

      {data.suppliers.length === 0 && (
        <Card>
          <div style={{ color: T.muted, fontSize: 13 }}>No suppliers added yet.</div>
        </Card>
      )}

      {data.suppliers.map((s) => {
        const bal = supOwed(s);

        return (
          <Card key={s.id} onClick={() => setSel(s.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 15 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>
                  {s.contact} · {s.material} · {s.terms}
                </div>
                <div style={{ fontSize: 13, marginTop: 5 }}>
                  Rate:{" "}
                  <span style={{ color: T.accent, fontWeight: 600 }}>
                    ₹{Number(s.price_per_unit || 0)}/{s.unit}
                  </span>
                  <span style={{ color: T.muted, marginLeft: 10 }}>{(s.bills || []).length} bills</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                {bal > 0 ? (
                  <>
                    <div style={{ fontWeight: 900, color: T.red, fontSize: 18 }}>{fmt(bal)}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>we owe</div>
                  </>
                ) : (
                  <Badge color={T.green}>Settled ✓</Badge>
                )}
                <div style={{ color: T.muted, fontSize: 11, marginTop: 4 }}>Tap to open →</div>
              </div>
            </div>
          </Card>
        );
      })}

      {showAdd && (
        <Modal title="+ New Supplier" onClose={() => setAdd(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp label="Supplier Name" value={sF.name} onChange={(v) => setSF((f) => ({ ...f, name: v }))} />
            <Inp label="Phone" value={sF.contact} onChange={(v) => setSF((f) => ({ ...f, contact: v }))} />
            <Inp label="Material" value={sF.material} onChange={(v) => setSF((f) => ({ ...f, material: v }))} options={RM_LIST} />
            <Inp label="Price Per Unit (₹)" type="number" value={sF.pricePerUnit} onChange={(v) => setSF((f) => ({ ...f, pricePerUnit: v }))} />
            <Inp label="Unit" value={sF.unit} onChange={(v) => setSF((f) => ({ ...f, unit: v }))} options={["Tonnes", "Bags", "Kg", "Litres"]} />
            <Inp label="Payment Terms" value={sF.terms} onChange={(v) => setSF((f) => ({ ...f, terms: v }))} options={["Cash", "Net 15", "Net 30", "Net 60"]} />
            <Btn onClick={addS}>{saving ? "Saving…" : "Add Supplier"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── RAW MATERIALS ─────────────────────────────────────────────────────────────
function RawMaterials({ data, reload }) {
  const { saving, save } = useSaving();

  const [showIn, setIn] = useState(false);
  const [editRM, setERM] = useState(null);
  const [form, setForm] = useState({ materialId: "", qty: "", note: "" });

  const submitIn = async () => {
    if (!form.materialId || !form.qty) return;

    const rm = data.rawMaterials.find((r) => r.id === Number(form.materialId));
    if (!rm) return;

    await save(async () => {
      await DB.updateRM(rm.id, Number(rm.stock || 0) + Number(form.qty || 0));
      await reload();
    });

    setIn(false);
    setForm({ materialId: "", qty: "", note: "" });
  };

  const saveEdit = async () => {
    await save(async () => {
      await DB.updateRMFull(editRM);
      await reload();
    });

    setERM(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH title="🪨 Raw Materials" action={<Btn sm onClick={() => setIn(true)}>+ Stock In</Btn>} />

      {data.rawMaterials.length === 0 && (
        <Card>
          <div style={{ color: T.muted, fontSize: 13 }}>
            No raw materials found in database.
          </div>
        </Card>
      )}

      {data.rawMaterials.map((r) => {
        const stock = Number(r.stock || 0);
        const reorder = Number(r.reorder || 0);
        const low = stock <= reorder;
        const pct = reorder > 0 ? Math.min(100, (stock / (reorder * 3)) * 100) : 0;

        return (
          <Card key={r.id} style={{ borderColor: low ? T.red + "55" : T.border }}>
            {editRM?.id === r.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 700, color: T.text }}>Edit: {r.name}</div>

                <Inp
                  label="Current Stock"
                  type="number"
                  value={editRM.stock}
                  onChange={(v) => setERM((e) => ({ ...e, stock: Number(v || 0) }))}
                />

                <Inp
                  label="Reorder Level"
                  type="number"
                  value={editRM.reorder}
                  onChange={(v) => setERM((e) => ({ ...e, reorder: Number(v || 0) }))}
                />

                <Inp
                  label="Cost Per Unit (₹)"
                  type="number"
                  value={editRM.cost_per_unit}
                  onChange={(v) => setERM((e) => ({ ...e, cost_per_unit: Number(v || 0) }))}
                />

                <Row>
                  <Btn sm color={T.green} onClick={saveEdit}>
                    Save
                  </Btn>
                  <Btn sm outline onClick={() => setERM(null)}>
                    Cancel
                  </Btn>
                </Row>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: T.text, fontSize: 16 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>
                      Reorder at {reorder} {r.unit} · ₹{Number(r.cost_per_unit || 0)}/{r.unit}
                    </div>
                  </div>

                  <Row gap={8}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: low ? T.red : T.green }}>
                        {stock}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted }}>{r.unit}</div>
                    </div>

                    <IBtn label="Edit" onClick={() => setERM({ ...r })} />
                  </Row>
                </div>

                <div style={{ marginTop: 10, background: T.border, borderRadius: 99, height: 6 }}>
                  <div
                    style={{
                      background: low ? T.red : T.green,
                      height: 6,
                      borderRadius: 99,
                      width: `${pct}%`,
                    }}
                  />
                </div>

                {low && (
                  <div style={{ marginTop: 8, color: T.red, fontSize: 13, fontWeight: 600 }}>
                    Below reorder level — order now.
                  </div>
                )}
              </>
            )}
          </Card>
        );
      })}

      {showIn && (
        <Modal title="+ Stock In" onClose={() => setIn(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp
              label="Material"
              value={form.materialId}
              onChange={(v) => setForm((f) => ({ ...f, materialId: v }))}
              options={data.rawMaterials.map((r) => ({ value: String(r.id), label: r.name }))}
            />

            <Inp
              label="Quantity to Add"
              type="number"
              value={form.qty}
              onChange={(v) => setForm((f) => ({ ...f, qty: v }))}
            />

            <Inp
              label="Note (optional)"
              value={form.note}
              onChange={(v) => setForm((f) => ({ ...f, note: v }))}
            />

            <Btn onClick={submitIn}>{saving ? "Saving…" : "Add Stock"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
// ── INVENTORY ─────────────────────────────────────────────────────────────────
function Inventory({ data, reload }) {
  const { saving, save } = useSaving();

  const [modal, setM] = useState(false);
  const [form, setForm] = useState({ brickType: "", adjustment: "", note: "" });

  const submit = async () => {
    if (!form.brickType || form.adjustment === "") return;

    const cur = Number(data.inventory[form.brickType] || 0);
    const newQ = Math.max(0, cur + Number(form.adjustment || 0));

    await save(async () => {
      await DB.updateInventory(form.brickType, newQ);
      await reload();
    });

    setM(false);
    setForm({ brickType: "", adjustment: "", note: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH title="🧱 Inventory" action={<Btn sm outline onClick={() => setM(true)}>Adjust Stock</Btn>} />

      <Stat
        label="TOTAL STOCK"
        value={fmtN(Object.values(data.inventory).reduce((a, v) => a + Number(v || 0), 0))}
        color={T.accent}
        icon="🧱"
        sub="All brick types combined"
      />

      {BRICKS.map((b) => (
        <Card key={b.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: b.color }}>{b.label} Brick</div>
              <div style={{ fontSize: 12, color: T.muted }}>Flyash · {b.label} size</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: T.text }}>
                {fmtN(data.inventory[b.id] || 0)}
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>pcs in stock</div>
            </div>
          </div>

          <div style={{ marginTop: 10, background: T.border, borderRadius: 99, height: 8 }}>
            <div
              style={{
                background: b.color,
                height: 8,
                borderRadius: 99,
                width: `${Math.min(100, ((data.inventory[b.id] || 0) / 15000) * 100)}%`,
              }}
            />
          </div>
        </Card>
      ))}

      {modal && (
        <Modal title="Adjust Stock" onClose={() => setM(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp
              label="Brick Type"
              value={form.brickType}
              onChange={(v) => setForm((f) => ({ ...f, brickType: v }))}
              options={BRICKS.map((b) => ({ value: b.id, label: b.label + " Brick" }))}
            />

            <Inp
              label="Adjustment (+ add / - remove)"
              type="number"
              value={form.adjustment}
              onChange={(v) => setForm((f) => ({ ...f, adjustment: v }))}
              placeholder="0"
            />

            <Inp
              label="Note"
              value={form.note}
              onChange={(v) => setForm((f) => ({ ...f, note: v }))}
            />

            <Btn onClick={submit}>{saving ? "Saving…" : "Save Adjustment"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
function Expenses({ data, reload }) {
  const { saving, save } = useSaving();

  const [modal, setM] = useState(false);
  const [editE, setEE] = useState(null);
  const [form, setForm] = useState({
    date: today(),
    category: "",
    description: "",
    amount: "",
  });

  const cc = {
    Electricity: T.yellow,
    Maintenance: T.red,
    Marketing: T.accent,
    Transport: T.purple,
    Miscellaneous: T.muted,
  };

  const submit = async () => {
    if (!form.date || !form.category || form.amount === "") return;

    await save(async () => {
      await DB.addExpense({
        ...form,
        amount: Number(form.amount || 0),
      });
      await reload();
    });

    setM(false);
    setForm({ date: today(), category: "", description: "", amount: "" });
  };

  const saveEdit = async () => {
    await save(async () => {
      await DB.updateExpense(editE);
      await reload();
    });

    setEE(null);
  };

  const del = async (id) => {
    if (!window.confirm("Delete expense?")) return;

    await save(async () => {
      await DB.deleteExpense(id);
      await reload();
    });
  };

  const total = data.expenses.reduce((a, e) => a + Number(e.amount || 0), 0);

  const catT = EXP_CATS.map((c) => ({
    name: c,
    val: data.expenses
      .filter((e) => e.category === c)
      .reduce((a, e) => a + Number(e.amount || 0), 0),
  })).filter((c) => c.val > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SH title="📊 Expenses" action={<Btn sm color={T.red} onClick={() => setM(true)}>+ Add</Btn>} />

      <Stat label="TOTAL EXPENSES" value={fmt(total)} color={T.red} icon="📊" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {catT.map((c) => (
          <div
            key={c.name}
            style={{
              background: (cc[c.name] || T.muted) + "18",
              border: `1px solid ${(cc[c.name] || T.muted)}33`,
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: T.muted }}>{c.name}</div>
            <div style={{ fontWeight: 700, color: cc[c.name] || T.muted }}>{fmt(c.val)}</div>
          </div>
        ))}
      </div>

      {data.expenses.length === 0 && (
        <Card>
          <div style={{ color: T.muted, fontSize: 13 }}>No expenses added yet.</div>
        </Card>
      )}

      {data.expenses.map((e) => (
        <Card key={e.id} style={{ padding: "12px 14px" }}>
          {editE?.id === e.id ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Inp
                label="Date"
                type="date"
                value={editE.date}
                onChange={(v) => setEE((x) => ({ ...x, date: v }))}
              />

              <Inp
                label="Category"
                value={editE.category}
                onChange={(v) => setEE((x) => ({ ...x, category: v }))}
                options={EXP_CATS}
              />

              <Inp
                label="Description"
                value={editE.description}
                onChange={(v) => setEE((x) => ({ ...x, description: v }))}
              />

              <Inp
                label="Amount (₹)"
                type="number"
                value={editE.amount}
                onChange={(v) => setEE((x) => ({ ...x, amount: Number(v || 0) }))}
              />

              <Row>
                <Btn sm color={T.green} onClick={saveEdit}>Save</Btn>
                <Btn sm outline onClick={() => setEE(null)}>Cancel</Btn>
              </Row>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: T.text }}>{e.description || e.category}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{e.date}</div>
              </div>

              <Row gap={6}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: T.red, fontSize: 18 }}>{fmt(e.amount)}</div>
                  <Badge color={cc[e.category] || T.muted}>{e.category}</Badge>
                </div>
                <IBtn label="Edit" onClick={() => setEE({ ...e })} />
                <IBtn label="Delete" onClick={() => del(e.id)} danger />
              </Row>
            </div>
          )}
        </Card>
      ))}

      {modal && (
        <Modal title="Add Expense" onClose={() => setM(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Inp
              label="Date"
              type="date"
              value={form.date}
              onChange={(v) => setForm((f) => ({ ...f, date: v }))}
            />

            <Inp
              label="Category"
              value={form.category}
              onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              options={EXP_CATS}
            />

            <Inp
              label="Description"
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
            />

            <Inp
              label="Amount (₹)"
              type="number"
              value={form.amount}
              onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
              placeholder="0"
            />

            <Btn onClick={submit} color={T.red}>
              {saving ? "Saving…" : "Save Expense"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function Reports({ data }) {
  const monthly = MONTHS.map((m, i) => {
    const revenue = data.sales
      .filter((s) => new Date(s.date).getMonth() === i)
      .reduce((a, s) => a + Number(s.total_amount || 0), 0);

    const expenses = data.expenses
      .filter((e) => new Date(e.date).getMonth() === i)
      .reduce((a, e) => a + Number(e.amount || 0), 0);

    const salaries = data.salaryPayments.reduce((a, w) => {
      try {
        if (new Date(w.week_label.split("–")[0].trim() + ` ${new Date().getFullYear()}`).getMonth() === i) {
          return a + (w.payments || []).reduce((b, p) => b + Number(p.paid || 0), 0);
        }
      } catch {}
      return a;
    }, 0);

    const produced = data.production
      .filter((p) => new Date(p.date).getMonth() === i)
      .reduce((a, p) => a + Number(p.qty || 0), 0);

    return {
      month: m,
      revenue,
      expenses,
      salaries,
      produced,
      profit: revenue - expenses - salaries,
    };
  });

  const best = [...monthly].sort((a, b) => b.revenue - a.revenue)[0];

  const totalR = data.sales.reduce((a, s) => a + Number(s.total_amount || 0), 0);

  const totalC =
    data.expenses.reduce((a, e) => a + Number(e.amount || 0), 0) +
    data.salaryPayments.reduce(
      (a, w) => a + (w.payments || []).reduce((b, p) => b + Number(p.paid || 0), 0),
      0
    );

  const locs = [...new Set(data.sales.map((s) => s.location).filter(Boolean))]
    .map((loc) => ({
      loc,
      revenue: data.sales
        .filter((s) => s.location === loc)
        .reduce((a, s) => a + Number(s.total_amount || 0), 0),
      orders: data.sales.filter((s) => s.location === loc).length,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, color: T.text }}>📈 Reports & Analytics</h2>

      <G2>
        <Stat label="NET PROFIT" value={fmt(totalR - totalC)} color={T.green} icon="📈" />
        <Stat label="BEST MONTH" value={best?.month || "—"} sub={fmt(best?.revenue || 0)} color={T.accent} icon="🏆" />
      </G2>

      <Card>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Revenue vs Profit Trend</div>

        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={monthly.filter((m) => m.revenue > 0 || m.profit !== 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis tick={{ fill: T.muted, fontSize: 9 }} tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip
              formatter={(v) => fmt(v)}
              contentStyle={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
              }}
            />
            <Line type="monotone" dataKey="revenue" stroke={T.green} strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
            <Line type="monotone" dataKey="profit" stroke={T.accent} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Monthly Bricks Produced</div>

        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthly.filter((m) => m.produced > 0)}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fill: T.muted, fontSize: 10 }} />
            <YAxis tick={{ fill: T.muted, fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
              }}
            />
            <Bar dataKey="produced" fill={T.cyan} radius={[3, 3, 0, 0]} name="Bricks" />
          </BarChart>
        </ResponsiveContainer>

        {data.production.length === 0 && (
          <div style={{ color: T.muted, fontSize: 13, marginTop: 10 }}>
            No production data yet.
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Sales by Location</div>

        {locs.length === 0 && (
          <div style={{ color: T.muted, fontSize: 13 }}>No location sales data yet.</div>
        )}

        {locs.map((l, i) => (
          <div
            key={l.loc}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: i < locs.length - 1 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: T.text }}>
                {["🥇", "🥈", "🥉"][i] || "•"} {l.loc}
              </div>
              <div style={{ fontSize: 12, color: T.muted }}>{l.orders} orders</div>
            </div>
            <div style={{ fontWeight: 800, color: T.accent, fontSize: 18 }}>{fmt(l.revenue)}</div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontWeight: 700, color: T.text, marginBottom: 12 }}>Month-by-Month P&L</div>

        {[...monthly]
          .filter((m) => m.revenue > 0 || m.expenses > 0 || m.salaries > 0 || m.produced > 0)
          .sort((a, b) => b.revenue - a.revenue)
          .map((m) => (
            <div key={m.month} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontWeight: 700, color: T.text }}>{m.month}</span>
                <span style={{ color: m.profit >= 0 ? T.green : T.red, fontWeight: 700 }}>
                  Profit: {fmt(m.profit)}
                </span>
              </div>

              <div style={{ fontSize: 12, color: T.muted, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>Revenue: <b style={{ color: T.green }}>{fmt(m.revenue)}</b></span>
                <span>Bills: <b style={{ color: T.red }}>{fmt(m.expenses)}</b></span>
                <span>Salary: <b style={{ color: T.blue }}>{fmt(m.salaries)}</b></span>
                <span>Bricks: <b style={{ color: T.cyan }}>{fmtN(m.produced)}</b></span>
              </div>
            </div>
          ))}

        {monthly.every((m) => m.revenue === 0 && m.expenses === 0 && m.salaries === 0 && m.produced === 0) && (
          <div style={{ color: T.muted, fontSize: 13 }}>No report data yet.</div>
        )}
      </Card>
    </div>
  );
}

// ── APP SHELL ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Home", icon: "🏠" },
  { id: "inventory", label: "Stock", icon: "🧱" },
  { id: "production", label: "Production", icon: "🏭" },
  { id: "raw", label: "Materials", icon: "🪨" },
  { id: "sales", label: "Sales", icon: "💰" },
  { id: "salaries", label: "Salaries", icon: "👷" },
  { id: "expenses", label: "Expenses", icon: "📊" },
  { id: "suppliers", label: "Suppliers", icon: "🚛" },
  { id: "reports", label: "Reports", icon: "📈" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const { data, loading, error, reload } = useData();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: T.accent,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}
        >
          🧱
        </div>
        <div style={{ color: T.muted, fontSize: 14 }}>Loading BrickMaster Pro…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ color: T.red, fontWeight: 700, fontSize: 16 }}>Connection Error</div>
        <div style={{ color: T.muted, fontSize: 13, textAlign: "center" }}>{error}</div>
        <Btn onClick={reload} color={T.blue}>Retry</Btn>
      </div>
    );
  }

  const p = { data, reload };

  const render = () => {
    switch (tab) {
      case "dashboard":
        return <Dashboard data={data} />;
      case "inventory":
        return <Inventory {...p} />;
      case "production":
        return <Production {...p} />;
      case "raw":
        return <RawMaterials {...p} />;
      case "sales":
        return <CustomersSales {...p} />;
      case "salaries":
        return <Salaries {...p} />;
      case "expenses":
        return <Expenses {...p} />;
      case "suppliers":
        return <Suppliers {...p} />;
      case "reports":
        return <Reports data={data} />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'Segoe UI', sans-serif",
        color: T.text,
      }}
    >
      <div
        style={{
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: T.accent,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🧱
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, fontFamily: "Georgia, serif" }}>
              BrickMaster Pro
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>Flyash Bricks Business Manager</div>
          </div>
        </div>

        <button
          onClick={reload}
          style={{
            background: "none",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            color: T.muted,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <div style={{ padding: "18px 14px 145px", maxWidth: 900, margin: "0 auto" }}>
        {render()}
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: T.surface,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 6px",
          zIndex: 100,
        }}
      >
        {NAV.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: tab === t.id ? T.accent : T.muted,
            }}
          >
            <span style={{ fontSize: 26 }}>{t.icon}</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: tab === t.id ? 800 : 500,
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
