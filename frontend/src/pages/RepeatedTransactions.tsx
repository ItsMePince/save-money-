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

// --- เพิ่มฟังก์ชัน load/save accounts (เหมือน Home.tsx) ---
type Account = { name: string; amount: number | string; iconKey?: string };

function loadAccounts(): Account[] {
    try {
        const raw = localStorage.getItem("accounts");
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {}
    return [
        { name: "ไทยพาณิชย์", amount: 20000, iconKey: "bank" },
        { name: "กสิกรไทย", amount: 20000, iconKey: "wallet" },
    ];
}

function saveAccounts(list: Account[]) {
    localStorage.setItem("accounts", JSON.stringify(list));
    // แจ้งหน้าอื่นๆ ว่ายอดบัญชีเปลี่ยนแล้ว
    window.dispatchEvent(new Event('accountsUpdated'));
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
            // (เลือกได้) ถ้าต้องการคืนยอดบัญชีเมื่อลบ ให้เพิ่ม logic คืนยอดที่นี่
        }
    };

    const toggleMenu = (id: number) => {
        setShowMenu(showMenu === id ? null : id);
    };

    // --- แก้แยะที่นี่: handleSubmit จะอัปเดตบัญชีจริงด้วย ---
    const handleSubmit = (data: TransactionFormData) => {
        console.log('handleSubmit ถูกเรียก!', data);
        console.log('editingTransaction:', editingTransaction);

        const newAmount = parseFloat(data.amount || "0");
        if (isNaN(newAmount)) {
            alert('จำนวนเงินไม่ถูกต้อง');
            return;
        }

        // โหลดบัญชีปัจจุบัน
        const accounts = loadAccounts();

        if (editingTransaction) {
            // แก้ไขธุรกรรมที่มีอยู่
            const updatedTransactions = transactions.map(t =>
                t.id === editingTransaction.id
                    ? {
                        id: t.id,
                        name: data.name,
                        date: data.date,
                        amount: newAmount
                    }
                    : t
            );
            setTransactions(updatedTransactions);

            // ปรับยอดบัญชี: คำนวณ delta (สมมติ transaction เป็นค่าใช้จ่าย => หักจากบัญชี)
            // delta >0 => จำนวนใหม่มากกว่าเดิม => หักเพิ่ม ; delta <0 => คืนเงินบางส่วน
            const delta = newAmount - editingTransaction.amount; // positive -> additional expense
            const accIdx = accounts.findIndex(a => a.name === data.account);
            if (accIdx >= 0) {
                const current = Number(accounts[accIdx].amount || 0);
                accounts[accIdx].amount = current - delta; // หัก delta (ถ้า delta negative เป็นการคืนเงิน)
                saveAccounts(accounts);
            } else {
                console.warn('ไม่พบบัญชีที่เลือกเพื่อปรับยอด:', data.account);
            }

            setEditingTransaction(null);
        } else {
            // เพิ่มธุรกรรมใหม่
            const newTransaction: Transaction = {
                id: Date.now(),
                name: data.name,
                date: data.date,
                amount: newAmount
            };
            console.log('เพิ่มธุรกรรมใหม่:', newTransaction);
            const updatedTransactions = [...transactions, newTransaction];
            console.log('รายการทั้งหมด:', updatedTransactions);
            setTransactions(updatedTransactions);

            // หักยอดจากบัญชีที่เลือก (สมมติเป็นค่าใช้จ่าย)
            const accIdx = accounts.findIndex(a => a.name === data.account);
            if (accIdx >= 0) {
                const current = Number(accounts[accIdx].amount || 0);
                accounts[accIdx].amount = current - newAmount;
                saveAccounts(accounts);
            } else {
                console.warn('ไม่พบบัญชีที่เลือกเพื่อหักยอด:', data.account);
            }
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

    // ... (ส่วนแสดงรายการเดิมไม่เปลี่ยน)
    return (
        <div className="repeated-transactions">
            {/* existing UI below (unchanged) */}
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
                                            แก้ไข
                                        </button>
                                        <button
                                            className="menu-item delete"
                                            onClick={() => handleDelete(transaction.id)}
                                        >
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
