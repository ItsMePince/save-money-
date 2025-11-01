import React from "react";
import AmountInput from "../../shared/AmountInput";
import FooterNav from "../../shared/FooterNav";

type Props = {
  values: {
    lifeIns?: string;           // เบี้ยประกันชีวิต
    healthIns?: string;         // เบี้ยประกันสุขภาพ
    parentHealthIns?: string;   // เบี้ยประกันสุขภาพบิดา/มารดา
    annuityLifeIns?: string;    // เบี้ยประกันชีวิตบำนาญ
  };
  setValues: (patch: Partial<Props["values"]>) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function InsuranceStep({
  values,
  setValues,
  onBack,
  onNext,
}: Props) {
  const { lifeIns, healthIns, parentHealthIns, annuityLifeIns } = values;

  return (
    <div className="card">
      <div className="section-title" style={{ color: "var(--mint)" }}>
        ประกัน
      </div>

      {/* เบี้ยประกันชีวิต */}
      <AmountInput
        label={<>เบี้ยประกันชีวิต</>}
        placeholder="ระบุจำนวนเงิน"
        value={lifeIns}
        onChange={(v) => setValues({ lifeIns: v })}
        name="lifeIns"
      />
      <div className="note-deduct">ไม่เกิน 100,000 บาท</div>

      {/* เบี้ยประกันสุขภาพ */}
      <AmountInput
        label={<>เบี้ยประกันสุขภาพ</>}
        placeholder="ระบุจำนวนเงิน"
        value={healthIns}
        onChange={(v) => setValues({ healthIns: v })}
        name="healthIns"
      />
      <div className="note-deduct">ไม่เกิน 25,000 บาท</div>
      <div className="note-deduct">
        หมายเหตุ: เบี้ยประกันชีวิต และประกันสุขภาพรวมกันต้องไม่เกิน 100,000 บาท
      </div>

      {/* เบี้ยประกันสุขภาพบิดา,มารดา */}
      <AmountInput
        label={<>เบี้ยประกันสุขภาพบิดา,มารดา</>}
        placeholder="ระบุจำนวนเงิน"
        value={parentHealthIns}
        onChange={(v) => setValues({ parentHealthIns: v })}
        name="parentHealthIns"
      />
      <div className="note-deduct">ไม่เกิน 15,000 บาท</div>

      {/* เบี้ยประกันชีวิตบำนาญ */}
      <AmountInput
        label={<>เบี้ยประกันชีวิตบำนาญ</>}
        placeholder="ระบุจำนวนเงิน"
        value={annuityLifeIns}
        onChange={(v) => setValues({ annuityLifeIns: v })}
        name="annuityLifeIns"
      />
      <div className="note-deduct">
        ไม่เกิน 15% ของรายได้ต่อปี และไม่เกิน 200,000 บาท
      </div>
      <div className="note-deduct">
        (ถ้าไม่ได้ใช้สิทธิประกันชีวิตทั่วไป รวมได้สูงสุด 300,000 บาท
        และไม่เกิน 500,000 บาทเมื่อรวมตามกฎหมายอื่น)
      </div>

      <FooterNav showBack onBack={onBack} onNext={onNext} />
    </div>
  );
}