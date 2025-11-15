export const API_BASE =
    import.meta.env.VITE_API_BASE ||
    (window.location.hostname === "localhost" ? "http://localhost:8081/api" : "/api");


export type ExpenseDTO = {
    id: number;
    type: "EXPENSE" | "INCOME";
    category: string;
    amount: number;
    note?: string | null;
    place?: string | null;
    occurredAt?: string | null;
    date?: string | null;
    paymentMethod?: string | null;
    iconKey?: string | null;
    userId?: number;
    username?: string;
} & Record<string, any>;

type ApiRepeatedTransaction = {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string;
    frequency: string;
}

function toISODate(anyDate: string): string {
    if (!anyDate) return new Date().toISOString().slice(0, 10);
    const s = anyDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split("/");
        return `${y}-${m}-${d}`;
    }
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
}

function mapRepeatedToExpenseDTO(rt: ApiRepeatedTransaction): ExpenseDTO {
    const amt = Number(rt.amount || 0);
    const iso = toISODate(rt.date);
    return {
        id: rt.id,
        type: "EXPENSE",
        category: rt.name,
        amount: Math.abs(isFinite(amt) ? amt : 0),
        note: `(ซ้ำ: ${rt.frequency})`,
        place: null,
        date: iso,
        occurredAt: null,
        paymentMethod: rt.account,
        iconKey: "RefreshCw"
    }
}

export async function fetchAllTransactions(): Promise<ExpenseDTO[]> {
    const [resExpenses, resRepeated] = await Promise.all([
        fetch(`${API_BASE}/expenses`, {
            headers: { Accept: "application/json" },
            credentials: "include",
        }),
        fetch(`${API_BASE}/repeated-transactions`, {
            headers: { Accept: "application/json" },
            credentials: "include",
        })
    ]);

    if (!resExpenses.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (${resExpenses.status})`);
    if (!resRepeated.ok) throw new Error(`โหลดรายการซ้ำไม่สำเร็จ (${resRepeated.status})`);

    const serverData: ExpenseDTO[] = await resExpenses.json();
    const repeatedData: ApiRepeatedTransaction[] = await resRepeated.json();

    const repeatedAsExpenses = repeatedData.map(mapRepeatedToExpenseDTO);

    return [...serverData, ...repeatedAsExpenses];
}