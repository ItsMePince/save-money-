/// <reference types="cypress" />

beforeEach(() => {
  cy.viewport(2000, 900);
});

describe('more_tax - Required Field', () => {
  const digits = (s: string) => s.replace(/[^\d\-]/g, '');

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
        'li.sum-row, li.sum-row.no-border, li.sum-row.sum-row--final',
        label
      )
      .should('be.visible')
      .find('.sum-value');

  const expectSummaryNumber = (label: string, expected: number) => {
    getSummaryValueEl(label)
      .invoke('text')
      .then((txt) => {
        expect(digits(txt)).to.eq(String(expected));
      });
  };

  const clickUntilCalculate = (maxSteps = 12) => {
    const loop = (i: number) => {
      if (i > maxSteps)
        throw new Error('ไม่พบปุ่ม "คำนวณ" ภายในจำนวนสเต็ปที่กำหนด');

      cy.get('button.btn-next:visible', { timeout: 6000 }).then(($buttons) => {
        const arr = Array.from($buttons);
        const calc = arr.find((b) => b.textContent?.includes('คำนวณ'));
        if (calc) {
          cy.wrap(calc)
            .scrollIntoView()
            .should('be.visible')
            .click({ force: true });
          return;
        }
        const next =
          arr.find((b) => b.textContent?.includes('ถัดไป')) ??
          arr[arr.length - 1];
        cy.wrap(next)
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });
        loop(i + 1);
      });
    };
    loop(1);
  };

  // ✅ เทสหลัก (คำนวณจริง)
  it('คำนวณภาษีและตรวจผลตาม logic จริง', () => {
    const salaryPerMonth = Math.floor(Math.random() * (90000 - 10000 + 1)) + 10000;
    const otherIncomePerYear = 0;
    cy.wrap(salaryPerMonth).as('salary'); // เก็บค่าไว้ใช้ในเทสย้อนกลับ

    cy.visit('/login');
    cy.get('input[placeholder="username"]').clear().type('admin');
    cy.get('input[placeholder="password "]').clear().type('admin');
    cy.get('button.btn[type="submit"]').contains('login', { matchCase: false }).click();
    cy.url().should('include', 'http://localhost:3000/home');

    cy.get('svg.lucide-ellipsis').first().click({ force: true });
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

    expectSummaryNumber('รายได้รวมต่อปี', yearlyIncome);
    expectSummaryNumber('หักค่าใช้จ่าย (50%)', expense50);
    expectSummaryNumber('รวมลดหย่อนทั้งหมด', totalAllowance);
    expectSummaryNumber('รายได้สุทธิ เพื่อคำนวณภาษี', netIncome);
    expectSummaryNumber('ภาษีที่ต้องชำระตามขั้นบันได', stepTax);
    cy.contains('li.sum-row.sum-row--final', 'ภาษีสุทธิที่ต้องชำระ')
      .find('.sum-value.red')
      .invoke('text')
      .then((txt) => {
        expect(digits(txt)).to.eq(String(finalTax));
      });
  });

  // ✅ เทสย่อย: ย้อนกลับจากหน้าสรุปจนถึงรายรับ
  /// <reference types="cypress" />

  it('ย้อนกลับจากหน้าสรุปไปจนถึงรายรับและตรวจค่าเดิม', () => {
    // ===== Login =====
    cy.visit('/login');
    cy.get('input[placeholder="username"]').clear().type('admin');
    cy.get('input[placeholder="password "]').clear().type('admin');
    cy.get('button.btn[type="submit"]').contains('login', { matchCase: false }).click();
    cy.url().should('include', 'http://localhost:3000/home');

    // ===== เข้าเมนู "คำนวณภาษีลดหย่อน" =====
    cy.get('svg.lucide-ellipsis').first().click({ force: true });
    cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click();

    // ===== กรอกข้อมูลรายได้ =====
    const salaryPerMonth = Math.floor(Math.random() * (90000 - 10000 + 1)) + 10000;
    cy.log(`🎲 เงินเดือนที่สุ่มได้ = ${salaryPerMonth}`);

    cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
      .scrollIntoView()
      .clear()
      .type(String(salaryPerMonth), { delay: 0 });

    // ===== เดินหน้าทีละสเต็ปจนถึงหน้าสรุป =====
    const clickUntilCalculate = (maxSteps = 12) => {
      const loop = (i: number) => {
        if (i > maxSteps) throw new Error('ไม่พบปุ่ม "คำนวณ" ภายในจำนวนสเต็ปที่กำหนด');
        cy.get('button.btn-next:visible', { timeout: 6000 }).then(($buttons) => {
          const arr = Array.from($buttons);
          const calc = arr.find((b) => b.textContent?.includes('คำนวณ'));
          if (calc) {
            cy.wrap(calc).scrollIntoView().should('be.visible').click({ force: true });
            return;
          }
          const next = arr.find((b) => b.textContent?.includes('ถัดไป')) ?? arr[arr.length - 1];
          cy.wrap(next).scrollIntoView().should('be.visible').click({ force: true });
          loop(i + 1);
        });
      };
      loop(1);
    };
    clickUntilCalculate();

    // ===== helper: กดย้อนกลับแล้วตรวจข้อความที่ "มองเห็นจริง" =====
    const backAndSee = (text: string) => {
      cy.get('button.btn-back:visible').scrollIntoView().click({ force: true });
      cy.contains('*:visible', text, { matchCase: false, timeout: 6000 }).should('exist');
    };

    // ===== จากหน้าสรุป → ย้อนกลับทีละหน้า =====
    cy.log(`🔁 ตรวจย้อนกลับจากสรุป → รายรับ (salary = ${salaryPerMonth})`);

    backAndSee('ภาษีที่ถูกหัก ณ ที่จ่าย');
    // ในบางธีม header "บริจาค" อาจมีตัวที่ถูกซ่อนอยู่ ใช้ *:visible จับตัวที่โชว์จริง
    backAndSee('บริจาค');
    backAndSee('กองทุนอื่น');        // หรือ 'กองทุนอื่นๆ' ตามข้อความใน UI ของคุณ
    backAndSee('ประกัน');
    backAndSee('เบี้ยประกันสังคม');  // หน้านี้รวม กองทุน/เบี้ยประกันสังคม/กู้ที่อยู่อาศัย
    backAndSee('ครอบครัว');
    backAndSee('รายรับ');

    // ===== ตรวจว่าช่อง salaryPerMonth ยังมีค่าที่กรอกไว้เดิม =====
    cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
      .invoke('val')
        .then((val) => {
          const actual = Number(String(val).replace(/,/g, ''));
          const expected = Number(salaryPerMonth);
          expect(actual).to.eq(expected);
        });
  });
    it('กรอกทุกหน้าตามสเปคและตรวจค่าหน้าสรุป', () => {
      // --- Login ---
      cy.visit('/login');
      cy.get('input[placeholder="username"]')
        .scrollIntoView()
        .type('{selectall}{backspace}admin', { delay: 0, force: true });
      cy.get('input[placeholder="password "]')
        .scrollIntoView()
        .type('{selectall}{backspace}admin', { delay: 0, force: true });
      cy.get('button.btn[type="submit"]')
        .contains('login', { matchCase: false })
        .click({ force: true });
      cy.url().should('include', '/home');

      // --- เปิด Tax Wizard ---
      cy.get('svg.lucide-ellipsis').first().click({ force: true });
      cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click({ force: true });

      // --- Step 1: รายรับ ---
      cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
        .scrollIntoView().type('{selectall}{backspace}200000', { delay: 0, force: true });
      cy.get('input[name="bonusPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .scrollIntoView().type('{selectall}{backspace}5000', { delay: 0, force: true });
      cy.get('input[name="otherIncomePerYear"][placeholder="ระบุจำนวนเงิน"]')
        .scrollIntoView().type('{selectall}{backspace}4000', { delay: 0, force: true });
      cy.get('button.btn-next').contains('ถัดไป').click({ force: true });

      // --- Step 2: ครอบครัว (ข้าม) ---
      cy.get('.tax-modal').within(() => {
        // ยืนยันว่าอยู่หน้า 2 แล้ว
        cy.contains('*:visible', 'ครอบครัว', { matchCase:false, timeout:6000 }).should('exist');

        // กดถัดไปโดยไม่กรอกอะไร → ไปหน้า 3
        cy.get('button.btn-next:visible').contains('ถัดไป').should('be.enabled').click({ force:true });
      });

      // --- Step 3: กองทุน/สวัสดิการ ---
      cy.get('input[name="pvdPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}300000', { delay: 0, force: true });
      cy.get('input[name="socialSecurityPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}10000', { delay: 0, force: true });
      cy.get('input[name="mortgageInterestPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}110000', { delay: 0, force: true });
      cy.get('button.btn-next').contains('ถัดไป').click({ force: true });

      // --- Step 4: ประกัน ---
      cy.get('input[name="lifeIns"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}110000', { delay: 0, force: true });
      cy.get('input[name="healthIns"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}26000', { delay: 0, force: true });
      cy.get('input[name="parentHealthIns"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}16000', { delay: 0, force: true });
      cy.get('input[name="annuityLifeIns"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}600000', { delay: 0, force: true });
      cy.get('button.btn-next').contains('ถัดไป').click({ force: true });

      // --- Step 5: กองทุนอื่น ๆ ---
      cy.get('input[name="gpfPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}600000', { delay: 0, force: true });
      cy.get('input[name="nsoPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}13300', { delay: 0, force: true });
      cy.get('input[name="teacherFundPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}600000', { delay: 0, force: true });
      cy.get('button.btn-next').contains('ถัดไป').click({ force: true });

      // --- Step 6: บริจาค ---
      cy.get('input[name="donationGeneral"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}240000', { delay: 0, force: true });
      cy.get('input[name="donationEducation"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}240000', { delay: 0, force: true });
      cy.get('input[name="donationPolitical"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}11000', { delay: 0, force: true });
      cy.get('button.btn-next').contains('ถัดไป').click({ force: true });

      // --- Step 7: ภาษีที่ถูกหักฯ ---
      cy.get('input[name="withheldSalaryPerYear"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}10000', { delay: 0, force: true });
      cy.get('input[name="advancedTaxPaid"][placeholder="ระบุจำนวนเงิน"]')
        .type('{selectall}{backspace}2000', { delay: 0, force: true });
      cy.get('button.btn-next:visible').contains('คำนวณ', { matchCase: false }).click({ force: true });

      // --- Summary Assertions ---
      expectSummaryNumber('รายได้รวมต่อปี', 2409000);
      expectSummaryNumber('หักค่าใช้จ่าย (50%)', 100000);
      expectSummaryNumber('รวมลดหย่อนทั้งหมด', 946500);
      expectSummaryNumber('รายได้สุทธิ เพื่อคำนวณภาษี', 1362500);
      expectSummaryNumber('ภาษีที่ถูกหัก ณ ที่จ่าย', 12000);
      expectSummaryNumber('ภาษีที่ต้องชำระตามขั้นบันได', 205625);

      cy.contains('li.sum-row.sum-row--final', 'ภาษีสุทธิที่ต้องชำระ', { matchCase: false })
        .find('.sum-value.red')
        .invoke('text')
        .then((txt) => {
          expect(digits(txt)).to.eq('193625');
        });
    });
    it('WIZ-Next-Navigation : เดิน Next ทุกหน้า → คำนวณ → ย้อนจุด/ย้อนกลับใน Wizard', () => {
      // ===== Login =====
      cy.visit('/login');
      cy.get('input[placeholder="username"]').clear().type('admin');
      cy.get('input[placeholder="password "]').clear().type('admin');
      cy.get('button.btn[type="submit"]').contains('login', { matchCase: false }).click();
      cy.url().should('include', 'http://localhost:3000/home');

      // ===== เปิดโปรแกรมคำนวณภาษี =====
      cy.get('svg.lucide-ellipsis').first().click({ force: true });
      cy.get('button.pill-row[aria-label="คำนวณภาษีลดหย่อน"]').click();

      // ===== หน้า 1: กรอกเงินเดือนแล้วกดถัดไป =====
      cy.get('input[name="salaryPerMonth"][placeholder="ระบุจำนวนเงิน"]')
        .scrollIntoView()
        .clear({ force: true })
        .type('20', { delay: 0, force: true });

      const clickNext = (label = 'ถัดไป') =>
        cy.get('button.btn-next:visible').contains(label).scrollIntoView().click({ force: true });

      // กด "ถัดไป" ข้ามหน้า 2 → 6 (รวม 6 ครั้ง)
      clickNext('ถัดไป'); // ไปหน้า 2
      clickNext('ถัดไป'); // ไปหน้า 3
      clickNext('ถัดไป'); // ไปหน้า 4
      clickNext('ถัดไป'); // ไปหน้า 5
      clickNext('ถัดไป'); // ไปหน้า 6
      clickNext('ถัดไป'); // ไปหน้า 7

      // หน้า 7 → กด "คำนวณ" เพื่อไปหน้า 8
      clickNext('คำนวณ');

      // ===== คลิกจุด Wizard ย้อนทีละจุด =====
      const clickDot = (n: number) =>
        cy.get('button.wizard-dot.is-visited:visible').contains(String(n)).click({ force: true });

      clickDot(7);
      clickDot(6);
      clickDot(5);

      // ปุ่มย้อนกลับ 1 ครั้ง
      cy.get('button.btn-back:visible').click({ force: true });

      // คลิกจุด 3 → 2 → 1
      clickDot(3);
      clickDot(2);
      clickDot(1);
    });
});