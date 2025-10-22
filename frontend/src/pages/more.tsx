// src/pages/more.tsx
// @ts-nocheck
import React, { useMemo, useState } from "react";
import "./more.css";
import {
    RefreshCw,
    Banknote,
    FileSpreadsheet,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8081";

// helpers: current date/year/month
const todayISO = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const thisYear = () => new Date().getFullYear();
const thisMonth = () => new Date().getMonth() + 1; // 1..12

export default function More() {
    const navigate = useNavigate();
    const [openCsv, setOpenCsv] = useState(false);
    const [downloading, setDownloading] = useState<null | "all" | "month" | "day">(null);

    // normal rows (no dropdown)
    const rows = useMemo(
        () => [
            { key: "recurring", label: "ธุรกรรมที่เกิดซ้ำ", icon: RefreshCw, onClick: () => navigate("/recurring") },
            { key: "tax",       label: "คำนวณภาษีลดหย่อน", icon: Banknote,  onClick: () => navigate("/tax") },
            // csv is handled separately with dropdown
        ],
        [navigate]
    );

    const downloadCsv = async (range: "all" | "month" | "day") => {
        try {
            setDownloading(range);

            const params = new URLSearchParams();
            params.set("type", "expense"); // or "income" if needed
            params.set("range", range);

            if (range === "day") {
                params.set("date", todayISO());             // ใช้วันปัจจุบัน
            } else if (range === "month") {
                params.set("year", String(thisYear()));     // ใช้เดือนปัจจุบัน
                params.set("month", String(thisMonth()));   // 1..12
            }

            const res = await fetch(`${API_BASE}/api/export?` + params.toString(), {
                method: "GET",
                credentials: "include",
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || "Download failed");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `expenses-${range}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            setOpenCsv(false);
        } catch (e) {
            alert("ดาวน์โหลดไม่สำเร็จ ❌");
            console.error(e);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="more-wrap">
            <h2 className="more-title">รายการเพิ่มเติม</h2>

            <section className="pill-list" aria-label="รายการเพิ่มเติม">
                {/* regular items */}
                {rows.map((r) => {
                    const Icon = r.icon;
                    return (
                        <button key={r.key} className="pill-row" onClick={r.onClick} aria-label={r.label}>
              <span className="left">
                <span className="icon-wrap">
                  <Icon className="lucide" size={22} strokeWidth={2} />
                </span>
                <span className="label">{r.label}</span>
              </span>
                            <ChevronRight size={18} className="chev" aria-hidden="true" />
                        </button>
                    );
                })}

                {/* Export CSV with dropdown */}
                <div className={`pill-accordion ${openCsv ? "open" : ""}`}>
                    <button
                        className="pill-row"
                        onClick={() => setOpenCsv((v) => !v)}
                        aria-expanded={openCsv}
                        aria-controls="csv-dropdown"
                    >
            <span className="left">
              <span className="icon-wrap">
                <FileSpreadsheet className="lucide" size={22} strokeWidth={2} />
              </span>
              <span className="label">Export CSV</span>
            </span>
                        <ChevronDown size={18} className={`chev ${openCsv ? "rot" : ""}`} aria-hidden="true" />
                    </button>

                    <div id="csv-dropdown" className={`dropdown ${openCsv ? "show" : ""}`} role="menu">
                        <button className="dropdown-item" onClick={() => downloadCsv("all")} role="menuitem" disabled={downloading === "all"}>
                            {downloading === "all" ? "กำลังดาวน์โหลด..." : "ทั้งหมด"}
                        </button>
                        <button className="dropdown-item" onClick={() => downloadCsv("month")} role="menuitem" disabled={downloading === "month"}>
                            {downloading === "month" ? "กำลังดาวน์โหลด..." : "รายเดือน (เดือนปัจจุบัน)"}
                        </button>
                        <button className="dropdown-item" onClick={() => downloadCsv("day")} role="menuitem" disabled={downloading === "day"}>
                            {downloading === "day" ? "กำลังดาวน์โหลด..." : "รายวัน (วันนี้)"}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
