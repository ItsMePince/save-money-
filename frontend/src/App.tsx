// src/App.tsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

import Header from "./components/Header";
import BottomNav from "./pages/buttomnav";

import Home from "./pages/Home";
import Day from "./pages/day";
import Month from "./pages/month";
import Income from "./pages/income";
import Expense from "./pages/expense";
import Summary from "./pages/summary";
import Location from "./pages/Location";
import More from "./pages/more";

//  เพิ่ม: Route ตัวเชื่อมไปหน้าเดิมสำหรับโหมดแก้ไข
import ExpenseEdit from "./pages/expense.edit";
import IncomeEdit from "./pages/income.edit";

// Auth / Account
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AccountSelect from "./pages/AccountSelect";
import AccountNew from "./pages/accountnew";

import CustomIncome from "./pages/customincome";
import CustomOutcome from "./pages/customoutcome";

function NotFound() {
  return (
    <div style={{ padding: 16 }}>
      <h3>404 - Page not found</h3>
      <a href="/">กลับหน้าแรก</a>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('isAuthenticated') === 'true'
  );
  const [isLoading, setIsLoading] = useState(false);

  // ใช้ useCallback เพื่อป้องกัน re-render ที่ไม่จำเป็น
  const checkAuth = useCallback(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    console.log('checkAuth called:', authStatus);
    setIsAuthenticated(authStatus);
  }, []);

  useEffect(() => {
    // เพิ่ม event listener
    window.addEventListener("auth-changed", checkAuth);

    return () => {
      window.removeEventListener("auth-changed", checkAuth);
    };
  }, [checkAuth]);

  const currentPath = location.pathname;

  // กำหนดหน้าที่ไม่ต้องแสดง nav (auth pages)
  const authPages = ['/login', '/signup'];
  const isAuthPage = authPages.includes(currentPath);

  // Debug
  console.log('Current path:', currentPath);
  console.log('Is auth page:', isAuthPage);
  console.log('Is authenticated:', isAuthenticated);

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* แสดง Header เฉพาะเมื่อ NOT auth page */}
      {!isAuthPage && <Header />}

      <Routes>
        {/* หน้าแรก - เป็น login เสมอ */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Auth Routes */}
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/signup"
          element={
            <AuthRoute>
              <SignUp />
            </AuthRoute>
          }
        />

        {/* Protected Routes - ต้อง login ก่อน */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/day"
          element={
            <ProtectedRoute>
              <Day />
            </ProtectedRoute>
          }
        />
        <Route
          path="/month"
          element={
            <ProtectedRoute>
              <Month />
            </ProtectedRoute>
          }
        />
        <Route
          path="/income"
          element={
            <ProtectedRoute>
              <Income />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expense"
          element={
            <ProtectedRoute>
              <Expense />
            </ProtectedRoute>
          }
        />

        {/*  เพิ่ม: เส้นทางโหมดแก้ไข (ใช้ component เดิมผ่านตัวเชื่อม .edit) */}
        <Route
          path="/expense-edit"
          element={
            <ProtectedRoute>
              <ExpenseEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/income-edit"
          element={
            <ProtectedRoute>
              <IncomeEdit />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/summary" 

          element={
            <ProtectedRoute>
              <Summary />
            </ProtectedRoute>
          }
        />

          <Route
              path="/location"

              element={
                  <ProtectedRoute>
                      <Location />
                  </ProtectedRoute>
              }
          />

        {/* Account Routes - ต้อง login ก่อน */}
        <Route
          path="/accountselect"
          element={
            <ProtectedRoute>
              <AccountSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accountnew"
          element={
            <ProtectedRoute>
              <AccountNew />
            </ProtectedRoute>
          }
        />

        {/* Custom category Routes - ต้อง login ก่อน */}
        <Route
          path="/customincome"
          element={
            <ProtectedRoute>
              <CustomIncome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customoutcome"
          element={
            <ProtectedRoute>
              <CustomOutcome />
            </ProtectedRoute>
          }
        />
          <Route
              path="/more"
              element={
                  <ProtectedRoute>
                      <More />
                  </ProtectedRoute>
              }
          />
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* แสดง BottomNav เฉพาะเมื่อ NOT auth page */}
      {!isAuthPage && <BottomNav />}
    </div>
  );
}
