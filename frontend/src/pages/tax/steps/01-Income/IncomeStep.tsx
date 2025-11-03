import React, { useMemo } from "react";
import AmountInput from "../../shared/AmountInput";
import FooterNav from "../../shared/FooterNav";

export type Props = {
  values: {
    salaryPerMonth?: string;
    bonusPerYear?: string;
    otherIncomePerYear?: string;
  };
  setValues: (patch: Partial<Props["values"]>) => void;
  onNext: () => void;
};

export default function IncomeStep({ values, setValues, onNext }: Props) {
  const { salaryPerMonth, bonusPerYear, otherIncomePerYear } = values;

  const requiredOk = useMemo(() => {
    const raw = (salaryPerMonth ?? "").replace(/,/g, "");
    const n = parseInt(raw, 10);
    return !isNaN(n) && n > 0;
  }, [salaryPerMonth]);

  return (
    <div className="card">
      <div className="section-title">รายรับ</div>

      <AmountInput
        label={
          <>
            เงินเดือน <span className="muted"> (ต่อเดือน)</span>
            <span className="req-asterisk"> *</span>
          </>
        }
        placeholder="ระบุจำนวนเงิน"
        value={salaryPerMonth}
        onChange={(v) => setValues({ salaryPerMonth: v })}
        name="salaryPerMonth"
      />

      <AmountInput
        label={<>โบนัส <span className="muted">(ต่อปี)</span></>}
        placeholder="ระบุจำนวนเงิน"

        value={bonusPerYear}
        onChange={(v) => setValues({ bonusPerYear: v })}
        name="bonusPerYear"
      />

      <AmountInput
        label={<>รายได้อื่นๆ <span className="muted">(ต่อปี)</span></>}
        placeholder="ระบุจำนวนเงิน"

        value={otherIncomePerYear}
        onChange={(v) => setValues({ otherIncomePerYear: v })}
        name="otherIncomePerYear"
      />

      <FooterNav onNext={() => requiredOk && onNext()} nextDisabled={!requiredOk} />
    </div>
  );
}