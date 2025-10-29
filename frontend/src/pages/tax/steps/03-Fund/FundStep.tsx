import React, { useState } from "react";
import AmountInput from "../../shared/AmountInput";
import FooterNav from "../../shared/FooterNav";

type Props = {
  values: {
    pvdPerYear?: string;              // กองทุนสำรองเลี้ยงชีพ (PVD)
    socialSecurityPerYear?: string;   // เบี้ยประกันสังคม
    mortgageInterestPerYear?: string; // ดอกเบี้ยที่อยู่อาศัย
  };
  setValues: (patch: Partial<Props["values"]>) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function FundStep({
  values,
  setValues,
  onBack,
  onNext,
}: Props) {
  const { pvdPerYear, socialSecurityPerYear, mortgageInterestPerYear } = values;
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="card">
      <div className="section-title" style={{ color: "var(--mint)" }}>
        กองทุน เบี้ยประกันสังคม และกู้ที่อยู่อาศัย
      </div>

      {/* PVD + ปุ่ม i */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="amount-label" style={{ marginBottom: 0 }}>
          กองทุนสำรองเลี้ยงชีพ (PVD)
        </div>
        <button
          type="button"
          aria-label="ข้อมูลเพิ่มเติม"
          onClick={() => setShowInfo(true)}
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
        value={pvdPerYear}
        onChange={(v) => setValues({ pvdPerYear: v })}
        name="pvdPerYear"
      />
      <div className="note-deduct">
        ไม่เกิน 15% ของเงินเดือน (ไม่รวมส่วนสมทบจากนายจ้าง)
        <br />
        และไม่เกิน 500,000 บาท
      </div>

      {/* Social Security */}
      <AmountInput
        label={<>เบี้ยประกันสังคม</>}
        placeholder="ระบุจำนวนเงิน"
        value={socialSecurityPerYear}
        onChange={(v) => setValues({ socialSecurityPerYear: v })}
        name="socialSecurityPerYear"
      />
      <div className="note-deduct">ไม่เกิน 9,000 บาท</div>

      {/* Mortgage Interest */}
      <AmountInput
        label={<>ดอกเบี้ยที่อยู่อาศัย</>}
        placeholder="ระบุจำนวนเงิน"
        value={mortgageInterestPerYear}
        onChange={(v) => setValues({ mortgageInterestPerYear: v })}
        name="mortgageInterestPerYear"
      />
      <div className="note-deduct">ไม่เกิน 100,000 บาท</div>

      {/* Popup info */}
      {showInfo && (
        <div className="tip-overlay" role="dialog" aria-modal="true">
          <div className="tip-backdrop" onClick={() => setShowInfo(false)} />
          <div className="tip-box">
            เงินออมเพื่อเกษียณของพนักงานบริษัท
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                onClick={() => setShowInfo(false)}
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

      <FooterNav showBack onBack={onBack} onNext={onNext} />
    </div>
  );
}