import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "./buttomnav";
import "./buttomnav.css";
import "./Home.css";
import {
    Building2, Landmark, CreditCard, Wallet, PiggyBank, Coins, MoreVertical, Edit2, Trash2,
    Utensils, Train, Car, Bus, Bike, Coffee, Gift, Tag, ShoppingBag, ShoppingCart,
    Home as HomeIcon, HeartPulse, Activity, Fuel, MapPin, RefreshCw,Pizza
} from "lucide-react";
import { CUSTOM_ICONS as CUSTOM_INCOME_ICONS } from "./customincome";
import { CUSTOM_ICONS as CUSTOM_OUTCOME_ICONS } from "./customoutcome";

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
    occurredAt?: string | null;
};

type Account = {
    id: number;
    name: string;
    amount: number;
    iconKey?: string
};

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    bank: Building2,
    banknote: Coins,
    landmark: Landmark,
    credit: CreditCard,
    wallet: Wallet,
    piggy: PiggyBank,
    coins: Coins,
};

const BUILTIN_ICONS: Record<string, React.ComponentType<any>> = {
    Utensils, Train, Wallet, CreditCard, Car, Bus, Bike, Coffee, Gift, Tag,
    ShoppingBag, ShoppingCart, Home: HomeIcon, HeartPulse, Activity, Fuel, MapPin,
    RefreshCw, Pizza
};

const ICONS: Record<string, React.ComponentType<any>> = {
    ...BUILTIN_ICONS,
    ...CUSTOM_INCOME_ICONS,
    ...CUSTOM_OUTCOME_ICONS,
};

// เพิ่ม Alias maps ที่คัดลอกมาจาก summary.tsx
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
    handcoins: "HandCoins",
    pizza: "Pizza" // <-- เพิ่ม pizza
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
    "ลงทุน": "Activity"
};

// ฟังก์ชัน normalizeIconKey ตัวเต็ม
function normalizeIconKey(raw?: string | null, category?: string | null) {
    const tryDirect = (k: string) => {
        if (ICONS[k]) return k;
        const found = Object.keys(ICONS).find((x) => x.toLowerCase() === k.toLowerCase());
        return found || undefined;
    };

    if (raw && raw.trim() !== "") {
        const k = raw.trim();
        const direct = tryDirect(k);
        if (direct) return direct;
        const alias = EN_ALIAS[k.toLowerCase()];
        if (alias) return alias;
    }

    if (category && category.trim() !== "") {
        const c = category.trim().toLowerCase();
        for (const [th, val] of Object.entries(TH_ALIAS)) {
            if (c.includes(th)) return val;
        }
        const direct = tryDirect(category);
        if (direct) return direct;
    }

    if (raw && raw.toLowerCase() === 'pizza' && ICONS['Pizza']) return 'Pizza';
    if (category && category.toLowerCase() === 'pizza' && ICONS['Pizza']) return 'Pizza';

    return "Utensils";
}

function IconByKey(props: { name?: string | null; category?: string | null; size?: number }) {
    const { name, category, size = 18 } = props; // ใช้ size 18 (เท่าของเดิมใน home.tsx)
    const key = normalizeIconKey(name, category);
    const Icon = ICONS[key] || Utensils;
    return <Icon size={size} className="tx-icon" />;
}

function formatTH(n: number) { return n.toLocaleString("th-TH"); }
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

function toISODate(anyDate: string): string {
    if (!anyDate) return new Date().toISOString().slice(0, 10);
    const s = anyDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) { const [y,m,d]=s.split("/"); return `${y}-${m}-${d}`; }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { const [d,m,y]=s.split("/"); return `${y}-${m}-${d}`; }
    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) { const [d,m,y]=s.split("-"); return `${y}-${m}-${d}`; }
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? new Date().toISOString().slice(0,10) : dt.toISOString().slice(0,10);
}

type ApiRepeatedTransaction = {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string;
    frequency: string;
}

function mapRepeatedToExpenseDTO(rt: ApiRepeatedTransaction): ExpenseDTO {
    const amt = Number(rt.amount || 0);
    const iso = toISODate(rt.date);
    return {
        id: rt.id,
        type: "EXPENSE",
        category: rt.name,
        amount: Math.abs(isFinite(amt) ? amt : 0),
        note: `(ซ้ำ: ${rt.frequency})`,
        place: null,
        date: iso,
        occurredAt: null,
        paymentMethod: rt.account,
        iconKey: "RefreshCw"
    }
}

export default function Home() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [openMenu, setOpenMenu] = useState<number | null>(null);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/accounts`, {
                headers: { Accept: "application/json" },
                credentials: "include",
            });
            if (!res.ok) {
                if (res.status === 401) {
                    navigate("/login");
                }
                throw new Error(`โหลดบัญชีไม่สำเร็จ (${res.status})`);
            }
            const data: Account[] = await res.json();
            setAccounts(data);
        } catch (e) {
            console.error("Error fetching accounts:", e);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const [latestTransaction, setLatestTransaction] = useState<ExpenseDTO | null>(null);
    const [latestLoading, setLatestLoading] = useState(true);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                setLatestLoading(true);
                const [resExpenses, resRepeated] = await Promise.all([
                    fetch(`${API_BASE}/api/expenses`, {
                        headers: { Accept: "application/json" },
                        credentials: "include",
                    }),
                    fetch(`${API_BASE}/api/repeated-transactions`, {
                        headers: { Accept: "application/json" },
                        credentials: "include",
                    })
                ]);

                if (!resExpenses.ok) throw new Error("Failed to load expenses");
                if (!resRepeated.ok) throw new Error("Failed to load repeated tx");

                const serverData: ExpenseDTO[] = await resExpenses.json();
                const repeatedData: ApiRepeatedTransaction[] = await resRepeated.json();
                const repeatedAsExpenses = repeatedData.map(mapRepeatedToExpenseDTO);

                const allData = [...serverData, ...repeatedAsExpenses];

                const sorted = allData.sort((a, b) => {
                    const dateA = a.occurredAt || a.date;
                    const dateB = b.occurredAt || b.date;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                });

                setLatestTransaction(sorted.length > 0 ? sorted[0] : null);
            } catch (e) {
                console.error("Failed to fetch latest transaction:", e);
                setLatestTransaction(null);
            } finally {
                setLatestLoading(false);
            }
        };

        fetchLatest();
    }, []);

    useEffect(() => {
        const onDocClick = () => setOpenMenu(null);
        if (openMenu !== null) {
            document.addEventListener("click", onDocClick);
            return () => document.removeEventListener("click", onDocClick);
        }
    }, [openMenu]);

    const totalAccounts = useMemo(
        () => accounts.reduce((sum, a) => sum + (Number(a.amount) || 0), 0),
        [accounts]
    );

    const handleDelete = async (id: number) => {
        const acc = accounts.find(a => a.id === id);
        if (!acc) return;

        if (!window.confirm(`ลบบัญชี “${acc.name}” ใช่ไหม?`)) return;

        try {
            const res = await fetch(`${API_BASE}/api/accounts/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (res.ok) {
                setAccounts(prev => prev.filter(a => a.id !== id));
            } else {
                const errorText = await res.text();
                alert(`ลบไม่สำเร็จ: ${errorText}`);
            }
        } catch (e) {
            alert(`เกิดข้อผิดพลาด: ${e}`);
        }
        setOpenMenu(null);
    };

    const handleEdit = (account: Account) => {
        navigate("/accountnew", { state: { mode: "edit", account: account } });
    };

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const prevMonth = () => (month === 1 ? (setMonth(12), setYear((y) => y - 1)) : setMonth((m) => m - 1));
    const nextMonth = () => (month === 12 ? (setMonth(1), setYear((y) => y + 1)) : setMonth((m) => m + 1));

    const [{ loading, error, data }, setState] = useState({
        loading: true, error: null as any, data: [] as ExpenseDTO[]
    });

    const fetchMonth = async () => {
        try {
            setState((s) => ({ ...s, loading: true, error: null }));
            const { start, end } = monthRangeISO(year, month);

            const [resExpenses, resRepeated] = await Promise.all([
                fetch(`${API_BASE}/api/expenses/range?start=${start}&end=${end}`, {
                    headers: { Accept: "application/json" },
                    credentials: "include",
                }),
                fetch(`${API_BASE}/api/repeated-transactions`, {
                    headers: { Accept: "application/json" },
                    credentials: "include",
                })
            ]);

            if (!resExpenses.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${resExpenses.status})`);
            if (!resRepeated.ok) throw new Error(`โหลดรายการซ้ำไม่สำเร็จ (${resRepeated.status})`);

            const serverData: ExpenseDTO[] = await resExpenses.json();
            const allRepeatedData: ApiRepeatedTransaction[] = await resRepeated.json();

            const startMs = +new Date(`${start}T00:00:00`);
            const endMs = +new Date(`${end}T23:59:59`);

            const filteredRepeated = allRepeatedData.filter(x => {
                const iso = toISODate(String(x.date || ""));
                const ms = +new Date(`${iso}T00:00:00`);
                return !isNaN(ms) && ms >= startMs && ms <= endMs;
            });

            const repeatedAsExpenses = filteredRepeated.map(mapRepeatedToExpenseDTO);

            setState({ loading: false, error: null, data: [...serverData, ...repeatedAsExpenses] });
        } catch (e: any) {
            setState({ loading: false, error: e?.message || "เกิดข้อผิดพลาด", data: [] });
        }
    };

    useEffect(() => { fetchMonth(); }, [year, month]);

    const { monthIncome, monthExpense, monthBalance } = useMemo(() => {
        const signedList = data.map((e) => ({
            ...e,
            _signed: signed(e.amount, e.type),
            _dateMs: +new Date(toISODate(e.occurredAt || e.date)),
        }));
        const income = signedList.filter((x) => x._signed > 0).reduce((s, x) => s + x._signed, 0);
        const expenseAbs = signedList.filter((x) => x._signed < 0).reduce((s, x) => s + Math.abs(x._signed), 0);
        const balance = income - expenseAbs;

        return { monthIncome: income, monthExpense: expenseAbs, monthBalance: balance };
    }, [data]);

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

                {latestLoading && <div className="transaction-empty">กำลังโหลดข้อมูล…</div>}

                {!latestLoading && !latestTransaction && (
                    <div className="transaction-empty">ยังไม่มีรายการ</div>
                )}

                {!latestLoading && latestTransaction && (() => {
                    const tx = latestTransaction;
                    const amt = signed(tx.amount, tx.type);
                    const color = amt < 0 ? "#ef4444" : "#16a34a";
                    const title = tx.category || "-";

                    return (
                        <div className="transaction-item" key={tx.id}>
                            <div className="transaction-info">
                                <div className="transaction-avatar">
                                    <IconByKey name={tx.iconKey} category={tx.category} />
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
                })()}


                <div className="category-grid">
                    {accounts.map((acc) => {
                        const Icon = ICON_MAP[acc.iconKey || "bank"] || Building2;
                        const isOpen = openMenu === acc.id;
                        const amt = Number(acc.amount) || 0;

                        return (
                            <div className="category-card has-more" key={acc.id}>
                                <button
                                    className="more-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setOpenMenu((cur) => (cur === acc.id ? null : acc.id));
                                    }}
                                    aria-label="More actions"
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {isOpen && (
                                    <div className="more-menu" onClick={(e) => e.stopPropagation()}>
                                        <button className="more-item" onClick={() => handleEdit(acc)}>
                                            <Edit2 size={16} />
                                            <span>แก้ไข</span>
                                        </button>
                                        <button className="more-item danger" onClick={() => handleDelete(acc.id)}>
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