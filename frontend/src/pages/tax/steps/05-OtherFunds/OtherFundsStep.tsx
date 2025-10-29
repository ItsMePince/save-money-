import React from "react";
import AmountInput from "../../shared/AmountInput";
import FooterNav from "../../shared/FooterNav";

type Props = {
  values: {
    gpfPerYear?: string;        // กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)
    nsoPerYear?: string;        // กองทุนออมแห่งชาติ (กอช.)
    teacherFundPerYear?: string; // กองทุนครูเอกชน
  };
  setValues: (patch: Partial<Props["values"]>) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function OtherFundsStep({
  values,
  setValues,
  onBack,
  onNext,
}: Props) {
  const { gpfPerYear, nsoPerYear, teacherFundPerYear } = values;

  return (
    <div className="card">
      <div className="section-title" style={{ color: "var(--mint)" }}>
        กองทุนอื่นๆ
      </div>

      {/* กบข. */}
      <AmountInput
        label="กองทุนบำเหน็จบำนาญข้าราชการ (กบข.)"
        placeholder="ระบุจำนวนเงิน"
        value={gpfPerYear}
        onChange={(v) => setValues({ gpfPerYear: v })}
        name="gpfPerYear"
      />
      <div className="note-deduct">
        ไม่เกิน 15% ของรายได้ต่อปี และรวมกับกองทุนอื่นไม่เกิน 500,000 บาท
      </div>

      {/* กอช. */}
      <AmountInput
        label="กองทุนออมแห่งชาติ (กอช.)"
        placeholder="ระบุจำนวนเงิน"
        value={nsoPerYear}
        onChange={(v) => setValues({ nsoPerYear: v })}
        name="nsoPerYear"
      />
      <div className="note-deduct">
        ไม่เกิน 13,200 บาท และรวมกับกองทุนอื่นและเบี้ยประกันชีวิตแบบบำนาญแล้ว
        ไม่เกิน 500,000 บาท
      </div>

      {/* กองทุนครูเอกชน */}
      <AmountInput
        label="กองทุนครูเอกชน"
        placeholder="ระบุจำนวนเงิน"
        value={teacherFundPerYear}
        onChange={(v) => setValues({ teacherFundPerYear: v })}
        name="teacherFundPerYear"
      />
      <div className="note-deduct">
        ไม่เกิน 15% ของรายได้ต่อปี และรวมกับกองทุนอื่นและเบี้ยประกันชีวิตแบบบำนาญแล้ว
        ไม่เกิน 500,000 บาท
      </div>

      <FooterNav showBack onBack={onBack} onNext={onNext} />
    </div>
  );
}