// src/pages/tax/steps/06-Withheld/WithheldStep.test.tsx
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { within } from "@testing-library/react";
// ---- Mocks ----
vi.mock("../../shared/AmountInput", () => ({
    default: (props: any) => {
        const { label, placeholder, value, onChange, name } = props;
        return (
            <label>
                {typeof label === "string" ? <span>{label}</span> : label}
                <input
                    aria-label={name}
                    placeholder={placeholder}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.currentTarget.value)}
                />
            </label>
        );
    },
}));

vi.mock("../../shared/FooterNav", () => ({
    default: (props: any) => {
        const { showBack, onBack, onNext, nextLabel } = props;
        return (
            <div>
                {showBack && (
                    <button onClick={onBack} aria-label="ย้อนกลับ">ย้อนกลับ</button>
                )}
                <button onClick={onNext} aria-label={nextLabel ?? "ถัดไป"}>
                    {nextLabel ?? "ถัดไป"}
                </button>
            </div>
        );
    },
}));

// SUT
import WithheldStep from "./WithheldStep";

// Host สำหรับเก็บ state เหมือนหน้าแม่
function Host({
                  onBack = vi.fn(),
                  onCalculate = vi.fn(),
                  initial = {} as any,
              }) {
    const [values, setValues] = useState(initial);
    return (
        <WithheldStep
            values={values}
            setValues={(patch) => setValues((v: any) => ({ ...v, ...patch }))}
            onBack={onBack}
            onCalculate={onCalculate}
        />
    );
}

describe("WithheldStep", () => {
    let user: ReturnType<typeof userEvent.setup>;
    beforeEach(() => {
        user = userEvent.setup();
    });

    it("เรนเดอร์หัวข้อ อินพุต 2 ช่อง ปุ่ม 'ย้อนกลับ' และปุ่ม 'คำนวณ'", () => {
        render(<Host />);

        // หัวข้อ
        expect(
            screen.getByText("ภาษีที่ถูกหัก ณ ที่จ่าย / ชำระไว้แล้ว")
        ).toBeInTheDocument();

        // อินพุต 2 ช่อง (ใช้ placeholder เดียวกัน)
        const inputs = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        expect(inputs).toHaveLength(2);

        // ปุ่มจาก FooterNav
        expect(screen.getByRole("button", { name: "ย้อนกลับ" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "คำนวณ" })).toBeInTheDocument();

        // ป้ายบรรทัดบน (amount-label)
        expect(screen.getByText("ภาษีที่ถูกหักจากเงินเดือนตลอดปี")).toBeInTheDocument();
        expect(screen.getByText("ภาษีที่ชำระไว้แล้ว (ถ้ามี)")).toBeInTheDocument();

        // โน้ตประกอบ
        expect(
            screen.getByText(/ภาษีที่นายจ้างหักไว้จากเงินเดือนตลอดปี/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/ภาษีที่คุณจ่ายล่วงหน้า หรือถูกหักจากรายได้อื่นระหว่างปี/i)
        ).toBeInTheDocument();
    });

    it("พิมพ์ค่าเข้าอินพุตทั้งสองได้ และกด 'คำนวณ' / 'ย้อนกลับ' เรียก callback", async () => {
        const onBack = vi.fn();
        const onCalculate = vi.fn();
        render(<Host onBack={onBack} onCalculate={onCalculate} />);

        const withheld = screen.getByRole("textbox", { name: "withheldSalaryPerYear" });
        const advanced = screen.getByRole("textbox", { name: "advancedTaxPaid" });

        await user.type(withheld, "12345");
        await user.type(advanced, "6789");

        expect(withheld).toHaveValue("12345");
        expect(advanced).toHaveValue("6789");

        await user.click(screen.getByRole("button", { name: "คำนวณ" }));
        expect(onCalculate).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole("button", { name: "ย้อนกลับ" }));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("กดปุ่ม i ของแต่ละกล่องเพื่อเปิด dialog และปิดได้ทั้งปุ่ม 'ปิด' และคลิกพื้นหลัง", async () => {
        render(<Host />);

        const infoButtons = screen.getAllByRole("button", { name: "ข้อมูลเพิ่มเติม" });
        expect(infoButtons).toHaveLength(2);

        // ===== Dialog 1 =====
        await user.click(infoButtons[0]);
        let dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();

        // << เปลี่ยนมา scope ใน dialog แทน >>
        expect(
            within(dialog).getByText(/เอกสารแบบ 50 ทวิ/i)
        ).toBeInTheDocument();

        // ปิดด้วยปุ่ม "ปิด"
        await user.click(within(dialog).getByRole("button", { name: "ปิด" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        // เปิดใหม่ แล้วปิดด้วย backdrop
        await user.click(infoButtons[0]);
        dialog = screen.getByRole("dialog");
        const backdrop1 = screen.getByText((_, el) => el?.className === "tip-backdrop");
        await user.click(backdrop1);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        // ===== Dialog 2 =====
        await user.click(infoButtons[1]);
        dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();

        expect(
            within(dialog).getByText(/ภาษีที่คุณจ่ายล่วงหน้า หรือถูกหักจากรายได้อื่นระหว่างปี/i)
        ).toBeInTheDocument();

        await user.click(within(dialog).getByRole("button", { name: "ปิด" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        // เปิดใหม่ แล้วปิดด้วย backdrop
        await user.click(infoButtons[1]);
        const backdrop2 = screen.getByText((_, el) => el?.className === "tip-backdrop");
        await user.click(backdrop2);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
});
