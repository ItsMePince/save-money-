import React from "react";
import FooterNav from "../../shared/FooterNav";

type Num = number | string | null | undefined;
type Summary = {
  incomePerYear: Num;
  expense50pct: Num;
  totalDeductions: Num;
  taxableIncome: Num;
  taxWithheld: Num;
  taxByBracket: Num;
  netTax: Num;
};

type Props = {
  summary: Summary;
  onBack: () => void;
};

const fmt = (v: Num) => {
  const n = typeof v === "string" ? Number(v.replace(/,/g, "")) : Number(v ?? 0);
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
};

export default function SummaryStep({ summary, onBack }: Props) {
  const {
    incomePerYear = 0,
    expense50pct = 0,
    totalDeductions = 0,
    taxableIncome = 0,
    taxWithheld = 0,
    taxByBracket = 0,
    netTax = 0,
  } = summary || ({} as Summary);

  const net = Number(netTax || 0);
  const isRefund = net < 0;

  return (
    <div className="tax-step">
      <div className="card">
        <div className="section-title" style={{ color: "var(--mint)" }}>
          สรุป
        </div>

        <ul className="sum-list">
          <li className="sum-row">
            <span className="sum-label">รายได้รวมต่อปี</span>
            <span className="sum-value mint">{fmt(incomePerYear)}</span>
            <span className="sum-unit">บาท</span>
          </li>

          <li className="sum-row">
            <span className="sum-label">หักค่าใช้จ่าย (50%)</span>
            <span className="sum-value mint">{fmt(expense50pct)}</span>
            <span className="sum-unit">บาท</span>
          </li>

          <li className="sum-row">
            <span className="sum-label">รวมลดหย่อนทั้งหมด</span>
            <span className="sum-value mint">{fmt(totalDeductions)}</span>
            <span className="sum-unit">บาท</span>
          </li>

          <li className="sum-row">
            <span className="sum-label">รายได้สุทธิ เพื่อคำนวณภาษี</span>
            <span className="sum-value mint">{fmt(taxableIncome)}</span>
            <span className="sum-unit">บาท</span>
          </li>

          <li className="sum-row">
            <span className="sum-label">ภาษีที่ถูกหัก ณ ที่จ่าย</span>
            <span className="sum-value mint">{fmt(taxWithheld)}</span>
            <span className="sum-unit">บาท</span>
          </li>

          {/* ✅ แถวนี้ไม่ต้องมีเส้นเทาใต้ จึงเพิ่ม no-border */}
          <li className="sum-row no-border">
            <span className="sum-label">ภาษีที่ต้องชำระตามขั้นบันได</span>
            <span className="sum-value mint">{fmt(taxByBracket)}</span>
            <span className="sum-unit">บาท</span>
          </li>

          {/* ✅ แถวสุดท้ายมีเส้นมิ้นด้านบน */}
          <li className="sum-row sum-row--final">
            <span className="sum-label">ภาษีสุทธิที่ต้องชำระ</span>
            <span className={`sum-value ${isRefund ? "green" : "red"}`}>
              {fmt(Math.abs(net))}
            </span>
            <span className="sum-unit">บาท</span>
          </li>
        </ul>

        <FooterNav onBack={onBack} showBack={true} />
      </div>
    </div>
  );
}