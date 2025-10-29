// /src/pages/tax/TaxWizard.tsx
import React, { useMemo, useState } from "react";
import "./tax.css";
import WizardProgress from "./shared/WizardProgress";

import IncomeStep from "./steps/01-Income/IncomeStep";
import FamilyStep from "./steps/02-Family/FamilyStep";
import FundStep from "./steps/03-Fund/FundStep";
import InsuranceStep from "./steps/04-Insurance/InsuranceStep";
import OtherFundsStep from "./steps/05-OtherFunds/OtherFundsStep";
import DonationStep from "./steps/06-Donation/DonationStep";
import WithheldStep from "./steps/07-Withheld/WithheldStep";
import SummaryStep from "./steps/08-Summary/SummaryStep";

const TOTAL = 8;

export default function TaxWizard() {
  // active = หน้าปัจจุบัน (1-based)
  const [active, setActive] = useState<number>(1);
  // maxVisited = หน้าที่เคยไปไกลสุด (อัปเดตเฉพาะตอน "เดินหน้า")
  const [maxVisited, setMaxVisited] = useState<number>(1);

  // ขั้นที่ "เป็นสีมิ้นถาวร" = 1..maxVisited
  const completed = useMemo(
    () => Array.from({ length: TOTAL }, (_, i) => i + 1 <= maxVisited),
    [maxVisited]
  );

  const steps = [
    <IncomeStep key="s1" />,
    <FamilyStep key="s2" />,
    <FundStep key="s3" />,
    <InsuranceStep key="s4" />,
    <OtherFundsStep key="s5" />,
    <DonationStep key="s6" />,
    <WithheldStep key="s7" />,
    <SummaryStep key="s8" />,
  ];

  // เดินหน้า: อัปเดต maxVisited ให้ "ไม่ลดลง"
  const goNext = () => {
    setActive((curr) => {
      const next = Math.min(curr + 1, TOTAL);
      setMaxVisited((m) => Math.max(m, next));
      return next;
    });
  };

  const goPrev = () => setActive((s) => Math.max(1, s - 1));

  // ✅ กดวงกลมบน wizard เพื่อไปหน้าไหนก็ได้ "ที่เคยไปแล้ว"
  // เช่น อยู่หน้า 2 แต่เคยไปถึง 4 แล้ว -> คลิก 4 โดดไปหน้า 4 ได้เลย
  const goToStep = (n: number) => {
    if (n <= maxVisited) setActive(n);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>โปรแกรมคำนวณภาษี</h2>

      <WizardProgress
        total={TOTAL}
        active={active}
        completed={completed}     // สีมิ้นถาวร 1..maxVisited
        onClickStep={goToStep}    // คลิกวงกลมเพื่อข้ามไปหน้า visited ได้ทันที
        labels={[
          "รายได้","ครอบครัว","กองทุน/การออม","ประกัน",
          "กองทุนอื่น ๆ","เงินบริจาค","ภาษีที่ถูกหักไว้","สรุป"
        ]}
      />

      <div style={{ marginTop: 16 }}>
        {steps[active - 1]}
      </div>

      <div className="wizard-actions" style={{ marginTop: 16 }}>
        <button onClick={goPrev} disabled={active === 1}>ย้อนกลับ</button>
        <button onClick={goNext} disabled={active === TOTAL}>ถัดไป</button>
      </div>
    </div>
  );
}