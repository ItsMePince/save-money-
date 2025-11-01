// src/pages/RepeatedTransactions.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RepeatedTransactions from './RepeatedTransactions';

// --- Mock Dependencies ---

// 1. Mock Child Component (AddTransaction)
vi.mock('./AddTransaction', () => ({
    default: ({ onCancel, onSubmit, initialData, isEditing }: any) => (
        <div data-testid="mock-add-transaction">
            <h1>Mock Add/Edit Form</h1>
            {isEditing && <span>Editing Mode</span>}
            <pre>{JSON.stringify(initialData)}</pre>
            <button onClick={onCancel}>Mock Cancel</button>
            <button onClick={() => onSubmit(initialData || { name: 'Test Submit' })}>
                Mock Submit
            </button>
        </div>
    ),
}));

// 2. Mock global.fetch
// [FIX] ลบ "declare global" block ของ fetch ออก
// เพราะ 'vitest/globals' ใน tsconfig.json ได้จัดการ type ของ vi.fn() แล้ว

const mockTransactions = [
    { id: 1, name: "Netflix", account: "K-Bank", amount: 199, date: "2025-10-01", frequency: "MONTHLY" },
    { id: 2, name: "Spotify", account: "SCB", amount: 129, date: "2025-10-05", frequency: "MONTHLY" },
];

// Helper function to render with Router context
const renderComponent = (initialState: any = null) => {
    return render(
        <MemoryRouter initialEntries={[{ pathname: '/', state: initialState }]}>
            <Routes>
                <Route path="/" element={<RepeatedTransactions />} />
            </Routes>
        </MemoryRouter>
    );
};

// --- Test Suite ---

describe('RepeatedTransactions Page', () => {

    beforeEach(() => {
        // Mock fetch ให้คืนค่า array ว่างเป็น default
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [],
        });
        // Mock window.confirm ให้เป็น true เสมอ
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('ควร fetch ธุรกรรมตอนโหลด และแสดง "ยังไม่มีรายการ" ถ้า API คืนค่าว่าง', async () => {
        renderComponent();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8081/api/repeated-transactions",
                expect.any(Object)
            );
        });
        expect(await screen.findByText(/ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ/i)).toBeInTheDocument();
    });

    it('ควรแสดงรายการธุรกรรมเมื่อ API คืนข้อมูล', async () => {
        // [FIX] สร้าง mock ใหม่สำหรับ test case นี้
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockTransactions,
        });

        renderComponent();

        expect(await screen.findByText('Netflix')).toBeInTheDocument();
        expect(screen.getByText('Spotify')).toBeInTheDocument();
        expect(screen.getByText(/199/)).toBeInTheDocument();
        expect(screen.getByText(/129/)).toBeInTheDocument();
        expect(screen.queryByText(/ยังไม่มีรายการ/i)).not.toBeInTheDocument();
    });

    it('ควรแสดงฟอร์ม (Mock) เมื่อกดปุ่มบวก', async () => {
        renderComponent();
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /ธุรกรรมที่เกิดซ้ำ/i })).toBeInTheDocument();
        });

        const addButton = screen.getByRole('button', { name: '+' });
        fireEvent.click(addButton);

        expect(await screen.findByTestId('mock-add-transaction')).toBeInTheDocument();
        expect(screen.queryByText(/ธุรกรรมที่เกิดซ้ำ/i)).not.toBeInTheDocument();
        expect(screen.queryByText('Editing Mode')).not.toBeInTheDocument();
    });

    it('ควรกลับมาหน้ารายการเมื่อกด Cancel จากฟอร์ม', async () => {
        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: '+' }));
        const form = await screen.findByTestId('mock-add-transaction');

        const cancelButton = within(form).getByText('Mock Cancel');
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByTestId('mock-add-transaction')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('heading', { name: /ธุรกรรมที่เกิดซ้ำ/i })).toBeInTheDocument();
    });

    it('ควรแสดงเมนู Edit/Delete เมื่อคลิกปุ่ม ...', async () => {
        // [FIX] สร้าง mock ใหม่สำหรับ test case นี้
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockTransactions });
        renderComponent();

        const netflixCard = (await screen.findByText('Netflix')).closest('.transaction-card');
        expect(netflixCard).toBeInTheDocument();

        // [FIX] Cast "netflixCard" (Element) ให้เป็น "HTMLElement"
        const menuButton = within(netflixCard as HTMLElement).getByRole('button', { name: '' });

        expect(screen.queryByText('แก้ไข')).not.toBeInTheDocument();

        fireEvent.click(menuButton);
        expect(await screen.findByText('แก้ไข')).toBeInTheDocument();
        expect(screen.getByText('ลบ')).toBeInTheDocument();

        fireEvent.click(menuButton);
        await waitFor(() => {
            expect(screen.queryByText('แก้ไข')).not.toBeInTheDocument();
        });
    });

    it('ควรเปิดฟอร์ม Edit (Mock) พร้อม initialData เมื่อกด "แก้ไข"', async () => {
        // [FIX] สร้าง mock ใหม่สำหรับ test case นี้
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockTransactions });
        renderComponent();

        const spotifyCard = (await screen.findByText('Spotify')).closest('.transaction-card');
        // [FIX] Cast "spotifyCard" (Element) ให้เป็น "HTMLElement"
        const menuButton = within(spotifyCard as HTMLElement).getByRole('button', { name: '' });
        fireEvent.click(menuButton);

        const editButton = await screen.findByText('แก้ไข');
        fireEvent.click(editButton);

        const form = await screen.findByTestId('mock-add-transaction');
        expect(form).toBeInTheDocument();
        expect(screen.getByText('Editing Mode')).toBeInTheDocument();
        expect(within(form).getByText(/"name":"Spotify"/i)).toBeInTheDocument();
        expect(within(form).getByText(/"amount":"129"/i)).toBeInTheDocument();
    });

    it('ควรเรียก API DELETE และลบรายการออกจาก UI เมื่อกดยืนยัน "ลบ"', async () => {
        // [FIX] สร้าง mock ใหม่แบบ chain สำหรับ test case นี้
        global.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => mockTransactions }) // 1. GET (Initial load)
            .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // 2. DELETE (Successful)

        renderComponent();

        const netflixCard = (await screen.findByText('Netflix')).closest('.transaction-card');
        // [FIX] Cast "netflixCard" (Element) ให้เป็น "HTMLElement"
        const menuButton = within(netflixCard as HTMLElement).getByRole('button', { name: '' });
        fireEvent.click(menuButton);

        const deleteButton = await screen.findByText('ลบ');
        fireEvent.click(deleteButton);

        expect(window.confirm).toHaveBeenCalledWith('คุณต้องการลบธุรกรรมนี้หรือไม่?');

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8081/api/repeated-transactions/1",
                expect.objectContaining({ method: 'DELETE' })
            );
        });

        expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
        expect(screen.getByText('Spotify')).toBeInTheDocument();
    });

    it('ควรเรียก API POST และ refetch เมื่อ Submit จากโหมด Add', async () => {
        // [FIX] สร้าง mock ใหม่แบบ chain สำหรับ test case นี้
        global.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => [] }) // 1. GET (Initial load)
            .mockResolvedValueOnce({ ok: true, json: async () => mockTransactions[0] }) // 2. POST (Submit)
            .mockResolvedValueOnce({ ok: true, json: async () => [mockTransactions[0]] }); // 3. GET (Refetch)

        renderComponent();

        fireEvent.click(screen.getByRole('button', { name: '+' }));
        const form = await screen.findByTestId('mock-add-transaction');

        const submitButton = within(form).getByText('Mock Submit');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8081/api/repeated-transactions",
                expect.objectContaining({ method: 'POST' })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8081/api/repeated-transactions",
                expect.objectContaining({ headers: { Accept: "application/json" } })
            );
        });

        expect(screen.queryByTestId('mock-add-transaction')).not.toBeInTheDocument();
        expect(await screen.findByText('Netflix')).toBeInTheDocument();
    });

    it('ควรเรียก API PUT และ refetch เมื่อ Submit จากโหมด Edit', async () => {
        // [FIX] สร้าง mock ใหม่แบบ chain สำหรับ test case นี้
        global.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => mockTransactions }) // 1. GET (Initial load)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTransactions[0], name: "Netflix HD" }) }) // 2. PUT (Submit)
            .mockResolvedValueOnce({ ok: true, json: async () => [ // 3. GET (Refetch)
                    { ...mockTransactions[0], name: "Netflix HD" },
                    mockTransactions[1]
                ]});

        renderComponent();

        const netflixCard = (await screen.findByText('Netflix')).closest('.transaction-card');
        // [FIX] Cast "netflixCard" (Element) ให้เป็น "HTMLElement"
        fireEvent.click(within(netflixCard as HTMLElement).getByRole('button', { name: '' }));
        fireEvent.click(await screen.findByText('แก้ไข'));

        const form = await screen.findByTestId('mock-add-transaction');
        const submitButton = within(form).getByText('Mock Submit');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8081/api/repeated-transactions/1",
                expect.objectContaining({ method: 'PUT' })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8081/api/repeated-transactions",
                expect.objectContaining({ headers: { Accept: "application/json" } })
            );
        });

        expect(screen.queryByTestId('mock-add-transaction')).not.toBeInTheDocument();
        expect(await screen.findByText('Netflix HD')).toBeInTheDocument();
        expect(screen.getByText('Spotify')).toBeInTheDocument();
    });

    it('ควรเปิดฟอร์ม Edit อัตโนมัติเมื่อมี location.state.editId', async () => {
        // [FIX] สร้าง mock ใหม่สำหรับ test case นี้
        global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockTransactions });

        renderComponent({ editId: 2 });

        const form = await screen.findByTestId('mock-add-transaction');
        expect(form).toBeInTheDocument();
        expect(screen.getByText('Editing Mode')).toBeInTheDocument();
        expect(within(form).getByText(/"name":"Spotify"/i)).toBeInTheDocument();
        expect(within(form).getByText(/"amount":"129"/i)).toBeInTheDocument();
        expect(screen.queryByText(/ธุรกรรมที่เกิดซ้ำ/i)).not.toBeInTheDocument();
    });

    it('ควร refetch ถ้า location.state.editId ไม่พบในข้อมูลชุดแรก', async () => {
        // [FIX] สร้าง mock ใหม่แบบ chain สำหรับ test case นี้
        global.fetch = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => [mockTransactions[1]] }) // 1. GET (Initial load)
            .mockResolvedValueOnce({ ok: true, json: async () => mockTransactions }); // 2. GET (Refetch)

        renderComponent({ editId: 1 });

        const form = await screen.findByTestId('mock-add-transaction');
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Editing Mode')).toBeInTheDocument();
        expect(within(form).getByText(/"name":"Netflix"/i)).toBeInTheDocument();
    });
});