import React, { useState, useEffect } from 'react';
import './RepeatedTransactions.css';
import AddTransaction from './AddTransaction';
import { useLocation, useNavigate } from "react-router-dom"; // <-- Import เพิ่ม

const API_BASE = "http://localhost:8081";

interface Transaction {
    id: number;
    name: string;
    account: string;
    amount: number;
    date: string;
    frequency: string;
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
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const location = useLocation(); // <-- เพิ่ม Hook
    const navigate = useNavigate(); // <-- เพิ่ม Hook

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/repeated-transactions`, {
                headers: { Accept: "application/json" },
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to load repeated transactions");
            const data: Transaction[] = await res.json();
            setTransactions(data);
            return data; // <-- คืนค่า list ที่โหลดมา
        } catch (error) {
            console.error('Error loading transactions:', error);
            setTransactions([]);
            return []; // <-- คืนค่า array ว่างถ้า error
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // <-- เพิ่ม useEffect เพื่อดัก State จาก Summary -->
    useEffect(() => {
        const checkEditState = async () => {
            if (location.state?.editId && transactions.length > 0) {
                const editId = location.state.editId;
                const transactionToEdit = transactions.find(t => t.id === editId);

                if (transactionToEdit) {
                    setEditingTransaction(transactionToEdit);
                    setShowAddForm(true);
                    // Clear state after using it
                    navigate(location.pathname, { replace: true, state: null });
                } else {
                    // อาจจะโหลดใหม่เผื่อกรณีข้อมูลยังไม่อัปเดต
                    const updatedList = await fetchTransactions();
                    const foundAfterReload = updatedList.find(t => t.id === editId);
                    if (foundAfterReload) {
                        setEditingTransaction(foundAfterReload);
                        setShowAddForm(true);
                        navigate(location.pathname, { replace: true, state: null });
                    } else {
                        console.warn(`Transaction with ID ${editId} not found after reload.`);
                        navigate(location.pathname, { replace: true, state: null }); // Clear state anyway
                    }
                }
            }
        };

        checkEditState();

    }, [location.state, transactions, navigate]); // <-- เพิ่ม dependencies

    const handleEdit = (id: number) => {
        const transaction = transactions.find(t => t.id === id);
        if (transaction) {
            setEditingTransaction(transaction);
            setShowAddForm(true);
            setShowMenu(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('คุณต้องการลบธุรกรรมนี้หรือไม่?')) {
            try {
                const res = await fetch(`${API_BASE}/api/repeated-transactions/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
                if (!res.ok) throw new Error("Failed to delete");
                setTransactions(prev => prev.filter(t => t.id !== id));
            } catch (e) {
                console.error("Delete failed", e);
                alert("ลบไม่สำเร็จ");
            }
            setShowMenu(null);
        }
    };

    const toggleMenu = (id: number) => {
        setShowMenu(showMenu === id ? null : id);
    };

    const handleSubmit = async (data: TransactionFormData) => {
        console.log('handleSubmit ถูกเรียก!', data);

        const newAmount = parseFloat(data.amount || "0");
        if (isNaN(newAmount)) {
            alert('จำนวนเงินไม่ถูกต้อง');
            return;
        }

        const isEditing = !!editingTransaction;

        const payload = {
            ...data,
            amount: newAmount,
            id: isEditing ? editingTransaction.id : undefined,
        };

        const url = isEditing
            ? `${API_BASE}/api/repeated-transactions/${editingTransaction.id}`
            : `${API_BASE}/api/repeated-transactions`;

        const method = isEditing ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                credentials: "include",
            });

            if (!res.ok) throw new Error(await res.text());

            fetchTransactions();
            setShowAddForm(false);
            setEditingTransaction(null);

        } catch (e: any) {
            console.error("Submit failed", e);
            alert(`บันทึกไม่สำเร็จ: ${e.message}`);
        }
    };

    const handleCancel = () => {
        setShowAddForm(false);
        setEditingTransaction(null);
    };

    console.log('transactions ปัจจุบัน (จาก API):', transactions);
    console.log('showAddForm:', showAddForm);

    if (showAddForm) {
        const initialData = editingTransaction ? {
            name: editingTransaction.name,
            account: editingTransaction.account,
            amount: String(editingTransaction.amount),
            date: editingTransaction.date,
            frequency: editingTransaction.frequency
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