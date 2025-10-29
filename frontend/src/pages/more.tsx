// @ts-nocheck
import React, { useMemo, useState } from "react";
import "./more.css";
import { RefreshCw, Banknote, FileSpreadsheet, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadCsvFile } from "../lib/csv";

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:8081";

type ExpenseDTO = {
    id: number;
    type: "EXPENSE" | "INCOME";
    category: string;
    amount: number;
    note?: string | null;
    place?: string | null;
    occurredAt?: string | null;
    date?: string | null;
    paymentMethod?: string | null;
    iconKey?: string | null;
};

type ApiRepeatedTransaction = {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string;
    frequency: string;
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

export default function More() {
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);

    const rows = useMemo(
        () => [
            { key: "recurring", label: "ธุรกรรมที่เกิดซ้ำ", icon: RefreshCw, onClick: () => navigate("/repeated-transactions") },
            { key: "tax", label: "คำนวณภาษีลดหย่อน", icon: Banknote, onClick: () => navigate("/tax") },
        ],
        [navigate]
    );

    async function handleExport() {
        try {
            setDownloading(true);

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

            if (!resExpenses.ok) throw new Error(`โหลด (Expenses) ไม่สำเร็จ (${resExpenses.status})`);
            if (!resRepeated.ok) throw new Error(`โหลด (Repeated) ไม่สำเร็จ (${resRepeated.status})`);

            const serverData: ExpenseDTO[] = await resExpenses.json();
            const repeatedData: ApiRepeatedTransaction[] = await resRepeated.json();

            const repeatedAsExpenses = repeatedData.map(mapRepeatedToExpenseDTO);
            const allData = [...serverData, ...repeatedAsExpenses];

            if (allData.length === 0) {
                alert("ไม่มีข้อมูลให้ Export 🤷");
                return;
            }

            const cleanData = allData.map(e => ({
                datetime: e.occurredAt || `${toISODate(e.date)}T00:00:00`,
                type: e.type,
                category: e.category,
                amount: e.type === "EXPENSE" ? -Math.abs(e.amount) : Math.abs(e.amount),
                payment_method: e.paymentMethod,
                place: e.place,
                note: e.note,
            })).sort((a, b) => (b.datetime || "").localeCompare(a.datetime || ""));

            downloadCsvFile("expenses_export_all.csv", cleanData);

        } catch (e: any) {
            console.error("Export ล้มเหลว:", e);
            alert(`Export ล้มเหลว ❌\n${e.message}`);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="more-wrap">
            <h2 className="more-title">รายการเพิ่มเติม</h2>
            <section className="pill-list" aria-label="รายการเพิ่มเติม">
                {rows.map((r) => {
                    const Icon = r.icon;
                    return (
                        <button key={r.key} className="pill-row" onClick={r.onClick} aria-label={r.label}>
              <span className="left">
                <span className="icon-wrap"><Icon className="lucide" size={22} strokeWidth={2} /></span>
                <span className="label">{r.label}</span>
              </span>
                            <ChevronRight size={18} className="chev" aria-hidden="true" />
                        </button>
                    );
                })}
                <button className="pill-row" onClick={handleExport} aria-label="Export CSV" disabled={downloading}>
          <span className="left">
            <span className="icon-wrap">
              <FileSpreadsheet className="lucide" size={22} strokeWidth={2} />
            </span>
            <span className="label">{downloading ? "กำลังส่งออก..." : "Export CSV"}</span>
          </span>
                    <ChevronRight size={18} className="chev" aria-hidden="true" />
                </button>
            </section>
        </div>
    );
}