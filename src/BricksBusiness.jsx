import { useState } from "react";
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
};

const BRICKS = [
  { id: "4inch", label: '4"', color: T.accent },
  { id: "6inch", label: '6"', color: T.blue },
  { id: "7inch", label: '7"', color: T.purple },
  { id: "9inch", label: '9"', color: T.green },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const seedData = {
  inventory: {
    "4inch": 12400,
    "6inch": 8700,
    "7inch": 3100,
    "9inch": 5200,
  },
  sales: [
    { month: "Jan", revenue: 16000, expenses: 22000 },
    { month: "Feb", revenue: 18000, expenses: 12000 },
    { month: "Mar", revenue: 14400, expenses: 8000 },
    { month: "Apr", revenue: 4000, expenses: 24000 },
  ],
  rawMaterials: [
    { id: 1, name: "Flyash", stock: 48, unit: "Tonnes", reorder: 20 },
    { id: 2, name: "Cement", stock: 320, unit: "Bags", reorder: 100 },
    { id: 3, name: "Sand", stock: 22, unit: "Tonnes", reorder: 10 },
    { id: 4, name: "Lime", stock: 80, unit: "Bags", reorder: 30 },
  ],
  production: [
    { id: 1, date: "2025-04-14", brickType: "4inch", qty: 1300, rejections: 30 },
    { id: 2, date: "2025-04-15", brickType: "6inch", qty: 1450, rejections: 25 },
    { id: 3, date: "2025-04-16", brickType: "4inch", qty: 1200, rejections: 20 },
  ],
};

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtN = (n) => Number(n).toLocaleString("en-IN");

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, sub, color = T.accent }) {
  return (
    <Card>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700 }}>{label}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color,
          marginTop: 6,
          fontFamily: "Georgia, serif",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function Btn({ children, onClick, color = T.accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: color,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "10px 14px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Dashboard({ data }) {
  const totalRevenue = data.sales.reduce((a, s) => a + s.revenue, 0);
  const totalExpenses = data.sales.reduce((a, s) => a + s.expenses, 0);
  const totalStock = Object.values(data.inventory).reduce((a, b) => a + b, 0);
  const totalProduction = data.production.reduce((a, p) => a + p.qty, 0);

  const monthly = MONTHS.map((m) => {
    const found = data.sales.find((s) => s.month === m);
    return {
      month: m,
      revenue: found?.revenue || 0,
      expenses: found?.expenses || 0,
      profit: (found?.revenue || 0) - (found?.expenses || 0),
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Stat label="TOTAL REVENUE" value={fmt(totalRevenue)} color={T.green} />
        <Stat label="TOTAL EXPENSES" value={fmt(totalExpenses)} color={T.red} />
        <Stat label="TOTAL STOCK" value={fmtN(totalStock)} color={T.cyan} sub="All brick types" />
        <Stat label="PRODUCTION" value={fmtN(totalProduction)} color={T.accent} sub="Total bricks logged" />
      </div>

      <Card>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Monthly Revenue vs Expenses</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fill: T.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill={T.green} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill={T.red} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Profit Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
            <XAxis dataKey="month" tick={{ fill: T.muted, fontSize: 11 }} />
            <YAxis tick={{ fill: T.muted, fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="profit" stroke={T.accent} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div style={{ fontWeight: 800, marginBottom: 12 }}>Live Stock</div>
        {BRICKS.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <span style={{ color: b.color, fontWeight: 800 }}>{b.label} Brick</span>
            <span style={{ fontWeight: 900 }}>{fmtN(data.inventory[b.id])} pcs</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Inventory({ data, setData }) {
  const addStock = (brickType) => {
    setData((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [brickType]: prev.inventory[brickType] + 100,
      },
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2>Inventory</h2>
      {BRICKS.map((b) => (
        <Card key={b.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 24, color: b.color, fontWeight: 900 }}>{b.label} Brick</div>
              <div style={{ color: T.muted, fontSize: 12 }}>Available stock</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{fmtN(data.inventory[b.id])}</div>
              <Btn onClick={() => addStock(b.id)}>+100 Stock</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Production({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2>Production</h2>
      {data.production.map((p) => {
        const brick = BRICKS.find((b) => b.id === p.brickType);
        return (
          <Card key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }}>{p.date}</div>
                <div style={{ color: brick?.color }}>{brick?.label} Brick</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{fmtN(p.qty)}</div>
                <div style={{ color: T.red, fontSize: 12 }}>Rejected: {p.rejections}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function RawMaterials({ data }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2>Raw Materials</h2>
      {data.rawMaterials.map((r) => {
        const low = r.stock <= r.reorder;
        return (
          <Card key={r.id} style={{ borderColor: low ? T.red : T.border }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 900 }}>{r.name}</div>
                <div style={{ color: T.muted, fontSize: 12 }}>
                  Reorder level: {r.reorder} {r.unit}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: low ? T.red : T.green }}>
                  {r.stock}
                </div>
                <div style={{ color: T.muted, fontSize: 12 }}>{r.unit}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <Card>
      <h2>{title}</h2>
      <p style={{ color: T.muted, marginTop: 8 }}>
        This section is ready to expand after the main deployment is successful.
      </p>
    </Card>
  );
}

const TABS = [
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
  const [data, setData] = useState(seedData);

  const render = () => {
    switch (tab) {
      case "dashboard":
        return <Dashboard data={data} />;
      case "inventory":
        return <Inventory data={data} setData={setData} />;
      case "production":
        return <Production data={data} />;
      case "raw":
        return <RawMaterials data={data} />;
      case "sales":
        return <ComingSoon title="Sales & Customers" />;
      case "salaries":
        return <ComingSoon title="Salaries" />;
      case "expenses":
        return <ComingSoon title="Expenses" />;
      case "suppliers":
        return <ComingSoon title="Suppliers" />;
      case "reports":
        return <Dashboard data={data} />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      <div
        style={{
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
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
          <div style={{ fontWeight: 900, fontSize: 17, fontFamily: "Georgia, serif" }}>
            BrickMaster Pro
          </div>
          <div style={{ fontSize: 11, color: T.muted }}>Flyash Bricks Business Manager</div>
        </div>
      </div>

      <main style={{ padding: "18px 14px 105px", maxWidth: 900, margin: "0 auto" }}>
        {render()}
      </main>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: T.surface,
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          overflowX: "auto",
          padding: "5px 0",
          zIndex: 100,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: tab === t.id ? T.accent : T.muted,
              borderTop: tab === t.id ? `2px solid ${T.accent}` : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 800 : 500 }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
