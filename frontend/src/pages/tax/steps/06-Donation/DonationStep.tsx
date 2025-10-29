import React from "react";
import AmountInput from "../../shared/AmountInput";
import FooterNav from "../../shared/FooterNav";

type Props = {
  values: {
    donationGeneral?: string;
    donationEducation?: string;
    donationPolitical?: string;
  };
  setValues: (patch: Partial<Props["values"]>) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function DonationStep({ values, setValues, onBack, onNext }: Props) {
  const {
    donationGeneral = "",
    donationEducation = "",
    donationPolitical = "",
  } = values;

  return (
    <div className="card">
      <div className="section-title">บริจาค</div>

      {/* บริจาคทั่วไป */}
      <div className="amount-field">
        <AmountInput
          label="บริจาคทั่วไป (มูลนิธิ / สาธารณกุศล)"
          placeholder="ระบุจำนวนเงิน"
          value={donationGeneral}
          onChange={(v) => setValues({ donationGeneral: v })}
          name="donationGeneral"
        />
        <div className="note-deduct">
          หักลดหย่อนได้ตามจริง แต่ไม่เกิน 10% ของเงินได้สุทธิ
          <br />(เฉพาะองค์กรที่อยู่ในรายชื่อของกรมสรรพากร)
        </div>
      </div>

      {/* เพื่อการศึกษา / กีฬา / โรงพยาบาลรัฐ */}
      <div className="amount-field">
        <AmountInput
          label="บริจาคเพื่อการศึกษา / กีฬา / โรงพยาบาลรัฐ"
          placeholder="ระบุจำนวนเงิน"
          value={donationEducation}
          onChange={(v) => setValues({ donationEducation: v })}
          name="donationEducation"
        />
        <div className="note-deduct">
          หักลดหย่อนได้ 2 เท่าของยอดบริจาคจริง
          <br />(เฉพาะหน่วยงานที่ได้รับประกาศจากกรมสรรพากร)
        </div>
      </div>

      {/* การเมือง */}
      <div className="amount-field">
        <AmountInput
          label="บริจาคเพื่อการเมือง"
          placeholder="ระบุจำนวนเงิน"
          value={donationPolitical}
          onChange={(v) => setValues({ donationPolitical: v })}
          name="donationPolitical"
        />
        <div className="note-deduct">
          หักลดหย่อนได้ไม่เกิน 10,000 บาทต่อปีภาษี
          <br />(เฉพาะการบริจาคให้พรรคการเมืองที่ถูกต้องตามกฎหมาย)
        </div>
      </div>

      <FooterNav showBack onBack={onBack} onNext={onNext} />
    </div>
  );
}