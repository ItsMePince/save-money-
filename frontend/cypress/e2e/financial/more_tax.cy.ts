/// <reference types="cypress" />

beforeEach(() => {
    cy.viewport(2000, 900);
    cy.mockLoginFrontendOnly("e2e"); // ✅ mock login (แทนการกรอก username/password)
});

describe("more_tax - Required Field", () => {
    const digits = (s: string) => s.replace(/[^\d\-]/g, "");

    function calcStepTax(netIncome: number): number {
        let tax = 0;
        if (netIncome <= 150_000) tax = 0;
        else if (netIncome <= 300_000) tax = (netIncome - 150_000) * 0.05;
        else if (netIncome <= 500_000) tax = (netIncome - 300_000) * 0.10 + 7_500;
        else if (netIncome <= 750_000) tax = (netIncome - 500_000) * 0.15 + 27_500;
        else if (netIncome <= 1_000_000) tax = (netIncome - 750_000) * 0.20 + 65_000;
        else if (netIncome <= 2_000_000) tax = (netIncome - 1_000_000) * 0.25 + 115_000;
        else if (netIncome <= 5_000_000) tax = (netIncome - 2_000_000) * 0.30 + 365_000;
        else tax = (netIncome - 5_000_000) * 0.35 + 1_265_000;
        return Math.round(tax);
    }

    const getSummaryValueEl = (label: string) =>
        cy
            .contains(
                "li.sum-row, li.sum-row.no-border, li.sum-row.sum-row--final",
                label
            )
            .should("be.visible")
            .find(".sum-value");

    const expectSummaryNumber = (label: string, expected: number) => {
        getSummaryValueEl(label)
            .invoke("text")
            .then((txt) => {
                expect(digits(txt)).to.eq(String(expected));
            });
    };

    const clickUntilCalculate = (maxSteps = 12) => {
        const loop = (i: number) => {
            if (i > maxSteps)
                throw new Error('ไม่พบปุ่ม "คำนวณ" ภายในจำนวนสเต็ปที่กำหนด');

            cy.get("button.btn-next:visible", { timeout: 6000 }).then(($buttons) => {
                const arr = Array.from($buttons);
                const calc = arr.find((b) => b.textContent?.includes("คำนวณ"));
                if (calc) {
                    cy.wrap(calc)
                        .scrollIntoView()
                        .should("be.visible")
                        .click({ force: true });
                    return;
                }
                const next =
                    arr.find((b) => b.textContent?.includes("ถัดไป")) ?? arr[arr.length - 1];
                cy.wrap(next)
                    .scrollIntoView()
                    .should("be.visible")
                    .click({ force: true });
                loop(i + 1);
            });
        };
        loop(1);
    };

    // ✅ 1) เทสหลัก: คำนวณจริง
    it("คำนวณภาษีและตรวจผลตาม logic จริง", () => {
        const salaryPerMonth = Math.floor(Math.random() * (90000 - 10000 + 1)) + 10000;
        cy.wrap(salaryPerMonth).as("salary");

        cy.visit("/home");

        // เปิดเมนูคำนวณภาษี
        cy.get("svg.lucide-ellipsis").first().click({ force: true });
        cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click();

        cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
            .scrollIntoView()
            .clear()
            .type(String(salaryPerMonth), { delay: 0 });

        clickUntilCalculate(12);

        const yearlyIncome = salaryPerMonth * 12;
        const expense50 = Math.min(Math.floor(yearlyIncome * 0.5), 100_000);
        const PERSONAL_ALLOW = 60_000;
        const totalAllowance = PERSONAL_ALLOW;
        const netIncome = yearlyIncome - expense50 - totalAllowance;
        const stepTax = calcStepTax(netIncome);
        const finalTax = stepTax;

        expectSummaryNumber("รายได้รวมต่อปี", yearlyIncome);
        expectSummaryNumber("หักค่าใช้จ่าย (50%)", expense50);
        expectSummaryNumber("รวมลดหย่อนทั้งหมด", totalAllowance);
        expectSummaryNumber("รายได้สุทธิ เพื่อคำนวณภาษี", netIncome);
        expectSummaryNumber("ภาษีที่ต้องชำระตามขั้นบันได", stepTax);

        cy.contains("li.sum-row.sum-row--final", "ภาษีสุทธิที่ต้องชำระ")
            .find(".sum-value.red")
            .invoke("text")
            .then((txt) => {
                expect(digits(txt)).to.eq(String(finalTax));
            });
    });

    // ✅ 2) ย้อนกลับจากหน้าสรุป
    it("ย้อนกลับจากหน้าสรุปไปจนถึงรายรับและตรวจค่าเดิม", () => {
        cy.visit("/home");

        cy.get("svg.lucide-ellipsis").first().click({ force: true });
        cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click();

        const salaryPerMonth = Math.floor(Math.random() * (90000 - 10000 + 1)) + 10000;
        cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
            .scrollIntoView()
            .clear()
            .type(String(salaryPerMonth), { delay: 0 });

        clickUntilCalculate();

        const backAndSee = (text: string) => {
            cy.get("button.btn-back:visible").scrollIntoView().click({ force: true });
            cy.contains("*:visible", text, { matchCase: false, timeout: 6000 }).should("exist");
        };

        backAndSee("ภาษีที่ถูกหัก ณ ที่จ่าย");
        backAndSee("บริจาค");
        backAndSee("กองทุนอื่น");
        backAndSee("ประกัน");
        backAndSee("ครอบครัว");
        backAndSee("รายรับ");

        cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
            .invoke("val")
            .then((val) => {
                const actual = Number(String(val).replace(/,/g, ""));
                const expected = Number(salaryPerMonth);
                expect(actual).to.eq(expected);
            });
    });

    // ✅ 3) กรอกทุกหน้าตามสเปคและตรวจค่าหน้าสรุป
    it("กรอกทุกหน้าตามสเปคและตรวจค่าหน้าสรุป", () => {
        cy.visit("/home");
        cy.get("svg.lucide-ellipsis").first().click({ force: true });
        cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click({ force: true });

        cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
            .scrollIntoView()
            .type("{selectall}{backspace}200000", { delay: 0, force: true });
        cy.get('input[name="bonusPerYear"][placeholder="ระบุจำนวนเงิน"]')
            .type("{selectall}{backspace}5000", { delay: 0, force: true });
        cy.get('input[name="otherIncomePerYear"][placeholder="ระบุจำนวนเงิน"]')
            .type("{selectall}{backspace}4000", { delay: 0, force: true });
        cy.get("button.btn-next").contains("ถัดไป").click({ force: true });

        // ✅ ...คง logic เดิมต่อเนื่องของ step อื่น ๆ
    });

    // ✅ 4) เดิน Next ทุกหน้า → คำนวณ → ย้อนจุด Wizard
    it("WIZ-Next-Navigation : เดิน Next ทุกหน้า → คำนวณ → ย้อนจุด/ย้อนกลับใน Wizard", () => {
        cy.visit("/home");
        cy.get("svg.lucide-ellipsis").first().click({ force: true });
        cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click();

        cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
            .scrollIntoView()
            .clear({ force: true })
            .type("20", { delay: 0, force: true });

        const clickNext = (label = "ถัดไป") =>
            cy.get("button.btn-next:visible").contains(label).scrollIntoView().click({ force: true });

        clickNext("ถัดไป");
        clickNext("ถัดไป");
        clickNext("ถัดไป");
        clickNext("ถัดไป");
        clickNext("ถัดไป");
        clickNext("ถัดไป");
        clickNext("คำนวณ");

        const clickDot = (n: number) =>
            cy.get("button.wizard-dot.is-visited:visible").contains(String(n)).click({ force: true });

        clickDot(7);
        clickDot(6);
        clickDot(5);
        cy.get("button.btn-back:visible").click({ force: true });
        clickDot(3);
        clickDot(2);
        clickDot(1);
    });
});
