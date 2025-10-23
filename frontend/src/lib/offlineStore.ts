// @ts-nocheck
const LS_KEY = "expenses_cache_v1";

function safeParse(raw: string | null) {
    try { return JSON.parse(raw || "[]"); } catch { return []; }
}
function toDateOnly(input: any) {
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const d = new Date(input);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function saveExpensesToCache(items: any[]) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(Array.isArray(items) ? items : []));
    } catch {}
}

export async function readExpensesCache(): Promise<any[]> {
    const arr = safeParse(localStorage.getItem(LS_KEY));
    return Array.isArray(arr) ? arr : [];
}

export async function getExpensesForRange(range: "all" | "month" | "day", base = new Date()) {
    const list = await readExpensesCache();
    if (range === "all") return list;

    const y = base.getFullYear();
    const m = base.getMonth() + 1;
    const d = base.getDate();

    if (range === "day") {
        const target = toDateOnly(new Date(y, m - 1, d).toISOString());
        return list.filter((x: any) => toDateOnly(x.date || x.occurredAt) === target);
    }

    if (range === "month") {
        const mStr = String(m).padStart(2, "0");
        const prefix = `${y}-${mStr}-`;
        return list.filter((x: any) => (toDateOnly(x.date || x.occurredAt) || "").startsWith(prefix));
    }

    return list;
}
