import { useState, useEffect, useRef } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: "house_blend",  name: "House Blend",  hasGrind: false },
  { id: "brazil",       name: "Brazil",       hasGrind: false },
  { id: "decaf",        name: "Decaf",        hasGrind: false },
  { id: "decaf_ground", name: "Decaf Ground", hasGrind: false },
  { id: "colombia",     name: "Colombia",     hasGrind: false },
  { id: "guatemala",    name: "Guatemala",    hasGrind: false },
];

const SEED_CUSTOMERS = [
  "Buntastic", "Cafe Cassea", "Fev Kavalde", "Fino",
  "Gramm & Degrees", "Istanbul Cafe", "Knoops", "Symva",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const fmtTime = iso =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const fmtDay = iso => {
  const d = new Date(iso), t = new Date();
  if (d.toDateString() === t.toDateString()) return "Today";
  const y = new Date(t); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const toLines = items =>
  items.flatMap(it => {
    const r = [];
    if (+it.retailQty > 0) r.push(`${it.name} – Retail x${it.retailQty}`);
    if (+it.kgQty > 0)     r.push(`${it.name} – 1kg x${it.kgQty}`);
    return r;
  });

const emptyForm = () => ({
  customer: "",
  items: PRODUCTS.map(p => ({ ...p, retailQty: "", kgQty: "" })),
  notes: "",
});

// ─── Theme ────────────────────────────────────────────────────────────────────
const ink    = "#1A0800";
const cream  = "#FDF8F2";
const muted  = "#A08C7C";
const border = "#EDE5DC";
const green  = "#15803D";
const greenBg = "#DCFCE7";

// ─── Sub-components ──────────────────────────────────────────────────────────

function Badge({ status }) {
  const isPacked = status === "packed";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
      fontFamily: "'DM Sans', sans-serif",
      color: isPacked ? green : ink,
      background: isPacked ? greenBg : "#EEEAE5",
      padding: "3px 8px", borderRadius: 4, flexShrink: 0,
    }}>
      {isPacked ? "PACKED" : "OPEN"}
    </span>
  );
}

function OrderCard({ order, onMark, onClick }) {
  const lines = toLines(order.items);
  const isPacked = order.status === "packed";
  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${border}`,
      padding: "14px 16px", marginBottom: 10,
      cursor: "pointer",
      boxShadow: "0 1px 4px rgba(26,8,0,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, gap: 8 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, color: ink }}>{order.customer}</span>
        <Badge status={order.status} />
      </div>
      <div style={{ fontSize: 12, color: muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>
        {fmtDay(order.ts)}, {fmtTime(order.ts)}
      </div>
      <div style={{ fontSize: 13, color: "#4A3728", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: isPacked ? 4 : 12 }}>
        {lines.slice(0, 2).map((l, i) => <div key={i}>{l}</div>)}
        {lines.length > 2 && <div style={{ color: muted }}>+{lines.length - 2} more</div>}
      </div>
      {!isPacked ? (
        <button
          onClick={e => { e.stopPropagation(); onMark(order.id); }}
          style={{
            width: "100%", padding: "9px 0", border: `1.5px solid ${ink}`,
            borderRadius: 8, background: "transparent", color: ink,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
            letterSpacing: "0.06em", cursor: "pointer",
          }}
        >
          MARK PACKED
        </button>
      ) : (
        <div style={{ textAlign: "right", color: muted, fontSize: 20, lineHeight: 1 }}>›</div>
      )}
    </div>
  );
}

function DetailSheet({ order, onClose, onMark }) {
  if (!order) return null;
  const isPacked = order.status === "packed";
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(26,8,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 430, background: cream,
          borderRadius: "20px 20px 0 0",
          maxHeight: "88vh", overflowY: "auto",
          padding: "0 20px 44px",
        }}
      >
        {/* Handle */}
        <div style={{ textAlign: "center", padding: "14px 0 18px" }}>
          <div style={{ width: 36, height: 4, background: border, borderRadius: 2, display: "inline-block" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: ink }}>{order.customer}</div>
            <div style={{ fontSize: 12, color: muted, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
              {fmtDay(order.ts)}, {fmtTime(order.ts)}
            </div>
          </div>
          <Badge status={order.status} />
        </div>

        {/* Items */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>ORDER ITEMS</div>
        {order.items.map((it, i) => {
          return (
            <div key={i}>
              {+it.retailQty > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${border}` }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: ink }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: muted, fontFamily: "'DM Sans', sans-serif" }}>Retail Bag</div>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: ink }}>×{it.retailQty}</div>
                </div>
              )}
              {+it.kgQty > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${border}` }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14, color: ink }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: muted, fontFamily: "'DM Sans', sans-serif" }}>1kg Bag</div>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: ink }}>×{it.kgQty}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* Notes */}
        {order.notes && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#F9F5EF", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>NOTES</div>
            <div style={{ fontSize: 13, color: ink, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{order.notes}</div>
          </div>
        )}

        <div style={{ height: 20 }} />

        {!isPacked && (
          <button
            onClick={() => onMark(order.id)}
            style={{
              width: "100%", padding: "15px 0", background: ink, border: "none",
              borderRadius: 10, color: "#fff", fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", cursor: "pointer",
            }}
          >
            MARK PACKED
          </button>
        )}
      </div>
    </div>
  );
}

function BottomNav({ tab, onChange }) {
  const items = [
    { id: "open",   label: "OPEN",      svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg> },
    { id: "new",    label: "NEW ORDER",  svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    { id: "packed", label: "PACKED",     svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
  ];
  return (
    <nav style={{
      background: "#fff", borderTop: `1px solid ${border}`,
      display: "flex", flexShrink: 0,
    }}>
      {items.map(({ id, label, svg }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => onChange(id)} style={{
            flex: 1, padding: "10px 0 10px", border: "none", background: "none",
            cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            color: active ? ink : muted,
            borderTop: active ? `2.5px solid ${ink}` : "2.5px solid transparent",
          }}>
            {svg}
            <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.07em" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]         = useState("open");
  const [orders, setOrders]   = useState([]);
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [detail, setDetail]   = useState(null);
  const [loaded, setLoaded]   = useState(false);

  // New order form
  const [form, setForm]       = useState(emptyForm());
  const [custDrop, setCustDrop] = useState(false);
  const custRef = useRef(null);

  // Packed filters
  const [search, setSearch]   = useState("");
  const [dateF, setDateF]     = useState("today");
  const [showF, setShowF]     = useState(false);

  // ── Persistence (browser localStorage — per-device/browser) ───────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bt_v2");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.orders)    setOrders(d.orders);
        if (d.customers) setCustomers(d.customers);
      }
    } catch {}
    setLoaded(true);

    // Lock layout to viewport
    const style = document.createElement("style");
    style.textContent = "html, body, #root { height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }";
    document.head.appendChild(style);
    // Load fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("bt_v2", JSON.stringify({ orders, customers }));
    } catch {}
  }, [orders, customers, loaded]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const fn = e => { if (custRef.current && !custRef.current.contains(e.target)) setCustDrop(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveOrder = () => {
    if (!form.customer) return;
    const active = form.items.filter(i => +i.retailQty > 0 || +i.kgQty > 0);
    if (!active.length) return;
    const order = {
      id: uid(),
      customer: form.customer,
      ts: new Date().toISOString(),
      items: active,
      notes: form.notes,
      status: "open",
    };
    setOrders(p => [order, ...p]);
    if (!customers.includes(form.customer)) {
      setCustomers(p => [...p, form.customer].sort((a, b) => a.localeCompare(b)));
    }
    setForm(emptyForm());
    setTab("open");
  };

  const markPacked = id => {
    setOrders(p => p.map(o => o.id === id ? { ...o, status: "packed" } : o));
    setDetail(p => p?.id === id ? { ...p, status: "packed" } : p);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const openOrders = orders.filter(o => o.status === "open");

  const packedOrders = orders.filter(o => {
    if (o.status !== "packed") return false;
    if (search && !o.customer.toLowerCase().includes(search.toLowerCase())) return false;
    const od = new Date(o.ts), now = new Date();
    if (dateF === "today" && od.toDateString() !== now.toDateString()) return false;
    if (dateF === "week") {
      const w = new Date(now); w.setDate(w.getDate() - 7);
      if (od < w) return false;
    }
    return true;
  });

  const filteredCustomers = customers.filter(c =>
    !form.customer || c.toLowerCase().includes(form.customer.toLowerCase())
  );

  const canSave = form.customer && form.items.some(i => +i.retailQty > 0 || +i.kgQty > 0);

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputStyle = {
    padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${border}`,
    background: "#fff", fontFamily: "'DM Sans', sans-serif",
    fontSize: 14, color: ink, outline: "none",
    width: "100%", boxSizing: "border-box",
  };

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
    color: muted, fontFamily: "'DM Sans', sans-serif",
    display: "block", marginBottom: 6,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: cream, height: "100dvh", overflow: "hidden", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 430, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>

        {/* ════════════════════════ OPEN ORDERS ════════════════════════ */}
        {tab === "open" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ paddingTop: 52, paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#C8844A", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 2 }}>BEANTALE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: ink }}>Open Orders</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: muted, paddingBottom: 4 }}>
                  {openOrders.length} active
                </div>
              </div>
            </div>
            <div style={{ height: 10 }} />
            {openOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: muted, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>☕</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: ink }}>All clear!</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>New orders will appear here</div>
              </div>
            ) : (
              openOrders.map(o => (
                <OrderCard key={o.id} order={o} onMark={markPacked} onClick={() => setDetail(o)} />
              ))
            )}
          </div>
        )}

        {/* ════════════════════════ NEW ORDER ══════════════════════════ */}
        {tab === "new" && (
          <div style={{ padding: "0 16px 24px" }}>
            <div style={{ paddingTop: 52, paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#C8844A", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 2 }}>BEANTALE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: ink }}>New Order</div>
                <button onClick={() => { setForm(emptyForm()); }} style={{
                  background: "none", border: "none", fontSize: 24,
                  cursor: "pointer", color: muted, lineHeight: 1, padding: 4,
                }}>×</button>
              </div>
            </div>
            <div style={{ height: 12 }} />

            {/* Customer */}
            <div style={{ marginBottom: 20 }} ref={custRef}>
              <label style={sectionLabel}>CUSTOMER NAME</label>
              <div style={{ position: "relative" }}>
                <input
                  value={form.customer}
                  onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                  onFocus={() => setCustDrop(true)}
                  placeholder="Select or type customer name"
                  style={inputStyle}
                />
                {custDrop && filteredCustomers.length > 0 && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                    background: "#fff", border: `1px solid ${border}`, borderRadius: 10,
                    boxShadow: "0 8px 20px rgba(26,8,0,0.1)", overflow: "hidden",
                  }}>
                    {filteredCustomers.map(c => (
                      <div
                        key={c}
                        onMouseDown={e => { e.preventDefault(); setForm(f => ({ ...f, customer: c })); setCustDrop(false); }}
                        style={{
                          padding: "11px 14px", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                          color: ink, cursor: "pointer", borderBottom: `1px solid ${border}`,
                          background: form.customer === c ? "#FAF5EE" : "transparent",
                        }}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 72px 72px", gap: "0 8px", marginBottom: 8, paddingLeft: 12 }}>
                <span style={sectionLabel}>COFFEE ORDERS</span>
                <span style={{ ...sectionLabel, textAlign: "center" }}>Retail</span>
                <span style={{ ...sectionLabel, textAlign: "center" }}>1kg Bag</span>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden" }}>
                {form.items.map((it, idx) => {
                  const isLast = idx === form.items.length - 1;
                  return (
                    <div key={it.id} style={{ borderBottom: isLast ? "none" : `1px solid ${border}` }}>
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 72px 72px",
                        gap: "0 8px", alignItems: "center",
                        padding: "10px 12px",
                      }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: ink }}>{it.name}</span>
                        <input
                          type="number" min="0" placeholder="0"
                          value={it.retailQty}
                          onChange={e => {
                            const items = [...form.items];
                            items[idx] = { ...items[idx], retailQty: e.target.value };
                            setForm(f => ({ ...f, items }));
                          }}
                          style={{
                            padding: "8px 4px", textAlign: "center", borderRadius: 6,
                            border: `1.5px solid ${border}`, fontFamily: "'DM Sans', sans-serif",
                            fontSize: 14, color: ink, background: "#FDFAF7",
                            outline: "none", width: "100%", boxSizing: "border-box",
                          }}
                        />
                        <input
                          type="number" min="0" placeholder="0"
                          value={it.kgQty}
                          onChange={e => {
                            const items = [...form.items];
                            items[idx] = { ...items[idx], kgQty: e.target.value };
                            setForm(f => ({ ...f, items }));
                          }}
                          style={{
                            padding: "8px 4px", textAlign: "center", borderRadius: 6,
                            border: `1.5px solid ${border}`, fontFamily: "'DM Sans', sans-serif",
                            fontSize: 14, color: ink, background: "#FDFAF7",
                            outline: "none", width: "100%", boxSizing: "border-box",
                          }}
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={sectionLabel}>NOTES (OPTIONAL)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Special instructions, delivery notes, etc."
                rows={3}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
              />
            </div>

            <button
              onClick={saveOrder}
              disabled={!canSave}
              style={{
                width: "100%", padding: "15px 0", background: ink, border: "none",
                borderRadius: 10, color: "#fff", fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
                cursor: canSave ? "pointer" : "not-allowed",
                opacity: canSave ? 1 : 0.4,
                transition: "opacity 0.2s",
              }}
            >
              SAVE ORDER
            </button>
          </div>
        )}

        {/* ════════════════════════ PACKED ORDERS ══════════════════════ */}
        {tab === "packed" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ paddingTop: 52, paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#C8844A", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 2 }}>BEANTALE</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: ink }}>Packed Orders</div>
                <button
                  onClick={() => setShowF(!showF)}
                  style={{
                    background: showF ? ink : "none", border: `1.5px solid ${showF ? ink : border}`,
                    borderRadius: 20, padding: "5px 12px",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", color: showF ? "#fff" : ink,
                    display: "flex", alignItems: "center", gap: 5, marginBottom: 2,
                    transition: "all 0.15s",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/>
                  </svg>
                  Filter
                </button>
              </div>
            </div>
            <div style={{ height: 8 }} />

            {/* Search bar */}
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by customer name..."
                style={{ ...inputStyle, paddingLeft: 38 }}
              />
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }}
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            {/* Filter panel */}
            {showF && (
              <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${border}`, padding: "14px 14px 12px", marginBottom: 12 }}>
                <label style={{ ...sectionLabel, marginBottom: 6 }}>DATE RANGE</label>
                <select
                  value={dateF}
                  onChange={e => setDateF(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 12 }}
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="all">All time</option>
                </select>
                <button
                  onClick={() => { setSearch(""); setDateF("today"); setShowF(false); }}
                  style={{
                    width: "100%", padding: "9px 0", background: "none",
                    border: `1.5px solid ${border}`, borderRadius: 8,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                    fontSize: 12, letterSpacing: "0.06em", color: muted, cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

            {packedOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: muted, fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📦</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: ink }}>No packed orders</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {dateF === "today" ? "None packed today yet" : "Try adjusting your filters"}
                </div>
              </div>
            ) : (
              packedOrders.map(o => (
                <OrderCard key={o.id} order={o} onMark={markPacked} onClick={() => setDetail(o)} />
              ))
            )}
          </div>
        )}

        </div>
        <BottomNav tab={tab} onChange={setTab} />
        <DetailSheet
          order={detail}
          onClose={() => setDetail(null)}
          onMark={markPacked}
        />
      </div>
    </div>
  );
}
