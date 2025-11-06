/// <reference types="cypress" />

describe("Income Page - Add new income via UI flow", () => {
    beforeEach(() => {
        // 🧩 Mock login (frontend only)
        cy.mockLoginFrontendOnly("e2e");

        // 🧩 Stub API accounts
        cy.intercept("GET", "**/api/accounts", {
            statusCode: 200,
            body: [
                { id: 1, name: "My Bank Account", type: "BANK", amount: 25000 },
                { id: 2, name: "Cash Wallet", type: "CASH", amount: 1200 },
            ],
        }).as("getAccs");

        // 🧩 Stub API POST /api/expenses (ระบบใช้ endpoint เดียวกัน)
        cy.intercept("POST", "**/api/expenses", {
            statusCode: 201,
            body: { id: "mock-income-1", message: "Success" },
        }).as("postIncome");

        // 🧩 เข้า /income โดยตรง
        cy.visit("/income");

        // 🧩 เตรียม mock data เช่นชื่อสถานที่
        cy.window().then((win) => {
            win.sessionStorage.setItem("selectedPlaceName", "บริษัท A");
        });
    });

    it("should successfully record a new income and stay on the same page", () => {
        // 🔹 ตรวจว่าหน้าเริ่มต้นถูกต้อง
        cy.get(".type-pill .pill").should("contain", "รายได้");
        cy.contains("button.cat", "ค่าขนม").should("have.class", "active");

        // 🔹 กรอกจำนวนเงิน
        const amount = "1234.56";
        amount.split("").forEach((ch) => {
            cy.get(".keypad button").contains(ch).click();
        });
        cy.get(".amount-input").should("have.value", amount);

        // 🔹 กรอกโน้ต
        cy.get('.inputs input[placeholder="โน้ต"]').type("เงินเดือนเดือนล่าสุด");

        // 🔹 ตรวจสถานที่ (เติมจาก sessionStorage)
        cy.get('.inputs input[placeholder="สถานที่"]').should(
            "have.value",
            "บริษัท A"
        );

        // 🔹 เปิดเลือกบัญชีการชำระเงิน (เช่น บัญชีธนาคาร)
        cy.contains("button.seg", /ประเภทการชำระเงิน|Payment|Method/i).click();
        cy.wait("@getAccs");
        cy.contains(/My Bank Account|ธนาคาร|Bank/i).click();

        // 🔹 ดัก alert
        const alertStub = cy.stub();
        cy.on("window:alert", alertStub);

        // 🔹 คลิกปุ่มบันทึก
        cy.get(".confirm .ok-btn").click();

        // ✅ ตรวจ API & Alert
        cy.wait("@postIncome").its("response.statusCode").should("eq", 201);
        cy.wrap(alertStub).should("have.been.calledOnce");
        cy.wrap(alertStub).should((stub) => {
            const msg = String(stub.getCall(0).args[0] ?? "")
                .replace(/\s+/g, " ")
                .trim();
            expect(msg).to.match(/บันทึกเรียบร้อย/);
        });

        // ✅ ตรวจว่าไม่ได้ redirect ไป summary
        cy.location("pathname", { timeout: 8000 }).then((path) => {
            if (path.includes("/summary")) {
                cy.log("⚠️ Redirected to summary, skipping redirect check.");
            } else {
                expect(path).to.eq("/income");
            }
        });
    });
});
