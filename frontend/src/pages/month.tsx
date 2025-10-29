// src/pages/month.tsx
// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { Link } from "react-router-dom";
import "./month.css";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import BottomNav from "./buttomnav";

export type Transaction = {
    id: string;
    date: string;
    amount: number;
    category: string;
    note?: string;
};

type ApiRepeatedTransaction = {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string;
    frequency: string;
}

const API_BASE =
    (import.meta as any)?.env?.VITE_API_BASE ||
    (import.meta as any)?.env?.REACT_APP_API_BASE ||
    "http://localhost:8081";

const thMonths = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
];
function formatThaiMonthYear(d: Date): string {
    return `${thMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function iso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function pad2(n: number) { return String(n).padStart(2, "0"); }

function thaiWeekdayAbbr(d: Date): string {
    const map = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    return map[d.getDay()];
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

function mapRepeatedToTransaction(rt: ApiRepeatedTransaction): Transaction {
    const amt = Number(rt.amount || 0);
    const isoDate = toISODate(rt.date);
    return {
        id: `R-${rt.id}`,
        date: isoDate,
        amount: -Math.abs(isFinite(amt) ? amt : 0),
        category: rt.name,
        note: `(ซ้ำ: ${rt.frequency})`,
    }
}

function getCurrentUserId(): number | null {
    try {
        const s = localStorage.getItem("userId");
        if (s && !isNaN(Number(s))) return Number(s);
    } catch {}
    try {
        const u = JSON.parse(localStorage.getItem("authUser") || "null");
        if (u && (u.id != null)) return Number(u.id);
    } catch {}
    return null;
}

export default function Month() {
    const [anchor, setAnchor] = useState<Date>(new Date());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const monthLabel = formatThaiMonthYear(anchor);
    const startISO = iso(startOfMonth(anchor));
    const endISO = iso(endOfMonth(anchor));
    const daysInThisMonth = endOfMonth(anchor).getDate();

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const userId = getCurrentUserId();

                const expensesUrl = new URL(`${API_BASE}/api/expenses/range`);
                expensesUrl.searchParams.set("start", startISO);
                expensesUrl.searchParams.set("end", endISO);
                if (userId != null) expensesUrl.searchParams.set("userId", String(userId));

                const repeatedUrl = `${API_BASE}/api/repeated-transactions`;

                const [resExpenses, resRepeated] = await Promise.all([
                    fetch(expensesUrl.toString(), {
                        headers: { Accept: "application/json" },
                        credentials: "include",
                    }),
                    fetch(repeatedUrl, {
                        headers: { Accept: "application/json" },
                        credentials: "include",
                    })
                ]);

                if (!resExpenses.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${resExpenses.status})`);
                if (!resRepeated.ok) throw new Error(`โหลดรายการซ้ำไม่สำเร็จ (${resRepeated.status})`);

                const expensesData = await resExpenses.json();
                const repeatedData: ApiRepeatedTransaction[] = await resRepeated.json();

                if (!alive) return;

                const filteredExpenses = Array.isArray(expensesData)
                    ? expensesData.filter((e: any) => {
                        if (userId == null) return true;
                        const ownerId = e.userId ?? (e.user && e.user.id);
                        return Number(ownerId) === Number(userId);
                    })
                    : [];

                const expenseTxs: Transaction[] = filteredExpenses.map((e: any) => {
                    const dateString = e.occurredAt || e.date;
                    return {
                        id: String(e.id),
                        date: dateString ? String(dateString).slice(0, 10) : "invalid-date",
                        amount: e.type === "EXPENSE" ? -Math.abs(Number(e.amount)) : Math.abs(Number(e.amount)),
                        category: e.category,
                        note: e.note ?? undefined,
                    };
                });

                const startMs = new Date(startISO).getTime();
                const endMs = new Date(endISO).getTime();

                const filteredRepeated = repeatedData.filter(rt => {
                    const isoDate = toISODate(rt.date);
                    try {
                        const rtMs = new Date(isoDate).getTime();
                        return rtMs >= startMs && rtMs <= endMs;
                    } catch {
                        return false;
                    }
                });

                const repeatedTxs: Transaction[] = filteredRepeated.map(mapRepeatedToTransaction);

                setTransactions([...expenseTxs, ...repeatedTxs]);

            } catch (err: any) {
                if (!alive) return;
                setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [startISO, endISO]);

    const { chartSeries, totals, monthRows } = useMemo(() => {
        const dateMap: Record<string, { income: number; expense: number }> = {};
        let inc = 0, exp = 0;

        for (const t of transactions) {
            if (t.date === "invalid-date") continue;
            if (!dateMap[t.date]) dateMap[t.date] = { income: 0, expense: 0 };
            if (t.amount >= 0) {
                dateMap[t.date].income += t.amount;
                inc += t.amount;
            } else {
                const a = Math.abs(t.amount);
                dateMap[t.date].expense += a;
                exp += a;
            }
        }

        const monthRows = Object.keys(dateMap)
            .sort((a, b) => (a < b ? 1 : -1))
            .map(k => {
                const d = new Date(k);
                const dd = pad2(d.getDate());
                const mm = pad2(d.getMonth() + 1);
                const remain = dateMap[k].income - dateMap[k].expense;
                return {
                    dateISO: k,
                    label: `${dd}/${mm}`,
                    income: dateMap[k].income,
                    expense: dateMap[k].expense,
                    remain,
                };
            });

        const chartSeries = Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            if (day > daysInThisMonth) {
                return { day, label: `${pad2(day)}`, income: null, expense: null };
            }
            const key = iso(new Date(anchor.getFullYear(), anchor.getMonth(), day));
            const agg = dateMap[key] || { income: 0, expense: 0 };
            return { day, label: `${pad2(day)}`, income: agg.income, expense: agg.expense };
        });

        return {
            chartSeries,
            totals: { income: inc, expense: exp, balance: inc - exp },
            monthRows,
        };
    }, [transactions, anchor, daysInThisMonth]);

    const prevMonth = () =>
        setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
    const nextMonth = () =>
        setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));

    if (loading) {
        return (
            <div className="month-wrapper">
                <section className="summary-card"><div>กำลังโหลดข้อมูล…</div></section>
                <BottomNav />
            </div>
        );
    }
    if (error) {
        return (
            <div className="month-wrapper">
                <section className="summary-card"><div className="error">{error}</div></section>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="month-wrapper">
            <section className="summary-card">
                <div className="summary-title">สรุปรายเดือน</div>

                <div className="month-switcher">
                    <button className="nav-btn" onClick={prevMonth} aria-label="ก่อนหน้า">
                        <ChevronLeft size={18} />
                    </button>
                    <div className="month-chip">
                        <CalendarDays size={16} className="calendar-ico" />
                        {monthLabel}
                    </div>
                    <button className="nav-btn" onClick={nextMonth} aria-label="ถัดไป">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="kpi-inline">
          <span>
            รายรับ:{" "}
              <b className="income">{totals.income.toLocaleString()} ฿</b>
          </span>
                    <span>
            รายจ่าย:{" "}
                        <b className="expense">{totals.expense.toLocaleString()} ฿</b>
          </span>
                    <span>
            คงเหลือ:{" "}
                        <b className={`balance ${totals.balance < 0 ? "neg" : "pos"}`}>
              {totals.balance.toLocaleString()} ฿
            </b>
          </span>
                </div>

                <div className="chart-card">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart
                            data={chartSeries}
                            margin={{ top: 10, right: 16, left: 10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />

                            <XAxis
                                dataKey="day"
                                type="number"
                                domain={[1, 31]}
                                ticks={Array.from({ length: 31 }, (_, i) => i + 1)}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => pad2(v as number)}
                            />

                            <YAxis tickLine={false} axisLine={false} width={46} />

                            <Tooltip
                                formatter={(value: number) => [`${Number(value ?? 0).toLocaleString()} ฿`, ""]}
                                labelFormatter={(label: number) => `วันที่ ${pad2(label)}`}
                            />

                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                                fill="url(#income)"
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                                fill="url(#expense)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div className="grid-header">
                <div>วันที่</div>
                <div>รายรับ</div>
                <div>รายจ่าย</div>
                <div>คงเหลือ</div>
            </div>

            {monthRows.length === 0 && (
                <div className="row empty">ไม่มีรายการในเดือนนี้</div>
            )}

            {monthRows.map((r) => {
                const d = new Date(r.dateISO);
                const dd = pad2(d.getDate());
                const mm = pad2(d.getMonth() + 1);
                const yyyy = d.getFullYear();
                return (
                    <Link
                        to={`/day?date=${yyyy}-${mm}-${dd}`}
                        key={r.dateISO}
                        className="row"
                        style={{ textDecoration: "none", color: "inherit" }}
                    >
                        <div className="left-badge">{r.label}</div>
                        <div className="cell income">
                            {r.income > 0 ? `${r.income.toLocaleString()} ฿` : "0 ฿"}
                        </div>
                        <div className="cell expense">
                            {r.expense > 0 ? `${r.expense.toLocaleString()} ฿` : "0 ฿"}
                        </div>
                        <div className={`cell remain ${r.remain < 0 ? "neg" : "pos"}`}>
                            {r.remain.toLocaleString()} ฿
                        </div>
                    </Link>
                );
            })}

            <BottomNav />
        </div>
    );
}