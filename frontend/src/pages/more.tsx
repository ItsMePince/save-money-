// src/pages/more.tsx
import React, { useMemo, useState } from "react";
import "./more.css";
import { RefreshCw, Banknote, FileSpreadsheet, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadCsvFile } from "../lib/csv";
import { getExpensesForRange } from "../lib/offlineStore";

const DEFAULT_RANGE: "all" | "month" | "day" = "all";

export default function More() {
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);

    const rows = useMemo(
        () => [
            { key: "recurring", label: "ธุรกรรมที่เกิดซ้ำ", icon: RefreshCw, onClick: () => navigate("/recurring") },
            { key: "tax", label: "คำนวณภาษีลดหย่อน", icon: Banknote, onClick: () => navigate("/tax") },
        ],
        [navigate]
    );

    async function handleExportOffline() {
        try {
            setDownloading(true);
            const items = await getExpensesForRange(DEFAULT_RANGE, new Date());
            const rows = items.map((x: any) => ({
                วันที่: x.date ?? (x.occurredAt ? x.occurredAt.slice(0, 10) : ""),
                ประเภท: x.category ?? "",
                จำนวนเงิน: x.amount ?? 0,
                โน้ต: x.note ?? "",
                สถานที่: x.place ?? "",
                การชำระเงิน: x.paymentMethod ?? "",
                ประเภทบันทึก: x.type ?? "EXPENSE",
            }));
            downloadCsvFile(`expenses-${DEFAULT_RANGE}.csv`, rows);
        } catch (e) {
            alert("Export ออฟไลน์ไม่สำเร็จ ❌");
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
                <button className="pill-row" onClick={handleExportOffline} aria-label="Export CSV" disabled={downloading}>
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
