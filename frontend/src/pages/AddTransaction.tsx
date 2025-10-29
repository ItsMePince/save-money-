import React, { useState, useEffect, useRef } from 'react';
import './AddTransaction.css';

interface AddTransactionProps {
    onCancel: () => void;
    onSubmit: (data: TransactionFormData) => void;
    initialData?: TransactionFormData;
    isEditing?: boolean;
}

export interface TransactionFormData {
    name: string;
    account: string;
    amount: string;
    date: string;
    frequency: string;
}

type Account = {
    name: string;
    amount: number | string;
    iconKey?: string
};

const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:8081";

function formatDateToDDMMYYYY(dateString: string): string {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return '';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateToYYYYMMDD(dateString: string): string {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    const parts = dateString.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month}-${day}`;
    }
    return getTodayISO();
}

function getTodayISO(): string {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
};

function formatThaiDate(isoDate: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "เลือกวันที่";
    const [y, m, dd] = isoDate.split("-");
    return `${dd}/${m}/${parseInt(y, 10) + 543}`;
};


const AddTransaction: React.FC<AddTransactionProps> = ({
                                                           onCancel,
                                                           onSubmit,
                                                           initialData,
                                                           isEditing = false
                                                       }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [formData, setFormData] = useState<TransactionFormData>(() => ({
        name: initialData?.name || '',
        account: initialData?.account || '',
        amount: initialData?.amount || '',
        date: initialData ? formatDateToYYYYMMDD(initialData.date) : getTodayISO(),
        frequency: initialData?.frequency || 'ทุกเดือน'
    }));

    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/accounts`, {
                    headers: { Accept: "application/json" },
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch accounts");
                const loadedAccounts: Account[] = await res.json();
                setAccounts(loadedAccounts);
            } catch (e) {
                console.error("Failed to load accounts for dropdown", e);
                setAccounts([]);
            }
        };
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                account: initialData.account,
                amount: initialData.amount,
                date: formatDateToYYYYMMDD(initialData.date),
                frequency: initialData.frequency
            });
        }
    }, [initialData]);

    const handleSubmit = () => {
        if (formData.name && formData.amount && formData.date && formData.account) {
            const submissionData = {
                ...formData,
                date: formatDateToDDMMYYYY(formData.date)
            };
            onSubmit(submissionData);
        } else {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน (รวมถึงเลือกบัญชี)');
        }
    };

    const openDatePicker = (e?: React.MouseEvent | React.KeyboardEvent) => {
        e?.preventDefault();
        const el = dateInputRef.current;
        if (!el) return;
        try {
            (el as any).showPicker();
        } catch (err) {
            el.click();
            el.focus();
        }
    };

    return (
        <div className="add-transaction">
            <div className="form-container">
                <h1>{isEditing ? 'แก้ไขธุรกรรมที่เกิดซ้ำ' : 'เพิ่มธุรกรรมที่เกิดซ้ำ'}</h1>

                <div className="form-content">
                    <div className="form-field">
                        <label>ชื่อประเภท</label>
                        <input
                            type="text"
                            placeholder="ชื่อธุรกรรม"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                            }}
                        />
                    </div>

                    <div className="form-field">
                        <label>เลือกบัญชี</label>
                        <select
                            value={formData.account}
                            onChange={(e) => {
                                setFormData({ ...formData, account: e.target.value });
                            }}
                        >
                            <option value="">เลือกบัญชี</option>
                            {accounts.map((acc, idx) => (
                                <option key={idx} value={acc.name}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>จำนวนเงิน</label>
                        <input
                            type="number"
                            placeholder="บาท"
                            value={formData.amount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                    setFormData({ ...formData, amount: value });
                                }
                            }}
                            onKeyPress={(e) => {
                                if (!/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>

                    <div className="form-field">
                        <label>วันที่</label>
                        <button
                            type="button"
                            className="date-input-wrapper"
                            onClick={openDatePicker}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDatePicker(e)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: '8px',
                                cursor: 'pointer',
                                position: 'relative',
                                background: 'transparent',
                                border: 'none',
                                width: '100%',
                                padding: 0
                            }}
                        >
                            <span style={{ color: '#111827', fontSize: '16px' }}>
                                {formatThaiDate(formData.date)}
                            </span>

                            <svg className="calendar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#111827', flexShrink: 0 }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>

                            <input
                                ref={dateInputRef}
                                type="date"
                                value={formData.date}
                                onChange={(e) => {
                                    setFormData({ ...formData, date: e.target.value });
                                }}
                                style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none", width: '100%', height: '100%' }}
                                tabIndex={-1}
                                aria-hidden="true"
                            />
                        </button>
                    </div>

                    <div className="form-field">
                        <label>ความถี่</label>
                        <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                        >
                            <option value="">เลือกความถี่</option>
                            <option value="ทุกวัน">ทุกวัน</option>
                            <option value="ทุกสัปดาห์">ทุกสัปดาห์</option>
                            <option value="ทุกเดือน">ทุกเดือน</option>
                            <option value="ทุกปี">ทุกปี</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button className="cancel-btn" onClick={onCancel}>
                            ยกเลิก
                        </button>
                        <button className="submit-btn" onClick={handleSubmit}>
                            {isEditing ? 'บันทึก' : 'ยืนยัน'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTransaction;