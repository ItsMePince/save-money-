import React, { useState } from "react";
import FooterNav from "../../shared/FooterNav";

type Marital = "single" | "divorced" | "married_separate" | "married_no_income";

type Values = {
  maritalStatus?: Marital;
  hasChildren?: "yes" | "no";
  childCountPre2561?: string;
  childCountFrom2561?: string;
  disabledChildrenCount?: string;
  disabledNoIncome?: {
    father?: boolean;
    mother?: boolean;
    child?: boolean;
    relative?: boolean;
  };
  parentSelf?: { father?: boolean; mother?: boolean };
  parentSpouse?: { father?: boolean; mother?: boolean };
};

type Props = {
  values: Values;
  setValues: (patch: Partial<Values>) => void;
  onBack: () => void;
  onNext: () => void;
};

const CountInput: React.FC<{
  label: React.ReactNode;
  name: keyof Values;
  values: Values;
  setValues: (patch: Partial<Values>) => void;
  placeholder?: string;
}> = ({ label, name, values, setValues, placeholder = "ระบุจำนวน" }) => {
  const v = (values[name] as string) ?? "";
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
    setValues({ [name]: e.target.value.replace(/[^\d]/g, "") } as any);

  return (
    <label className="amount-field">
      <div className="amount-label">{label}</div>
      <input
        inputMode="numeric"
        className="amount-input"
        placeholder={placeholder}
        value={v}
        onChange={onChange}
      />
    </label>
  );
};

export default function FamilyStep({ values, setValues, onBack, onNext }: Props) {
  const [showInfo, setShowInfo] = useState(false);

  const marital = values.maritalStatus; // undefined = ยังไม่เลือก (placeholder)
  const hasChildren = values.hasChildren;

  const showChildrenRadio =
    marital === "divorced" ||
    marital === "married_separate" ||
    marital === "married_no_income";

  const toggle = (
    path: "parentSelf" | "parentSpouse" | "disabledNoIncome",
    key: "father" | "mother" | "child" | "relative"
  ) => {
    const group = (values as any)[path] || {};
    setValues({ [path]: { ...group, [key]: !group[key] } } as any);
  };

  const setHasChildren = (ans: "yes" | "no") => {
    const patch: Partial<Values> = { hasChildren: ans };
    if (ans === "no") {
      patch.childCountPre2561 = "";
      patch.childCountFrom2561 = "";
      patch.disabledChildrenCount = "";
      patch.disabledNoIncome = { ...(values.disabledNoIncome || {}), child: false };
    }
    setValues(patch);
  };

  return (
    <div className="card">
      <div className="section-title" style={{ color: "var(--mint)" }}>
        ครอบครัว
      </div>

      {/* ลดหย่อนส่วนบุคคล + ปุ่ม i */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ color: "#111", fontWeight: 400 }}>ลดหย่อนส่วนบุคคล</div>
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          aria-label="ข้อมูลเพิ่มเติม"
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
      <div style={{ marginBottom: 12, color: "#111" }}>60,000</div>

      {showInfo && (
        <div className="tip-overlay" role="dialog" aria-modal="true">
          <div className="tip-backdrop" onClick={() => setShowInfo(false)} />
          <div className="tip-box">
            ระบบได้รวมสิทธิลดหย่อนส่วนบุคคล 60,000 บาท ให้โดยอัตโนมัติ
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

      {/* สถานะสมรส */}
      <label className="amount-field" style={{ paddingTop: 4 }}>
        <div className="amount-label">สถานะสมรส</div>
        <div className="select-wrap">
          <select
            className="select-input"
            value={marital ?? ""} // placeholder เมื่อยังไม่เลือก
            onChange={(e) => {
              const val = e.target.value as Marital | "";
              if (val === "") {
                setValues({
                  maritalStatus: undefined,
                  hasChildren: undefined,
                  childCountPre2561: "",
                  childCountFrom2561: "",
                  disabledChildrenCount: "",
                  parentSpouse: undefined,
                  disabledNoIncome: { ...(values.disabledNoIncome || {}), child: false },
                });
              } else {
                setValues({
                  maritalStatus: val,
                  hasChildren: undefined,
                  childCountPre2561: "",
                  childCountFrom2561: "",
                  disabledChildrenCount: "",
                  parentSpouse:
                    val === "married_no_income" ? values.parentSpouse ?? {} : undefined,
                  disabledNoIncome: { ...(values.disabledNoIncome || {}), child: false },
                });
              }
            }}
          >
            <option value="">กรุณากำหนดสถานะ</option>
            <option value="single">โสด</option>
            <option value="divorced">หย่า</option>
            <option value="married_separate">คู่สมรสมีเงินได้ (แยกยื่น)</option>
            <option value="married_no_income">คู่สมรสไม่มีเงินได้</option>
          </select>
        </div>
      </label>

      {/* โหมด โสด */}
      {marital === "single" && (
        <>
          <div style={{ marginTop: 4, marginBottom: 6, color: "#111" }}>
            ลดหย่อนบิดา-มารดา (ตนเอง)
          </div>
          <div className="row-check">
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.parentSelf?.father}
                onChange={() => toggle("parentSelf", "father")}
              />
              บิดา
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.parentSelf?.mother}
                onChange={() => toggle("parentSelf", "mother")}
              />
              มารดา
            </label>
          </div>

          <div className="info-note">
            คนละ 30,000 บาท
            <br />
            (บิดา มารดาอายุ 60 ปีขึ้นไปและมีรายได้ไม่เกิน 30,000 บาทต่อปี)
            <br />
            (ได้ทั้งบิดา มารดาของตนเอง และคู่สมรส)
          </div>

          <div style={{ marginTop: 14, marginBottom: 6, color: "#111" }}>
            ลดหย่อนผู้พิการหรือทุพพลภาพ (ไม่มีเงินได้)
          </div>
          <div className="row-check">
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.disabledNoIncome?.father}
                onChange={() => toggle("disabledNoIncome", "father")}
              />
              บิดา
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.disabledNoIncome?.mother}
                onChange={() => toggle("disabledNoIncome", "mother")}
              />
              มารดา
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.disabledNoIncome?.relative}
                onChange={() => toggle("disabledNoIncome", "relative")}
              />
              ญาติ
            </label>
          </div>

          <div className="info-note">
            สำหรับ บิดา มารดา คู่สมรส บุตร และ หากเป็นญาติได้เพียง 1 คน เท่านั้น
            <br />
            ลดหย่อนคนละ 60,000 บาท (ต้องมี บัตรคนพิการ และ ไม่มีรายได้)
          </div>
        </>
      )}

      {/* โหมดอื่นที่ไม่ใช่โสด */}
      {marital && marital !== "single" && (
        <>
          <div style={{ marginTop: 8, marginBottom: 6, color: "#111" }}>
            ลดหย่อนบิดา-มารดา (ตนเอง)
          </div>
          <div className="row-check">
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.parentSelf?.father}
                onChange={() => toggle("parentSelf", "father")}
              />
              บิดา
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.parentSelf?.mother}
                onChange={() => toggle("parentSelf", "mother")}
              />
              มารดา
            </label>
          </div>

          {marital === "married_no_income" && (
            <>
              <div style={{ marginTop: 12, marginBottom: 6, color: "#111" }}>
                ลดหย่อนบิดา-มารดา (คู่สมรส)
              </div>
              <div className="row-check">
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={!!values.parentSpouse?.father}
                    onChange={() => toggle("parentSpouse", "father")}
                  />
                  บิดา
                </label>
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={!!values.parentSpouse?.mother}
                    onChange={() => toggle("parentSpouse", "mother")}
                  />
                  มารดา
                </label>
              </div>
            </>
          )}

          <div className="info-note">
            คนละ 30,000 บาท
            <br />
            (บิดา มารดาอายุ 60 ปีขึ้นไปและมีรายได้ไม่เกิน 30,000 บาทต่อปี
            <br />
            (ได้ทั้งบิดา มารดาของตนเอง และคู่สมรส)
          </div>

          <div style={{ marginTop: 14, marginBottom: 6, color: "#111" }}>
            ท่านมีบุตรหรือไม่
          </div>
          <div className="row-radio">
            <label className="rad">
              <input
                type="radio"
                name="hasChildren"
                checked={hasChildren === "yes"}
                onChange={() => setHasChildren("yes")}
              />
              มี
            </label>
            <label className="rad">
              <input
                type="radio"
                name="hasChildren"
                checked={hasChildren === "no"}
                onChange={() => setHasChildren("no")}
              />
              ไม่มี
            </label>
          </div>

          {hasChildren === "yes" && (
            <>
              <CountInput
                label="จำนวนบุตรที่เกิดก่อนปี 2561"
                name="childCountPre2561"
                values={values}
                setValues={setValues}
              />
              <div className="note-deduct">ลดหย่อนคนละ 30,000 บาท</div>

              <CountInput
                label="จำนวนบุตรที่เกิดตั้งแต่ปี 2561 เป็นต้นไป"
                name="childCountFrom2561"
                values={values}
                setValues={setValues}
              />
              <div className="note-deduct">ลดหย่อนคนละ 60,000 บาท</div>
            </>
          )}

          <div style={{ marginTop: 16, marginBottom: 6, color: "#111" }}>
            ลดหย่อนผู้พิการหรือทุพพลภาพ (ไม่มีเงินได้)
          </div>
          <div className="row-check">
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.disabledNoIncome?.father}
                onChange={() => toggle("disabledNoIncome", "father")}
              />
              บิดา
            </label>
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.disabledNoIncome?.mother}
                onChange={() => toggle("disabledNoIncome", "mother")}
              />
              มารดา
            </label>
            {hasChildren === "yes" && (
              <label className="chk">
                <input
                  type="checkbox"
                  checked={!!values.disabledNoIncome?.child}
                  onChange={() => toggle("disabledNoIncome", "child")}
                />
                บุตร
              </label>
            )}
            <label className="chk">
              <input
                type="checkbox"
                checked={!!values.disabledNoIncome?.relative}
                onChange={() => toggle("disabledNoIncome", "relative")}
              />
              ญาติ
            </label>
          </div>

          <div className="info-note">
            สำหรับ บิดา มารดา คู่สมรส บุตร และ หากเป็นญาติได้เพียง 1 คน เท่านั้น
            <br />
            ลดหย่อนคนละ 60,000 บาท (ต้องมี บัตรคนพิการ และ ไม่มีรายได้)
          </div>

          {hasChildren === "yes" && !!values.disabledNoIncome?.child && (
            <CountInput
              label="จำนวนบุตรที่ต้องการใช้สิทธิ์ลดหย่อนผู้พิการ"
              name="disabledChildrenCount"
              values={values}
              setValues={setValues}
              placeholder="ระบุจำนวนคน"
            />
          )}
        </>
      )}

      {/* ✅ ปุ่มถัดไป “กดได้เสมอ” และปิดแท็ก JSX ให้ครบถ้วน */}
      <FooterNav
        showBack
        onBack={onBack}
        onNext={onNext}
        nextDisabled={false}
      />
    </div>
  );
}