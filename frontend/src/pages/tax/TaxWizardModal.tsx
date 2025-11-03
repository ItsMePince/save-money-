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

type Props = { isOpen: boolean; onClose: () => void; };

const TOTAL_STEPS = 8;

export default function TaxWizardModal({ isOpen, onClose }: Props) {
    const [step, setStep] = useState<number>(1);
    const [completed, setCompleted] = useState<Record<number, boolean>>({});

    // ==== State ของแต่ละหน้า ====
    const [income, setIncome] = useState<any>({
        salaryPerMonth: "",
        bonusPerYear: "",
        otherIncomePerYear: "",
    });
    const [family, setFamily] = useState<any>({});
    const [fund, setFund] = useState<any>({});
    const [ins, setIns] = useState<any>({});
    const [otherFunds, setOtherFunds] = useState<any>({});
    const [donation, setDonation] = useState<any>({});
    const [withheld, setWithheld] = useState<any>({});

    // ==== State สำหรับผลลัพธ์ ====
    const [summary, setSummary] = useState({
        incomePerYear: 0,
        expense50pct: 0,
        totalDeductions: 0,
        taxableIncome: 0,
        taxWithheld: 0,
        taxByBracket: 0,
        netTax: 0,
    });

    // ==== ตรวจสิทธิ์เปลี่ยน step ====
    const canJumpToStep = (n: number) => {
        if (n === 1) return true;
        for (let i = 1; i < n; i++) if (!completed[i]) return false;
        return true;
    };
    const isCompleted = (n: number) => !!completed[n];
    const goNext = (to: number, markDoneFor?: number) => {
        setCompleted((c) => ({ ...c, [markDoneFor ?? step]: true }));
        setStep(to);
    };

    // ==== สูตรคำนวณภาษีขั้นบันไดไทย ====
    const calcTaxByBracket = (income: number) => {
        const brackets = [
            { max: 150000,  rate: 0.00 },
            { max: 300000,  rate: 0.05 },
            { max: 500000,  rate: 0.10 },
            { max: 750000,  rate: 0.15 },
            { max: 1000000, rate: 0.20 },
            { max: 2000000, rate: 0.25 },
            { max: 5000000, rate: 0.30 },
            { max: Infinity, rate: 0.35 },
        ];
        let remain = Math.max(income, 0);
        let tax = 0;
        let last = 0;
        for (const b of brackets) {
            const span = b.max - last;
            const use = Math.max(Math.min(remain, span), 0);
            tax += use * b.rate;
            remain -= use;
            last = b.max;
            if (remain <= 0) break;
        }
        return Math.max(tax, 0);
    };

    // ==== ฟังก์ชันคำนวณภาษี ====
    const handleCalculate = () => {
        // แปลงเป็นตัวเลขอย่างปลอดภัย: ตัดคอมมา ช่องว่าง สัญลักษณ์ที่ไม่ใช่ตัวเลข/จุด/ลบ
        const N = (v: any) => {
            const s = String(v ?? "").replace(/[^0-9.\-]/g, ""); // ตัดทุกอย่างยกเว้น 0-9 . -
            const n = s === "" || s === "-" || s === "." ? 0 : Number(s);
            return isNaN(n) ? 0 : n;
        };

        // ===== รายได้ =====
        const salaryYear = N(income.salaryPerMonth) * 12;
        const bonusYear  = N(income.bonusPerYear);
        const otherYear  = N(income.otherIncomePerYear);
        const incomePerYear = salaryYear + bonusYear + otherYear;

        // ===== ค่าใช้จ่ายเหมา: 50% แต่ไม่เกิน 100,000 =====
        const expenseStd = Math.min(incomePerYear * 0.5, 100000);

        // ===== ลดหย่อนกลุ่มครอบครัว =====
        const familyDeduct = N((family as any).total);

        // ===== กองทุน / สวัสดิการ =====
        const pvdRaw   = N((fund as any).pvdPerYear || (fund as any).pvd);
        const ssoRaw   = N((fund as any).socialSecurityPerYear || (fund as any).sso);
        const homeRaw  = N((fund as any).mortgageInterestPerYear || (fund as any).homeInterest);

        const pvdCap   = Math.min(pvdRaw, Math.min(incomePerYear * 0.15, 500000));
        const ssoCap   = Math.min(ssoRaw, 9000);
        const homeCap  = Math.min(homeRaw, 100000);

        const gpfRaw     = N((otherFunds as any).gpfPerYear || (otherFunds as any).gpf);
        const nsoRaw     = N((otherFunds as any).nsoPerYear || (otherFunds as any).nso);
        const teacherRaw = N((otherFunds as any).teacherFundPerYear || (otherFunds as any).teacherFund);

        const gpfCap     = Math.min(gpfRaw,     Math.min(incomePerYear * 0.15, 500000));
        const teacherCap = Math.min(teacherRaw, Math.min(incomePerYear * 0.15, 500000));
        const nsoCap     = Math.min(nsoRaw, 13200);

        // ===== ประกัน =====
        const lifeCap    = Math.min(N((ins as any).lifeIns),    100000);
        const healthCap  = Math.min(N((ins as any).healthIns),   25000);
        const parentCap  = Math.min(N((ins as any).parentHealthIns), 15000);
        const annuityCap = Math.min(N((ins as any).annuityLifeIns), Math.min(incomePerYear * 0.15, 200000));

        // รวมกลุ่มเพดาน 500,000 (PVD+กบข.+ครู+บำนาญ)
        const capGroup = (vals: number[], cap: number) => {
            const clean = vals.map(v => (isNaN(v) ? 0 : v));
            const sum = clean.reduce((a, b) => a + b, 0);
            if (sum <= cap) return clean;
            const ratio = cap / sum;
            return clean.map(v => Math.floor(v * ratio));
        };
        const [pvdF, gpfF, teacherF, annuityF] = capGroup([pvdCap, gpfCap, teacherCap, annuityCap], 500000);

        // รวมลดหย่อนพื้นฐาน (ไม่รวมบริจาค)
        const baseDeduct =
            familyDeduct +
            ssoCap +
            homeCap +
            nsoCap +
            lifeCap +
            healthCap +
            parentCap +
            pvdF + gpfF + teacherF + annuityF;

        // ===== บริจาค =====
        const baseForDonation = Math.max(incomePerYear - expenseStd - baseDeduct, 0);
        const donGeneral    = Math.min(N((donation as any).donationGeneral), baseForDonation * 0.10);
        const donEducation2 = Math.min(N((donation as any).donationEducation) * 2, baseForDonation * 0.10);
        const donPolitical  = Math.min(N((donation as any).donationPolitical), 10000);

        const totalDeductions = baseDeduct + donGeneral + donEducation2 + donPolitical;

        // ===== รายได้สุทธิ / ภาษี =====
        const taxableIncome = Math.max(incomePerYear - expenseStd - totalDeductions, 0);
        const taxByBracket  = calcTaxByBracket(taxableIncome);
        const taxWithheld   = N((withheld as any).withheldSalaryPerYear) + N((withheld as any).advancedTaxPaid);
        const netTax        = taxByBracket - taxWithheld;

        setSummary({
            incomePerYear,
            expense50pct: expenseStd,
            totalDeductions,
            taxableIncome,
            taxWithheld,
            taxByBracket,
            netTax,
        });

        setCompleted((c) => ({ ...c, 7: true }));

        setStep(8);
    };

    // ==== Render Step ====
    const content = useMemo(() => {
        switch (step) {
            case 1:
                return (
                    <IncomeStep
                        values={income}
                        setValues={(p: any) => setIncome((v: any) => ({ ...v, ...p }))}
                        onNext={() => goNext(2, 1)}
                    />
                );
            case 2:
                return (
                    <FamilyStep
                        values={family}
                        setValues={(p: any) => setFamily((v: any) => ({ ...v, ...p }))}
                        onBack={() => setStep(1)}
                        onNext={() => goNext(3, 2)}
                    />
                );
            case 3:
                return (
                    <FundStep
                        values={fund}
                        setValues={(p: any) => setFund((v: any) => ({ ...v, ...p }))}
                        onBack={() => setStep(2)}
                        onNext={() => goNext(4, 3)}
                    />
                );
            case 4:
                return (
                    <InsuranceStep
                        values={ins}
                        setValues={(p) => setIns((v: any) => ({ ...v, ...p }))}
                        onBack={() => setStep(3)}
                        onNext={() => goNext(5, 4)}
                    />
                );
            case 5:
                return (
                    <OtherFundsStep
                        values={otherFunds}
                        setValues={(p) => setOtherFunds((v) => ({ ...v, ...p }))}
                        onBack={() => setStep(4)}
                        onNext={() => goNext(6, 5)}
                    />
                );
            case 6:
                return (
                    <DonationStep
                        values={donation}
                        setValues={(p) => setDonation((v) => ({ ...v, ...p }))}
                        onBack={() => setStep(5)}
                        onNext={() => goNext(7, 6)}
                    />
                );
            case 7:
                return (
                    <WithheldStep
                        values={withheld}
                        setValues={(p) => setWithheld((v) => ({ ...v, ...p }))}
                        onBack={() => setStep(6)}
                        onCalculate={handleCalculate} // ✅ ไปหน้า 8
                    />
                );
            case 8:
                return (
                    <SummaryStep
                        summary={summary}
                        onBack={() => setStep(7)}
                    />
                );
            default:
                return null;
        }
    }, [step, income, family, fund, ins, otherFunds, donation, withheld, summary]);

    if (!isOpen) return null;

    return (
        <div className="tax-modal-overlay">
            <div className="tax-modal">
                {/* Header */}
                <div className="tax-modal-header">
                    <h3 className="tax-title">โปรแกรมคำนวณภาษี</h3>
                    <button className="tax-close-btn" onClick={() => { onClose(); setStep(1); }}>
                        ×
                    </button>
                </div>

                {/* Progress */}
                <WizardProgress
                    total={TOTAL_STEPS}
                    active={step}
                    completed={Array.from({ length: TOTAL_STEPS }, (_, i) => completed[i + 1])}
                    onClickStep={(n) => completed[n] && setStep(n)}

                    // --- ✅ START: ส่วนที่แก้ไข ---
                    chunkSize={4}
                    labels={[
                        "รายได้","ครอบครัว","กองทุน/การออม","ประกัน",
                        "กองทุนอื่น ๆ","เงินบริจาค","ภาษีที่ถูกหักไว้","สรุป"
                    ]}
                    // --- ✅ END: ส่วนที่แก้ไข ---
                />

                {/* Body */}
                <div className="tax-modal-body">{content}</div>
            </div>
        </div>
    );
}