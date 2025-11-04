import React, { useMemo, useState } from "react";
import "./more.css";
import { RefreshCw, Banknote, FileSpreadsheet, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadCsvFile } from "../lib/csv";
import { fetchAllTransactions, ExpenseDTO } from "../lib/api";

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

            const items: ExpenseDTO[] = await fetchAllTransactions();

            if (!Array.isArray(items) || items.length === 0) {
                alert("ไม่พบข้อมูลที่จะ Export 🤷‍♀️");
                console.warn("fetchAllTransactions returned empty or invalid data.");
                return;
            }

            const rows = items.map((x) => ({
                // --- ⬇️ แก้ไขบรรทัดนี้ ---
                วันที่: x.date ?? x.occurredAt ?? "", // เอา .slice(0, 10) ออก
                // --- ⬆️ สิ้นสุดการแก้ไข ---
                ประเภท: x.category ?? "",
                จำนวนเงิน: x.type === "EXPENSE" ? -Math.abs(x.amount) : Math.abs(x.amount),
                โน้ต: x.note ?? "",
                สถานที่: x.place ?? "",
                การชำระเงิน: x.paymentMethod ?? "",
                ประเภทบันทึก: x.type ?? "EXPENSE",
            }));

            downloadCsvFile(`expenses-export-${new Date().toISOString().slice(0,10)}.csv`, rows);

        } catch (e) {
            console.error("Export failed:", e);
            alert("Export ข้อมูลไม่สำเร็จ ❌ (ไม่สามารถเชื่อมต่อ API ได้)");
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