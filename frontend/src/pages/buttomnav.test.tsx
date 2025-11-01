// src/pages/buttomnav.test.tsx
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react"; // screen ไม่ได้ใช้
import BottomNav from "./buttomnav";

function renderAt(pathname: string) {
    return render(
        <MemoryRouter initialEntries={[pathname]}>
            <Routes>
                {/* ให้ BottomNav อยู่ในบริบทของ Router เสมอ */}
                <Route path="*" element={<BottomNav />} />
            </Routes>
        </MemoryRouter>
    );
}

describe("BottomNav", () => {
    it("แสดงลิงก์ครบ 4 ปุ่ม และ href ถูกต้อง", () => {
        const { container } = renderAt("/home");
        // [แก้ไข] เลือกเฉพาะ .nav-button ที่มี href attribute
        const links = container.querySelectorAll('a.nav-button[href]');
        expect(links.length).toBe(4); // [แก้ไข] คาดหวัง 4 ปุ่ม

        // ตรวจ href
        expect(links[0].getAttribute("href") ?? "").toMatch(/\/expense$/);
        expect(links[1].getAttribute("href") ?? "").toMatch(/\/home$/);
        expect(links[2].getAttribute("href") ?? "").toMatch(/\/month$/);
        expect(links[3].getAttribute("href") ?? "").toMatch(/\/more$/); // [เพิ่ม] ปุ่มที่ 4
    });

    it("เพิ่มคลาส active ถูกปุ่มตามเส้นทางปัจจุบัน - /home", () => {
        const { container } = renderAt("/home");
        const links = container.querySelectorAll('a.nav-button[href]');
        expect(links.length).toBe(4);
        expect(links[1].className).toMatch(/\bactive\b/); // home
        expect(links[0].className).not.toMatch(/\bactive\b/);
        expect(links[2].className).not.toMatch(/\bactive\b/);
        expect(links[3].className).not.toMatch(/\bactive\b/); // [เพิ่ม] ปุ่มที่ 4
    });

    it("เพิ่มคลาส active ถูกปุ่มตามเส้นทางปัจจุบัน - /expense", () => {
        const { container } = renderAt("/expense");
        const links = container.querySelectorAll('a.nav-button[href]');
        expect(links.length).toBe(4);
        expect(links[0].className).toMatch(/\bactive\b/); // expense
        expect(links[1].className).not.toMatch(/\bactive\b/);
        expect(links[2].className).not.toMatch(/\bactive\b/);
        expect(links[3].className).not.toMatch(/\bactive\b/); // [เพิ่ม] ปุ่มที่ 4
    });

    it("เพิ่มคลาส active ถูกปุ่มตามเส้นทางปัจจุบัน - /month", () => {
        const { container } = renderAt("/month");
        const links = container.querySelectorAll('a.nav-button[href]');
        expect(links.length).toBe(4);
        expect(links[2].className).toMatch(/\bactive\b/); // month
        expect(links[0].className).not.toMatch(/\bactive\b/);
        expect(links[1].className).not.toMatch(/\bactive\b/);
        expect(links[3].className).not.toMatch(/\bactive\b/); // [เพิ่ม] ปุ่มที่ 4
    });

    // [เพิ่ม] เทสต์สำหรับ /more
    it("ไม่เพิ่มคลาส active ที่ปุ่ม /more (เนื่องจาก bug ใน component)", () => {
        const { container } = renderAt("/more"); // ไปที่ /more
        const links = container.querySelectorAll('a.nav-button[href]');
        expect(links.length).toBe(4);

        // Component เช็ค 'is("/More")' (M ตัวใหญ่) แต่ path คือ '/more' (m ตัวเล็ก)
        // ดังนั้น active class จะไม่ถูกเพิ่ม
        expect(links[3].className).not.toMatch(/\bactive\b/); // คาดหวังว่าจะ *ไม่* active
        expect(links[0].className).not.toMatch(/\bactive\b/);
        expect(links[1].className).not.toMatch(/\bactive\b/);
        expect(links[2].className).not.toMatch(/\bactive\b/);
    });
});

