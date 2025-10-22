// src/hooks/useEditPrefill.ts
//  Hook ใช้ร่วมกันทั้ง Expense และ Income สำหรับ prefill ฟอร์มตอนแก้ไข
// รองรับการรับค่า date-only หรือ datetime แบบเต็ม
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type EditState = {
  mode?: "edit" | "add";
  data?: {
    id: number;
    typeLabel: "ค่าใช้จ่าย" | "รายได้";
    category: string;
    amount: number;
    note: string;
    place: string;
    date: string;        // yyyy-MM-dd
    datetime?: string;   // yyyy-MM-ddTHH:mm (local)  ← เพิ่มรองรับเวลา
    paymentMethod?: string;
    iconKey?: string;
  };
};

/**
 * Hook นี้ใช้ดึงข้อมูลจาก navigate(state)
 * ที่ส่งมาจากหน้า Summary แล้วเติมลง form
 *
 * @param onPrefill callback เรียกเมื่อเจอข้อมูลเก่ามา
 * @param editIdStorageKey key สำหรับเก็บ id ใน sessionStorage
 */
export function useEditPrefill(
  onPrefill: (d: NonNullable<EditState["data"]>) => void,
  editIdStorageKey: string
) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const st = (location.state || {}) as EditState;
    if (st?.mode === "edit" && st.data) {
      onPrefill(st.data);
      // เก็บ id ไว้ใช้ตอน onConfirm
      sessionStorage.setItem(editIdStorageKey, String(st.data.id));
      // ล้าง state router เพื่อป้องกัน prefill ซ้ำเมื่อ refresh
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
