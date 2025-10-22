// src/pages/Day.tsx
// @ts-nocheck
import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./day.css";

import {
  Bus,
  Utensils,
  Gift,
  Car,
  Plus,
  Circle,
  CalendarDays,
  ArrowLeft,
  Wallet,
  CreditCard,
  Train,
  Bike,
  Coffee,
  ShoppingCart,
  ShoppingBag,
  Home,
  HeartPulse,
  Fuel,
  MapPin,
  Tag,
  Activity,
} from "lucide-react";

import BottomNav from "./buttomnav";

type ExpenseDTO = {
  id: number;
  type: "EXPENSE" | "INCOME";
  category: string;
  amount: number;
  note?: string | null;
  place?: string | null;
  date: string;
  paymentMethod?: string | null;
  iconKey?: string | null;
};

export type DayItem = {
  id: string;
  category: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  color: string;
  iconKey: string;
};

const COLOR_INCOME = "#10B981";
const COLOR_EXPENSE = "#EF4444";

const ICONS: Record<string, any> = {
  Utensils,
  Train,
  Wallet,
  CreditCard,
  Car,
  Bus,
  Bike,
  Coffee,
  Gift,
  Tag,
  ShoppingBag,
  ShoppingCart,
  Home,
  HeartPulse,
  Activity,
  Fuel,
  MapPin,
};

const EN_ALIAS: Record<string, string> = {
  gift: "Gift",
  present: "Gift",
  wallet: "Wallet",
  cash: "Wallet",
  credit: "CreditCard",
  card: "CreditCard",
  food: "Utensils",
  restaurant: "Utensils",
  home: "Home",
  house: "Home",
  health: "HeartPulse",
  fuel: "Fuel",
  shopping: "ShoppingCart",
  bag: "ShoppingBag",
  map: "MapPin",
  train: "Train",
  car: "Car",
  bus: "Bus",
  bike: "Bike",
  coffee: "Coffee",
  tag: "Tag",
  activity: "Activity",
  handcoins: "Wallet",
};

const TH_ALIAS: Record<string, string> = {
  "ของขวัญ": "Gift",
  "อาหาร": "Utensils",
  "กาแฟ": "Coffee",
  "เดินทาง": "Train",
  "รถ": "Car",
  "รถยนต์": "Car",
  "รถเมล์": "Bus",
  "จักรยาน": "Bike",
  "บ้าน": "Home",
  "สุขภาพ": "HeartPulse",
  "น้ำมัน": "Fuel",
  "ช้อปปิ้ง": "ShoppingCart",
  "ซื้อของ": "ShoppingCart",
  "กระเป๋า": "ShoppingBag",
  "แผนที่": "MapPin",
  "บัตรเครดิต": "CreditCard",
  "เงินสด": "Wallet",
  "ธนาคาร": "Wallet",
  "ลงทุน": "Activity",
};

function normalizeIconKey(raw?: string | null, category?: string | null) {
  const tryDirect = (k: string) =>
    ICONS[k] ? k : Object.keys(ICONS).find((x) => x.toLowerCase() === k.toLowerCase());

  if (raw && raw.trim() !== "") {
    const k = raw.trim();
    const d = tryDirect(k);
    if (d) return d;
    const alias = EN_ALIAS[k.toLowerCase()];
    if (alias) return alias;
  }

  if (category && category.trim() !== "") {
    const c = category.trim().toLowerCase();
    for (const [th, val] of Object.entries(TH_ALIAS)) {
      if (c.includes(th)) return val;
    }
    const d = tryDirect(category);
    if (d) return d;
  }

  return "Utensils";
}

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  (import.meta as any)?.env?.REACT_APP_API_BASE ||
  "http://localhost:8081";

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const thDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear() + 543;
  return `${dd}/${mm}/${yy}`;
};

export default function Day() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const urlDate = sp.get("date");
  const init = urlDate ? new Date(urlDate) : new Date();
  const [anchor, setAnchor] = useState<Date>(init);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<ExpenseDTO[]>([]);

  useEffect(() => {
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      n.set("date", iso(anchor));
      return n;
    }, { replace: true });
  }, [anchor, setSp]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const dayISO = iso(anchor);
        const res = await fetch(
          `${API_BASE}/api/expenses/range?start=${dayISO}&end=${dayISO}`,
          { headers: { Accept: "application/json" }, credentials: "include" }
        );
        if (!res.ok) throw new Error(`โหลดรายการไม่สำเร็จ (${res.status})`);
        const data: ExpenseDTO[] = await res.json();
        if (!alive) return;
        setRaw(data);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [anchor]);

  const items = useMemo<DayItem[]>(() => {
    const map = new Map<
      string,
      { category: string; type: "EXPENSE" | "INCOME"; amount: number; iconKey: string }
    >();
    for (const e of raw) {
      const type = e.type;
      const absVal = Math.abs(Number(e.amount));
      const category = e.category || "อื่นๆ";
      const key = `${type}::${category}`;
      const iconKey = normalizeIconKey(e.iconKey, e.category);
      const prev = map.get(key) || { category, type, amount: 0, iconKey };
      if (!prev.iconKey) prev.iconKey = iconKey;
      prev.amount += absVal;
      map.set(key, prev);
    }
    const arr: DayItem[] = Array.from(map.entries()).map(([key, v]) => ({
      id: key,
      category: v.category,
      type: v.type,
      amount: v.amount,
      color: v.type === "INCOME" ? COLOR_INCOME : COLOR_EXPENSE,
      iconKey: v.iconKey || "Utensils",
    }));
    arr.sort((a, b) => b.amount - a.amount);
    return arr;
  }, [raw]);

  const { series, total } = useMemo(() => {
    const sum = items.reduce((s, v) => s + v.amount, 0);
    const safe = sum === 0 ? 1 : sum;
    const s = items.map((v) => ({
      id: v.id,
      name: v.category,
      value: v.amount,
      color: v.color,
      pct: Math.round((v.amount / safe) * 100),
    }));
    return { series: s, total: sum };
  }, [items]);

  const prevDay = () =>
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 1));
  const nextDay = () =>
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 1));

  const goBackToMonth = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/month");
  };

  const RAD = Math.PI / 180;
  const donutLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const r = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    const val = Math.round((percent || 0) * 100);
    if (!val) return null;
    return (
      <text
        x={x}
        y={y}
        fill="#111827"
        fontSize={12}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {val}%
      </text>
    );
  };

  if (loading) {
    return (
      <div className="day-wrap">
        <section className="day-card"><div>กำลังโหลดข้อมูล…</div></section>
        <BottomNav />
      </div>
    );
  }
  if (error) {
    return (
      <div className="day-wrap">
        <section className="day-card"><div className="error">{error}</div></section>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="day-wrap">
      <section className="day-card">
        <div className="card-head">
          <button
            className="back-link"
            onClick={goBackToMonth}
            aria-label="กลับหน้าสรุปรายเดือน"
            title="กลับหน้าสรุปรายเดือน"
          >
            <ArrowLeft size={21} />
            <span>กลับ</span>
          </button>

          <h2 className="card-title">สรุปรายวัน</h2>
          <div />
        </div>

        <div className="switcher">
          <button className="nav-btn" onClick={prevDay} aria-label="ก่อนหน้า">‹</button>
          <div className="date-chip">
            <CalendarDays size={15} /> {thDate(anchor)}
          </div>
          <button className="nav-btn" onClick={nextDay} aria-label="ถัดไป">›</button>
        </div>

        <div className="donut-box">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={series}
                dataKey="value"
                nameKey="name"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
                label={donutLabel}
                labelLine={false}
              >
                {series.map((s) => (
                  <Cell key={s.id} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, _n, p: any) => [
                  `฿${Number(v).toLocaleString()}`,
                  p?.payload?.name ?? "",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="list-head">
        <div />
        <div>ประเภท</div>
        <div>เปอร์เซ็นต์</div>
        <div>จำนวนเงิน</div>
      </div>

      <section className="list">
        {items.length === 0 ? (
          <div className="empty">วันนี้ยังไม่มีรายการ</div>
        ) : (
          items.map((it) => {
            const IK = it.iconKey || "Utensils";
            const Icon = ICONS[IK] || Circle;
            return (
              <div className="item" key={it.id}>
                <div
                  className="icon-bubble"
                  style={{ background: it.color }}
                  title={it.type === "INCOME" ? "รายรับ" : "รายจ่าย"}
                >
                  <Icon size={17} color="#fff" strokeWidth={2} />
                </div>
                <div className="name">{it.category}</div>
                <div className="percent">
                  {total ? Math.round((it.amount / total) * 100) : 0} %
                </div>
                <div className="amount">{it.amount.toLocaleString()} ฿</div>
              </div>
            );
          })
        )}
      </section>

      <BottomNav />
    </div>
  );
}
