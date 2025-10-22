// src/PaymentMethodContext.tsx
// @ts-nocheck
import React, { createContext, useContext, useState } from "react";

type Payment = { id: string; name: string; favorite?: boolean } | null;

const Ctx = createContext<{
  payment: Payment;
  setPayment: (p: Payment) => void;
  clearPayment: () => void;
}>({
  payment: null,
  setPayment: () => {},
  clearPayment: () => {},
});

export function PaymentMethodProvider({ children }) {
  const [payment, setPayment] = useState<Payment>(null);
  const clearPayment = () => setPayment(null);
  return (
    <Ctx.Provider value={{ payment, setPayment, clearPayment }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePaymentMethod = () => useContext(Ctx);
