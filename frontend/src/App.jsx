import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Factory,
  KeyRound,
  Loader2,
  LogOut,
  PackagePlus,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserRound
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

const navItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "products", label: "Products", icon: Boxes },
  { id: "warehouses", label: "Warehouses", icon: Building2 },
  { id: "stock", label: "Stock", icon: Database },
  { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
  { id: "adjustments", label: "Adjustments", icon: ClipboardList },
  { id: "suppliers", label: "Suppliers", icon: Factory },
  { id: "audit", label: "Audit", icon: ShieldCheck }
];

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem("leanstock.session") || "null");
  } catch (_error) {
    return null;
  }
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function ApiErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="notice error">
      <AlertCircle size={18} />
      <span>{error}</span>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <Database size={32} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function StatusPill({ value }) {
  const normalized = String(value || "UNKNOWN");
  return <span className={`pill ${normalized.toLowerCase().replaceAll("_", "-")}`}>{normalized}</span>;
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function useApi(session, setSession) {
  return useCallback(async (path, options = {}) => {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (session?.tokens?.accessToken) {
      headers.Authorization = `Bearer ${session.tokens.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("leanstock.session");
        setSession(null);
      }
      throw new Error(data?.message || `Request failed with ${response.status}`);
    }
    return data;
  }, [session, setSession]);
}

function LoginView({ onLogin }) {
  const [form, setForm] = useState({ email: "super@arzan.kz", password: "Password123!" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("leanstock.session", JSON.stringify(data));
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">
          <Boxes size={30} />
        </div>
        <h1>LeanStock Console</h1>
        <p>Inventory operations, transfers, audit visibility, and stock intelligence connected directly to your backend.</p>
        <form onSubmit={submit} className="login-form">
          <Field label="Email">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <ApiErrorBanner error={error} />
          <button className="primary wide" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(readStoredSession);
  const [active, setActive] = useState("overview");
  const [state, setState] = useState({
    products: [],
    warehouses: [],
    stock: [],
    transfers: [],
    adjustments: [],
    suppliers: [],
    valuation: null,
    turnover: [],
    deadStock: [],
    audit: [],
    queue: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const api = useApi(session, setSession);

  const variants = useMemo(() => state.products.flatMap((product) => (
    product.variants || []
  ).map((variant) => ({ ...variant, productName: product.name }))), [state.products]);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [
        products,
        warehouses,
        stock,
        transfers,
        adjustments,
        suppliers,
        valuation,
        turnover,
        deadStock,
        audit,
        queue
      ] = await Promise.all([
        api("/products"),
        api("/warehouses"),
        api("/stock?page=1&limit=50"),
        api("/transfers?page=1&limit=50"),
        api("/adjustments?page=1&limit=50"),
        api("/suppliers?page=1&limit=50"),
        api("/reports/valuation"),
        api("/reports/turnover"),
        api("/reports/dead-stock"),
        api("/admin/audit-logs?page=1&limit=30"),
        api("/admin/queue/email")
      ]);
      setState({
        products: pickArray(products),
        warehouses: pickArray(warehouses),
        stock: pickArray(stock),
        transfers: pickArray(transfers),
        adjustments: pickArray(adjustments),
        suppliers: pickArray(suppliers),
        valuation,
        turnover: pickArray(turnover),
        deadStock: pickArray(deadStock),
        audit: pickArray(audit),
        queue
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function logout() {
    localStorage.removeItem("leanstock.session");
    setSession(null);
  }

  async function action(handler) {
    setError("");
    setLoading(true);
    try {
      await handler();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) return <LoginView onLogin={setSession} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark"><Boxes size={22} /></div>
          <div>
            <strong>LeanStock</strong>
            <span>Operations Console</span>
          </div>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Connected to {API_BASE}</span>
            <h1>{navItems.find((item) => item.id === active)?.label || "LeanStock"}</h1>
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <UserRound size={16} />
              <span>{session.user?.email}</span>
              <StatusPill value={session.user?.role} />
            </div>
            <button className="icon-button" onClick={refresh} title="Refresh data" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            </button>
            <button className="icon-button" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <ApiErrorBanner error={error} />

        {active === "overview" && <Overview state={state} setActive={setActive} action={action} api={api} />}
        {active === "products" && <Products products={state.products} action={action} api={api} />}
        {active === "warehouses" && <Warehouses warehouses={state.warehouses} action={action} api={api} />}
        {active === "stock" && <Stock stock={state.stock} warehouses={state.warehouses} variants={variants} action={action} api={api} />}
        {active === "transfers" && <Transfers transfers={state.transfers} warehouses={state.warehouses} variants={variants} action={action} api={api} />}
        {active === "adjustments" && <Adjustments adjustments={state.adjustments} warehouses={state.warehouses} variants={variants} action={action} api={api} />}
        {active === "suppliers" && <Suppliers suppliers={state.suppliers} action={action} api={api} />}
        {active === "audit" && <Audit audit={state.audit} queue={state.queue} action={action} api={api} />}
      </main>
    </div>
  );
}

function Overview({ state, setActive, action, api }) {
  const totals = state.valuation?.totals || {};
  const cards = [
    { label: "Products", value: state.products.length, icon: Boxes, target: "products" },
    { label: "Warehouses", value: state.warehouses.length, icon: Building2, target: "warehouses" },
    { label: "Stock quantity", value: totals.quantity || 0, icon: Database, target: "stock" },
    { label: "Transfers", value: state.transfers.length, icon: ArrowRightLeft, target: "transfers" }
  ];

  return (
    <section className="content-grid">
      <div className="metrics">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button className="metric-card" key={card.label} onClick={() => setActive(card.target)}>
              <Icon size={22} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </button>
          );
        })}
      </div>
      <div className="panel span-2">
        <div className="panel-header">
          <div>
            <h2>Inventory valuation</h2>
            <p>Cost and retail value from live stock entries.</p>
          </div>
          <StatusPill value={`Retail ${money(totals.retailValue)}`} />
        </div>
        <DataTable
          columns={["Product", "SKU", "Warehouse", "Qty", "Cost", "Retail"]}
          rows={(state.valuation?.data || []).slice(0, 8).map((row) => [
            row.productName,
            row.sku,
            row.warehouseName,
            row.quantity,
            money(row.costValue),
            money(row.retailValue)
          ])}
          empty="No stock valuation yet"
        />
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Background jobs</h2>
            <p>Manual operational triggers.</p>
          </div>
        </div>
        <div className="stack">
          <button className="secondary" onClick={() => action(() => api("/admin/jobs/dead-stock-decay/run", { method: "POST" }))}>
            <Play size={17} />
            Run dead-stock decay
          </button>
          <button className="secondary" onClick={() => action(() => api("/admin/queue/email/process-one", { method: "POST" }))}>
            <Truck size={17} />
            Process one email
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Turnover risk</h2>
            <p>Slow-moving variants.</p>
          </div>
        </div>
        <DataTable
          columns={["SKU", "Product", "Qty", "Risk"]}
          rows={state.turnover.slice(0, 8).map((row) => [row.sku, row.productName, row.quantity, <StatusPill key={row.variantId} value={row.risk} />])}
          empty="No turnover data yet"
        />
      </div>
    </section>
  );
}

function Products({ products, action, api }) {
  const [form, setForm] = useState({
    name: "Urban Classic Sneakers",
    description: "Leather city sneakers",
    category: "Footwear",
    baseUnit: "pcs",
    sku: "SKU-DEMO-001",
    size: "42",
    color: "Black",
    costPrice: 2500,
    retailPrice: 5990,
    liquidationPrice: 1500,
    reorderPoint: 10
  });

  function submit(event) {
    event.preventDefault();
    return action(() => api("/products", {
      method: "POST",
      body: {
        name: form.name,
        description: form.description,
        category: form.category,
        baseUnit: form.baseUnit,
        variants: [{
          sku: form.sku,
          size: form.size,
          color: form.color,
          costPrice: Number(form.costPrice),
          retailPrice: Number(form.retailPrice),
          liquidationPrice: Number(form.liquidationPrice),
          reorderPoint: Number(form.reorderPoint)
        }]
      }
    }));
  }

  return (
    <section className="content-grid">
      <form className="panel form-panel" onSubmit={submit}>
        <PanelTitle icon={PackagePlus} title="Create product" />
        <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="two-col">
          <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Unit"><input value={form.baseUnit} onChange={(e) => setForm({ ...form, baseUnit: e.target.value })} /></Field>
        </div>
        <div className="two-col">
          <Field label="SKU"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
          <Field label="Size"><input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} /></Field>
        </div>
        <div className="two-col">
          <Field label="Color"><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field>
          <Field label="Reorder point"><input type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} /></Field>
        </div>
        <div className="three-col">
          <Field label="Cost"><input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></Field>
          <Field label="Retail"><input type="number" value={form.retailPrice} onChange={(e) => setForm({ ...form, retailPrice: e.target.value })} /></Field>
          <Field label="Liquidation"><input type="number" value={form.liquidationPrice} onChange={(e) => setForm({ ...form, liquidationPrice: e.target.value })} /></Field>
        </div>
        <button className="primary"><Plus size={17} /> Create product</button>
      </form>
      <div className="panel span-2">
        <PanelTitle icon={Boxes} title="Catalog" />
        <DataTable
          columns={["Name", "Category", "Unit", "Variants", "First SKU"]}
          rows={products.map((product) => [
            product.name,
            product.category || "—",
            product.baseUnit,
            product.variants?.length || 0,
            product.variants?.[0]?.sku || "—"
          ])}
          empty="No products yet"
        />
      </div>
    </section>
  );
}

function Warehouses({ warehouses, action, api }) {
  const [form, setForm] = useState({ name: "Main Warehouse", address: "Almaty, Zhandosov 55" });
  return (
    <section className="content-grid">
      <form className="panel form-panel" onSubmit={(event) => {
        event.preventDefault();
        action(() => api("/warehouses", { method: "POST", body: form }));
      }}>
        <PanelTitle icon={Building2} title="Create warehouse" />
        <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <button className="primary"><Plus size={17} /> Create warehouse</button>
      </form>
      <div className="panel span-2">
        <PanelTitle icon={Building2} title="Warehouses" />
        <DataTable
          columns={["Name", "Address", "Active", "Created"]}
          rows={warehouses.map((warehouse) => [warehouse.name, warehouse.address || "—", warehouse.isActive ? "Yes" : "No", formatDate(warehouse.createdAt)])}
          empty="No warehouses yet"
        />
      </div>
    </section>
  );
}

function Stock({ stock, warehouses, variants, action, api }) {
  const [form, setForm] = useState({ warehouseId: "", variantId: "", quantity: 10 });
  const firstWarehouse = warehouses[0]?.id || "";
  const firstVariant = variants[0]?.id || "";
  const payload = { ...form, warehouseId: form.warehouseId || firstWarehouse, variantId: form.variantId || firstVariant };

  return (
    <section className="content-grid">
      <form className="panel form-panel" onSubmit={(event) => {
        event.preventDefault();
        action(() => api("/stock", { method: "POST", body: { ...payload, quantity: Number(form.quantity) } }));
      }}>
        <PanelTitle icon={Database} title="Set stock quantity" />
        <SelectField label="Warehouse" value={payload.warehouseId} onChange={(value) => setForm({ ...form, warehouseId: value })} options={warehouses.map((w) => [w.id, w.name])} />
        <SelectField label="Variant" value={payload.variantId} onChange={(value) => setForm({ ...form, variantId: value })} options={variants.map((v) => [v.id, `${v.sku} · ${v.productName}`])} />
        <Field label="Quantity"><input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
        <button className="primary"><CheckCircle2 size={17} /> Set stock</button>
      </form>
      <div className="panel span-2">
        <PanelTitle icon={Database} title="Current stock" />
        <DataTable
          columns={["Product", "SKU", "Warehouse", "Qty", "Updated"]}
          rows={stock.map((entry) => [
            entry.variant?.productName || entry.variant?.product?.name || "—",
            entry.variant?.sku || entry.variantId,
            entry.warehouse?.name || entry.warehouseId,
            entry.quantity,
            formatDate(entry.updatedAt)
          ])}
          empty="No stock entries yet"
        />
      </div>
    </section>
  );
}

function Transfers({ transfers, warehouses, variants, action, api }) {
  const [form, setForm] = useState({ sourceId: "", destinationId: "", variantId: "", quantity: 1, note: "Move stock" });
  const payload = {
    sourceId: form.sourceId || warehouses[0]?.id || "",
    destinationId: form.destinationId || warehouses[1]?.id || "",
    variantId: form.variantId || variants[0]?.id || ""
  };
  return (
    <section className="content-grid">
      <form className="panel form-panel" onSubmit={(event) => {
        event.preventDefault();
        action(() => api("/transfers", {
          method: "POST",
          body: {
            sourceId: payload.sourceId,
            destinationId: payload.destinationId,
            note: form.note,
            items: [{ variantId: payload.variantId, quantity: Number(form.quantity) }]
          }
        }));
      }}>
        <PanelTitle icon={ArrowRightLeft} title="Create transfer" />
        <SelectField label="From" value={payload.sourceId} onChange={(value) => setForm({ ...form, sourceId: value })} options={warehouses.map((w) => [w.id, w.name])} />
        <SelectField label="To" value={payload.destinationId} onChange={(value) => setForm({ ...form, destinationId: value })} options={warehouses.map((w) => [w.id, w.name])} />
        <SelectField label="Variant" value={payload.variantId} onChange={(value) => setForm({ ...form, variantId: value })} options={variants.map((v) => [v.id, `${v.sku} · ${v.productName}`])} />
        <div className="two-col">
          <Field label="Quantity"><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
          <Field label="Note"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <button className="primary"><ArrowRightLeft size={17} /> Create transfer</button>
      </form>
      <div className="panel span-2">
        <PanelTitle icon={ArrowRightLeft} title="Transfers" />
        <DataTable
          columns={["ID", "Status", "Items", "Created", "Actions"]}
          rows={transfers.map((transfer) => [
            <code key={`${transfer.id}-code`}>{transfer.id}</code>,
            <StatusPill key={`${transfer.id}-status`} value={transfer.status} />,
            transfer.items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
            formatDate(transfer.createdAt),
            transfer.status === "IN_TRANSIT" ? (
              <div className="row-actions">
                <button className="mini" onClick={() => action(() => api(`/transfers/${transfer.id}/confirm`, { method: "POST" }))}>Confirm</button>
                <button className="mini danger" onClick={() => action(() => api(`/transfers/${transfer.id}/reject`, { method: "POST" }))}>Reject</button>
              </div>
            ) : "—"
          ])}
          empty="No transfers yet"
        />
      </div>
    </section>
  );
}

function Adjustments({ adjustments, warehouses, variants, action, api }) {
  const [form, setForm] = useState({ warehouseId: "", variantId: "", delta: -1, reason: "COUNT_CORRECTION", note: "Physical count correction" });
  const payload = { ...form, warehouseId: form.warehouseId || warehouses[0]?.id || "", variantId: form.variantId || variants[0]?.id || "" };
  return (
    <section className="content-grid">
      <form className="panel form-panel" onSubmit={(event) => {
        event.preventDefault();
        action(() => api("/adjustments", {
          method: "POST",
          body: {
            warehouseId: payload.warehouseId,
            reason: form.reason,
            note: form.note,
            items: [{ variantId: payload.variantId, delta: Number(form.delta) }]
          }
        }));
      }}>
        <PanelTitle icon={ClipboardList} title="Manual adjustment" />
        <SelectField label="Warehouse" value={payload.warehouseId} onChange={(value) => setForm({ ...form, warehouseId: value })} options={warehouses.map((w) => [w.id, w.name])} />
        <SelectField label="Variant" value={payload.variantId} onChange={(value) => setForm({ ...form, variantId: value })} options={variants.map((v) => [v.id, `${v.sku} · ${v.productName}`])} />
        <SelectField label="Reason" value={form.reason} onChange={(value) => setForm({ ...form, reason: value })} options={["DAMAGE", "THEFT", "SURPLUS", "EXPIRY", "COUNT_CORRECTION"].map((r) => [r, r])} />
        <div className="two-col">
          <Field label="Delta"><input type="number" value={form.delta} onChange={(e) => setForm({ ...form, delta: e.target.value })} /></Field>
          <Field label="Note"><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <button className="primary"><Plus size={17} /> Apply adjustment</button>
      </form>
      <div className="panel span-2">
        <PanelTitle icon={ClipboardList} title="Adjustment history" />
        <DataTable
          columns={["Reason", "Warehouse", "Items", "Created"]}
          rows={adjustments.map((adjustment) => [adjustment.reason, adjustment.warehouse?.name || adjustment.warehouseId, adjustment.items?.length || 0, formatDate(adjustment.createdAt)])}
          empty="No adjustments yet"
        />
      </div>
    </section>
  );
}

function Suppliers({ suppliers, action, api }) {
  const [form, setForm] = useState({ name: "Almaty Wholesale LLP", email: "sales@example.kz", phone: "+77010000000" });
  return (
    <section className="content-grid">
      <form className="panel form-panel" onSubmit={(event) => {
        event.preventDefault();
        action(() => api("/suppliers", { method: "POST", body: form }));
      }}>
        <PanelTitle icon={Factory} title="Create supplier" />
        <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <button className="primary"><Plus size={17} /> Create supplier</button>
      </form>
      <div className="panel span-2">
        <PanelTitle icon={Factory} title="Suppliers" />
        <DataTable
          columns={["Name", "Email", "Phone", "Active"]}
          rows={suppliers.map((supplier) => [supplier.name, supplier.email || "—", supplier.phone || "—", supplier.isActive ? "Yes" : "No"])}
          empty="No suppliers yet"
        />
      </div>
    </section>
  );
}

function Audit({ audit, queue, action, api }) {
  const [filter, setFilter] = useState("");
  const filtered = audit.filter((row) => !filter || row.action?.includes(filter.toUpperCase()) || row.entity?.toLowerCase().includes(filter.toLowerCase()));
  return (
    <section className="content-grid">
      <div className="panel">
        <PanelTitle icon={Activity} title="Queue visibility" />
        <div className="queue-grid">
          {["queued", "processing", "completed", "failed"].map((key) => (
            <div className="queue-cell" key={key}>
              <span>{key}</span>
              <strong>{queue?.[key] ?? 0}</strong>
            </div>
          ))}
        </div>
        <button className="secondary" onClick={() => action(() => api("/admin/queue/email/process-one", { method: "POST" }))}>
          <Truck size={17} />
          Process one email job
        </button>
      </div>
      <div className="panel span-2">
        <div className="panel-header">
          <PanelTitle icon={ShieldCheck} title="Audit log" compact />
          <label className="search-box">
            <Search size={16} />
            <input placeholder="Filter action or entity" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </label>
        </div>
        <DataTable
          columns={["Action", "Entity", "Actor", "Metadata", "Created"]}
          rows={filtered.map((row) => [
            <StatusPill key={row.id} value={row.action} />,
            `${row.entity}${row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}`,
            row.actorId ? row.actorId.slice(0, 10) : "system",
            row.metadata ? JSON.stringify(row.metadata) : "—",
            formatDate(row.createdAt)
          ])}
          empty="No audit events yet"
        />
      </div>
    </section>
  );
}

function PanelTitle({ icon: Icon, title, compact }) {
  return (
    <div className={compact ? "panel-title compact" : "panel-title"}>
      <Icon size={20} />
      <h2>{title}</h2>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={!options.length}>
        {!options.length && <option value="">No options</option>}
        {options.map(([optionValue, optionLabel]) => (
          <option value={optionValue} key={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </Field>
  );
}

function DataTable({ columns, rows, empty }) {
  if (!rows.length) return <EmptyState title={empty} text="Create data from the form or refresh after backend actions." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
