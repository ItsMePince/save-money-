// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { TempCategoryProvider } from "./TempCategoryContext";
import { PaymentMethodProvider } from "./PaymentMethodContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TempCategoryProvider>
        <PaymentMethodProvider>
          <App />
        </PaymentMethodProvider>
      </TempCategoryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
