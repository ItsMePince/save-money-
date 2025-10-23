// src/pages/RepeatedTransactions.tsx
import React, { useState, useEffect } from 'react';
import './RepeatedTransactions.css';
import AddTransaction from './AddTransaction';

interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: number;
}

export interface TransactionFormData {
  name: string;
  account: string;
  amount: string;
  date: string;
  frequency: string;
}

export default function RepeatedTransactions() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showMenu, setShowMenu] = useState<number | null>(null);

  // โหลดข้อมูลจาก localStorage
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('repeatedTransactions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
    return [];
  });

  // บันทึกข้อมูลลง localStorage ทุกครั้งที่มีการเปลี่ยนแปลง
  useEffect(() => {
    try {
      localStorage.setItem('repeatedTransactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }, [transactions]);

  const handleEdit = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setShowAddForm(true);
      setShowMenu(null);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('คุณต้องการลบธุรกรรมนี้หรือไม่?')) {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      setShowMenu(null);
    }
  };

  const toggleMenu = (id: number) => {
    setShowMenu(showMenu === id ? null : id);
  };

  const handleSubmit = (data: TransactionFormData) => {
    console.log('handleSubmit ถูกเรียก!', data);
    console.log('editingTransaction:', editingTransaction);

    if (editingTransaction) {
      // แก้ไขธุรกรรมที่มีอยู่
      const updatedTransactions = transactions.map(t =>
        t.id === editingTransaction.id
          ? {
              id: t.id,
              name: data.name,
              date: data.date,
              amount: parseFloat(data.amount)
            }
          : t
      );
      console.log('อัพเดทธุรกรรม:', updatedTransactions);
      setTransactions(updatedTransactions);
      setEditingTransaction(null);
    } else {
      // เพิ่มธุรกรรมใหม่
      const newTransaction: Transaction = {
        id: Date.now(),
        name: data.name,
        date: data.date,
        amount: parseFloat(data.amount)
      };
      console.log('เพิ่มธุรกรรมใหม่:', newTransaction);
      const updatedTransactions = [...transactions, newTransaction];
      console.log('รายการทั้งหมด:', updatedTransactions);
      setTransactions(updatedTransactions);
    }
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTransaction(null);
  };

  console.log('transactions ปัจจุบัน:', transactions);
  console.log('showAddForm:', showAddForm);

  // ถ้าแสดงฟอร์มเพิ่ม/แก้ไขธุรกรรม
  if (showAddForm) {
    // เตรียมข้อมูลเริ่มต้นสำหรับแก้ไข
    const initialData = editingTransaction ? {
      name: editingTransaction.name,
      account: '',
      amount: String(editingTransaction.amount),
      date: editingTransaction.date,
      frequency: 'ทุกเดือน'
    } : undefined;

    return (
      <AddTransaction
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        initialData={initialData}
        isEditing={!!editingTransaction}
      />
    );
  }

  // หน้าหลัก - รายการธุรกรรมที่เกิดซ้ำ
  return (
    <div className="repeated-transactions">
      <div className="header">
        <h1>ธุรกรรมที่เกิดซ้ำ</h1>
        <button className="add-btn" onClick={() => {
          console.log('กดปุ่มบวก');
          setShowAddForm(true);
        }}>
          <span className="plus-icon">+</span>
        </button>
      </div>

      <div className="transactions-list">
        {transactions.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '40px', fontSize: '16px' }}>
            ยังไม่มีรายการธุรกรรมที่เกิดซ้ำ
          </p>
        )}
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-card">
            <div className="transaction-info">
              <h3>{transaction.name}</h3>
              <p className="date">{transaction.date}</p>
            </div>
            <div className="transaction-actions">
              <span className="amount">{transaction.amount.toLocaleString()}</span>
              <div className="menu-container">
                <button
                  className="menu-btn"
                  onClick={() => toggleMenu(transaction.id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                {showMenu === transaction.id && (
                  <div className="dropdown-menu">
                    <button
                      className="menu-item edit"
                      onClick={() => handleEdit(transaction.id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      แก้ไข
                    </button>
                    <button
                      className="menu-item delete"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}