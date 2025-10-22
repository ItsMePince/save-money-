// src/pages/Home.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "./buttomnav";
import "./buttomnav.css";
import "./Home.css";
import {
  Building2, Landmark, CreditCard, Wallet, PiggyBank, Coins, MoreVertical, Edit2, Trash2,
  Utensils, Train, Car, Bus, Bike, Coffee, Gift, Tag, ShoppingBag, ShoppingCart,
  Home as HomeIcon, HeartPulse, Activity, Fuel, MapPin
} from "lucide-react";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  (import.meta as any)?.env?.REACT_APP_API_BASE ||
  "http://localhost:8081";

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

type Account = { name: string; amount: number | string; iconKey?: string };

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  bank: Building2,
  banknote: Coins,
  landmark: Landmark,
  credit: CreditCard,
  wallet: Wallet,
  piggy: PiggyBank,
  coins: Coins,
};

const TX_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Utensils, Train, Car, Bus, Bike, Coffee, Gift, Tag, ShoppingBag, ShoppingCart,
  Home: HomeIcon, HeartPulse, Activity, Fuel, MapPin, Wallet, CreditCard,
};

function IconByKey({ name, size = 18 }: { name?: string | null; size?: number }) {
  const Key = (name || "").trim();
  const Icon = (Key && TX_ICONS[Key]) || Utensils;
  return <Icon size={size} className="tx-icon" />;
}

function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem("accounts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    { name: "ไทยพาณิชย์", amount: 20000, iconKey: "bank" },
    { name: "กสิกรไทย", amount: 20000, iconKey: "wallet" },
  ];
}
function saveAccounts(list: Account[]) {
  localStorage.setItem("accounts", JSON.stringify(list));
}
function formatTH(n: number) {
  return n.toLocaleString("th-TH");
}
function pad2(n: number) { return String(n).padStart(2, "0"); }
function monthRangeISO(year: number, month1to12: number) {
  const start = `${year}-${pad2(month1to12)}-01`;
  const endDate = new Date(year, month1to12, 0).getDate();
  const end = `${year}-${pad2(month1to12)}-${pad2(endDate)}`;
  return { start, end };
}
function signed(n: number, type: "EXPENSE" | "INCOME") {
  const v = Math.abs(Number(n));
  return type === "EXPENSE" ? -v : v;
}

export default function Home() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  useEffect(() => { setAccounts(loadAccounts()); }, []);
  useEffect(() => {
    const onDocClick = () => setOpenMenu(null);
    if (openMenu !== null) {
      document.addEventListener("click", onDocClick);
      return () => document.removeEventListener("click", onDocClick);
    }
  }, [openMenu]);

  const totalAccounts = useMemo(
    () =>
      accounts.reduce((sum, a) => {
        const num =
          typeof a.amount === "string" ? parseFloat(a.amount || "0") : Number(a.amount || 0);
        return sum + (Number.isFinite(num) ? num : 0);
      }, 0),
    [accounts]
  );

  const handleDelete = (idx: number) => {
    const acc = accounts[idx];
    const ok = window.confirm(`ลบบัญชี “${acc.name}” ใช่ไหม?`);
    if (!ok) return;
    const next = accounts.filter((_, i) => i !== idx);
    setAccounts(next);
    saveAccounts(next);
    setOpenMenu(null);
  };
  const handleEdit = (idx: number) => {
    const acc = accounts[idx];
    navigate("/accountnew", { state: { mode: "edit", index: idx, account: acc } });
  };

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const prevMonth = () => (month === 1 ? (setMonth(12), setYear((y) => y - 1)) : setMonth((m) => m - 1));
  const nextMonth = () => (month === 12 ? (setMonth(1), setYear((y) => y + 1)) : setMonth((m) => m + 1));

  const [{ loading, error, data }, setState] = useState({ loading: true, error: null as any, data: [] as ExpenseDTO[] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        const { start, end } = monthRangeISO(year, month);
        const res = await fetch(`${API_BASE}/api/expenses/range?start=${start}&end=${end}`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${res.status})`);
        const json: ExpenseDTO[] = await res.json();
        if (!alive) return;
        setState({ loading: false, error: null, data: json });
      } catch (e: any) {
        if (!alive) return;
        setState({ loading: false, error: e?.message || "เกิดข้อผิดพลาด", data: [] });
      }
    })();
    return () => { alive = false; };
  }, [year, month]);

  const { monthIncome, monthExpense, monthBalance, recent } = useMemo(() => {
    const signedList = data.map((e) => ({
      ...e,
      _signed: signed(e.amount, e.type),
      _dateMs: +new Date(e.date),
    }));
    const income = signedList.filter((x) => x._signed > 0).reduce((s, x) => s + x._signed, 0);
    const expenseAbs = signedList.filter((x) => x._signed < 0).reduce((s, x) => s + Math.abs(x._signed), 0);
    const balance = income - expenseAbs;
    const last1 = [...signedList]
      .sort((a, b) => (a._dateMs === b._dateMs ? b.id - a.id : b._dateMs - a._dateMs))
      .slice(0, 1);
    return { monthIncome: income, monthExpense: expenseAbs, monthBalance: balance, recent: last1 };
  }, [data]);

  // ✅ แก้: รวม บัญชี + รายได้ − ค่าใช้จ่าย
  const walletBalance = useMemo(
    () => totalAccounts + monthIncome - monthExpense,
    [totalAccounts, monthIncome, monthExpense]
  );

  return (
    <div className="App">
      <div className="main-content">
        <div className="balance-card">
          <div className="balance-display">
            <p className="balance-label">เงินรวม</p>
            <p className="balance-amount">{formatTH(walletBalance)} บาท</p>
          </div>
          <div className="month-year-nav">
            <button onClick={prevMonth} aria-label="Previous month">←</button>
            <span>{month}/{year}</span>
            <button onClick={nextMonth} aria-label="Next month">→</button>
          </div>
          <div className="action-buttons">
            <button className="action-button" title="คงเหลือ (รายรับ-รายจ่าย)">
              <div className="action-icon">
                <span style={{ fontSize: 18, fontWeight: "bold", color: monthBalance < 0 ? "#ef4444" : "#16a34a" }}>
                  {monthBalance < 0 ? "-" : ""}{formatTH(Math.abs(monthBalance))}
                </span>
              </div>
              <span className="action-label">ทั้งหมด</span>
            </button>
            <button className="action-button" title="รายได้รวมเดือนนี้">
              <div className="action-icon">
                <span style={{ fontSize: 18, fontWeight: "bold", color: "#16a34a" }}>
                  {formatTH(monthIncome)}
                </span>
              </div>
              <span className="action-label">รายได้</span>
            </button>
            <button className="action-button" title="รายจ่ายรวมเดือนนี้">
              <div className="action-icon">
                <span style={{ fontSize: 18, fontWeight: "bold", color: "#ef4444" }}>
                  -{formatTH(monthExpense)}
                </span>
              </div>
              <span className="action-label">ค่าใช้จ่าย</span>
            </button>
          </div>
        </div>

        <div className="transaction-header">
          <span className="transaction-title active">ล่าสุด</span>
          <Link to="/summary" className="transaction-link">ดูทั้งหมด</Link>
        </div>

        {loading && <div className="transaction-empty">กำลังโหลดข้อมูล…</div>}
        {error && !loading && <div className="transaction-empty neg">{String(error)}</div>}
        {!loading && !error && recent.length === 0 && (
          <div className="transaction-empty">ยังไม่มีรายการในเดือนนี้</div>
        )}

        {!loading && !error && recent.map((tx) => {
          const amt = signed(tx.amount, tx.type);
          const color = amt < 0 ? "#ef4444" : "#16a34a";
          const title = (tx.note && tx.note.trim() !== "") ? tx.note : (tx.category || "-");
          return (
            <div className="transaction-item" key={tx.id}>
              <div className="transaction-info">
                <div className="transaction-avatar">
                  <IconByKey name={tx.iconKey} />
                </div>
                <div className="transaction-texts">
                  <span className="transaction-description">{title}</span>
                  <span className="transaction-sub"></span>
                </div>
              </div>
              <span className="transaction-amount" style={{ color }}>
                {amt < 0 ? "-" : "+"}{formatTH(Math.abs(amt))}
              </span>
            </div>
          );
        })}

        <div className="category-grid">
          {accounts.map((acc, idx) => {
            const Icon = ICON_MAP[acc.iconKey || "bank"] || Building2;
            const isOpen = openMenu === idx;
            const amt =
              typeof acc.amount === "string" ? parseFloat(acc.amount || "0") : Number(acc.amount || 0);

            return (
              <div className="category-card has-more" key={acc.name + idx}>
                <button
                  className="more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setOpenMenu((cur) => (cur === idx ? null : idx));
                  }}
                  aria-label="More actions"
                >
                  <MoreVertical size={18} />
                </button>

                {isOpen && (
                  <div className="more-menu" onClick={(e) => e.stopPropagation()}>
                    <button className="more-item" onClick={() => handleEdit(idx)}>
                      <Edit2 size={16} />
                      <span>แก้ไข</span>
                    </button>
                    <button className="more-item danger" onClick={() => handleDelete(idx)}>
                      <Trash2 size={16} />
                      <span>ลบ</span>
                    </button>
                  </div>
                )}

                <div className="category-icon"><Icon className="cat-icon" /></div>
                <p className="category-name">{acc.name}</p>
                <p className="category-amount">{formatTH(amt)} บาท</p>
              </div>
            );
          })}

          <Link to="/accountnew" className="category-card">
            <div className="category-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "2rem", color: "#374151" }}>+</span>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
