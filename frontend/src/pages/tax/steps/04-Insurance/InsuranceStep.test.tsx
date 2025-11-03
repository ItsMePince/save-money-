import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InsuranceStep from './InsuranceStep'; // Adjust the import path as needed

// Mock the FooterNav component
vi.mock('../../shared/FooterNav', () => ({
    default: ({ onBack, onNext, showBack, nextDisabled }: any) => (
        <div data-testid="footer-nav">
            {showBack && (
                <button onClick={onBack} data-testid="back-button">
                    Back
                </button>
            )}
            <button onClick={onNext} disabled={nextDisabled} data-testid="next-button">
                Next
            </button>
        </div>
    ),
}));

// Mock the AmountInput component
// เราจำลอง AmountInput ให้เป็น input ธรรมดา
// เพื่อทดสอบว่า InsuranceStep ส่ง props (value, onChange) ไปให้มันถูกต้อง
vi.mock('../../shared/AmountInput', () => ({
    default: ({
                  label,
                  value,
                  onChange,
                  name, // เราใช้ 'name' เพื่อสร้าง data-testid ที่ไม่ซ้ำกัน
              }: {
        label: React.ReactNode;
        value: string;
        onChange: (v: string) => void;
        name: string;
    }) => (
        <label>
            {label}
            <input
                data-testid={`input-${name}`} // e.g., input-lifeIns
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
            />
        </label>
    ),
}));

// Define the Props type for our test setup
type Props = React.ComponentProps<typeof InsuranceStep>;

describe('InsuranceStep Component', () => {
    // Define mock functions and default props
    let mockSetValues: ReturnType<typeof vi.fn>;
    let mockOnBack: ReturnType<typeof vi.fn>;
    let mockOnNext: ReturnType<typeof vi.fn>;
    let defaultProps: Props;

    beforeEach(() => {
        // Reset mocks before each test
        mockSetValues = vi.fn();
        mockOnBack = vi.fn();
        mockOnNext = vi.fn();

        defaultProps = {
            values: {}, // Start with empty values
            setValues: mockSetValues,
            onBack: mockOnBack,
            onNext: mockOnNext,
        };

        render(<InsuranceStep {...defaultProps} />);
    });

    it('should render the default state correctly', () => {
        expect(screen.getByText('ประกัน')).toBeInTheDocument();
        expect(screen.getByText(/^เบี้ยประกันชีวิต$/)).toBeInTheDocument();
        expect(screen.getByText(/^เบี้ยประกันสุขภาพ$/)).toBeInTheDocument();
        expect(screen.getByTestId('footer-nav')).toBeInTheDocument();
    });

    it('should call onBack and onNext when footer buttons are clicked', () => {
        fireEvent.click(screen.getByTestId('back-button'));
        expect(mockOnBack).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId('next-button'));
        expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should call setValues with correct data when inputs change', () => {
        // Test Life Insurance
        const lifeInsInput = screen.getByTestId('input-lifeIns');
        fireEvent.change(lifeInsInput, { target: { value: '10000' } });
        expect(mockSetValues).toHaveBeenCalledWith({ lifeIns: '10000' });

        // Test Health Insurance
        const healthInsInput = screen.getByTestId('input-healthIns');
        fireEvent.change(healthInsInput, { target: { value: '5000' } });
        expect(mockSetValues).toHaveBeenCalledWith({ healthIns: '5000' });

        // Test Parent Health Insurance
        const parentHealthInsInput = screen.getByTestId('input-parentHealthIns');
        fireEvent.change(parentHealthInsInput, { target: { value: '15000' } });
        expect(mockSetValues).toHaveBeenCalledWith({ parentHealthIns: '15000' });

        // Test Annuity Life Insurance
        const annuityLifeInsInput = screen.getByTestId('input-annuityLifeIns');
        fireEvent.change(annuityLifeInsInput, { target: { value: '50000' } });
        expect(mockSetValues).toHaveBeenCalledWith({ annuityLifeIns: '50000' });
    });
});