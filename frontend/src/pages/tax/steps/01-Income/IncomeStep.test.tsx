// pages/tax/steps/01-Income/IncomeStep.test.tsx
import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---- Mocks for shared components ----
vi.mock("../../shared/AmountInput", () => ({
    default: (props: any) => {
        const { label, placeholder, value, onChange, name } = props;
        // ทำให้หาได้ทั้งจาก label text และ placeholder
        return (
            <label>
                <span>{typeof label === "string" ? label : null}{label}</span>
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
        const { onNext, nextDisabled } = props;
        return (
            <button onClick={onNext} disabled={nextDisabled}>
                ถัดไป
            </button>
        );
    },
}));

// SUT
import IncomeStep from "./IncomeStep";

// ---- Test host to keep state like a parent page ----
function Host({ onNext = vi.fn(), initial = {} as any }) {
    const [values, setValues] = useState(initial);
    return (
        <IncomeStep
            values={values}
            setValues={(patch) => setValues((v: any) => ({ ...v, ...patch }))}
            onNext={onNext}
        />
    );
}

describe("IncomeStep", () => {
    let user: ReturnType<typeof userEvent.setup>;
    beforeEach(() => {
        user = userEvent.setup();
    });

    it("แสดง input 3 ช่องและปุ่ม 'ถัดไป' ถูก disable ตอนเริ่มต้น", () => {
        render(<Host />);
        const inputs = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        expect(inputs).toHaveLength(3);

        const nextBtn = screen.getByRole("button", { name: /ถัดไป/i });
        expect(nextBtn).toBeDisabled();
    });

    it("เปิดให้กด 'ถัดไป' เมื่อกรอกเงินเดือนต่อเดือนเป็นจำนวนมากกว่า 0", async () => {
        const onNext = vi.fn();
        render(<Host onNext={onNext} />);

        const [salaryInput] = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        await user.clear(salaryInput);
        await user.type(salaryInput, "15000");

        const nextBtn = screen.getByRole("button", { name: /ถัดไป/i });
        expect(nextBtn).toBeEnabled();

        await user.click(nextBtn);
        expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("ยังคง disable ถ้าเงินเดือนเป็น 0 หรือไม่ใช่ตัวเลข", async () => {
        render(<Host />);

        const [salaryInput] = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");

        // case: 0
        await user.clear(salaryInput);
        await user.type(salaryInput, "0");
        expect(screen.getByRole("button", { name: /ถัดไป/i })).toBeDisabled();

        // case: not-a-number
        await user.clear(salaryInput);
        await user.type(salaryInput, "abc");
        expect(screen.getByRole("button", { name: /ถัดไป/i })).toBeDisabled();
    });

    it("ยอมรับรูปแบบที่มีคอมมา เช่น 10,000 และสามารถกดถัดไปได้", async () => {
        const onNext = vi.fn();
        render(<Host onNext={onNext} />);

        const [salaryInput] = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        await user.clear(salaryInput);
        await user.type(salaryInput, "10,000");

        const nextBtn = screen.getByRole("button", { name: /ถัดไป/i });
        expect(nextBtn).toBeEnabled();

        await user.click(nextBtn);
        expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("การกรอกโบนัสและรายได้อื่น ๆ ไม่บังคับ แต่ควรกรอกได้โดยไม่พัง", async () => {
        render(<Host initial={{ salaryPerMonth: "1000" }} />);

        const inputs = screen.getAllByPlaceholderText("ระบุจำนวนเงิน");
        const [_, bonusInput, otherInput] = inputs;

        await user.type(bonusInput, "5000");
        await user.type(otherInput, "1200");

        // ปุ่มควรพร้อมเพราะ salary valid
        expect(screen.getByRole("button", { name: /ถัดไป/i })).toBeEnabled();
    });
});
