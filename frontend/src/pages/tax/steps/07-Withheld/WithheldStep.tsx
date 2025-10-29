import React, { useState } from "react";
import AmountInput from "../../shared/AmountInput";
import FooterNav from "../../shared/FooterNav";

type Props = {
  values: {
    withheldSalaryPerYear?: string; // ภาษีที่ถูกหักจากเงินเดือนตลอดปี (50 ทวิ)
    advancedTaxPaid?: string;       // ภาษีที่ชำระไว้แล้ว/หักจากรายได้อื่นระหว่างปี
  };
  setValues: (patch: Partial<Props["values"]>) => void;
  onBack: () => void;
  onCalculate: () => void;
};

export default function WithheldStep({
  values,
  setValues,
  onBack,
  onCalculate,
}: Props) {
  const { withheldSalaryPerYear, advancedTaxPaid } = values;

  // เหมือน FundStep: ใช้ state เปิด/ปิด tooltip
  const [showInfo1, setShowInfo1] = useState(false);
  const [showInfo2, setShowInfo2] = useState(false);

  return (
    <div className="card">
      <div className="section-title" style={{ color: "var(--mint)" }}>
        ภาษีที่ถูกหัก ณ ที่จ่าย / ชำระไว้แล้ว
      </div>

      {/* ===== ช่อง 1 + ปุ่ม i (โครงสร้างเหมือน PVD ใน FundStep) ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="amount-label" style={{ marginBottom: 0 }}>
          ภาษีที่ถูกหักจากเงินเดือนตลอดปี
        </div>
        <button
          type="button"
          aria-label="ข้อมูลเพิ่มเติม"
          onClick={() => setShowInfo1(true)}
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            border: "2px solid #02BEA3",
            background: "#fff",
            color: "#02BEA3",
            fontSize: 12,
            lineHeight: "18px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          i
        </button>
      </div>

      <AmountInput
        label={null} // ให้ label แสดงบรรทัดบนเหมือน FundStep (PVD)
        placeholder="ระบุจำนวนเงิน"
        value={withheldSalaryPerYear}
        onChange={(v) => setValues({ withheldSalaryPerYear: v })}
        name="withheldSalaryPerYear"
      />
      <div className="note-deduct">
        ภาษีที่นายจ้างหักไว้จากเงินเดือนตลอดปี (ดูได้จากเอกสารแบบ 50 ทวิ)
      </div>

      {/* ===== ช่อง 2 + ปุ่ม i แบบเดียวกัน ===== */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="amount-label" style={{ marginBottom: 0 }}>
          ภาษีที่ชำระไว้แล้ว (ถ้ามี)
        </div>
        <button
          type="button"
          aria-label="ข้อมูลเพิ่มเติม"
          onClick={() => setShowInfo2(true)}
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            border: "2px solid #02BEA3",
            background: "#fff",
            color: "#02BEA3",
            fontSize: 12,
            lineHeight: "18px",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          i
        </button>
      </div>

      <AmountInput
        label={null}
        placeholder="ระบุจำนวนเงิน"
        value={advancedTaxPaid}
        onChange={(v) => setValues({ advancedTaxPaid: v })}
        name="advancedTaxPaid"
      />
      <div className="note-deduct">
        ภาษีที่คุณจ่ายล่วงหน้า หรือถูกหักจากรายได้อื่นระหว่างปี
        <br />
        (เช่น ดอกเบี้ย หรือ ค่าจ้างอิสระ)
      </div>

      {/* Popup info (สไตล์/โครงสร้างเหมือน FundStep) */}
      {showInfo1 && (
        <div className="tip-overlay" role="dialog" aria-modal="true">
          <div className="tip-backdrop" onClick={() => setShowInfo1(false)} />
          <div className="tip-box">
            ภาษีที่นายจ้างหักไว้จากเงินเดือนตลอดปี — ดูได้จากเอกสารแบบ 50 ทวิ
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                onClick={() => setShowInfo1(false)}
                style={{
                  background: "#02BEA3",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  height: 32,
                  padding: "0 14px",
                  fontWeight: 700,
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfo2 && (
        <div className="tip-overlay" role="dialog" aria-modal="true">
          <div className="tip-backdrop" onClick={() => setShowInfo2(false)} />
          <div className="tip-box">
            ภาษีที่คุณจ่ายล่วงหน้า หรือถูกหักจากรายได้อื่นระหว่างปี
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                onClick={() => setShowInfo2(false)}
                style={{
                  background: "#02BEA3",
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  height: 32,
                  padding: "0 14px",
                  fontWeight: 700,
                }}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer แบบเดียวกับ FundStep */}
      <FooterNav showBack onBack={onBack} onNext={onCalculate} nextLabel="คำนวณ" />
    </div>
  );
}