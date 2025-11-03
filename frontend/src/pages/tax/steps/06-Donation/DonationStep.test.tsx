import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DonationStep from './DonationStep';

// Mock the props that the component expects
const mockSetValues = vi.fn();
const mockOnNext = vi.fn();
const mockOnBack = vi.fn();

const defaultProps = {
    values: {
        donationGeneral: '',
        donationEducation: '',
        donationPolitical: '',
    },
    setValues: mockSetValues,
    onNext: mockOnNext,
    onBack: mockOnBack,
};

describe('DonationStep Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        render(<DonationStep {...defaultProps} />);
    });

    /**
     * FIX: Changed 'Back'/'Next' to 'ย้อนกลับ'/'ถัดไป' to match
     * what your FooterNav component actually renders.
     */
    it('should render the default state correctly', () => {
        // Check title
        expect(screen.getByText('บริจาค')).toBeInTheDocument();

        // Check labels
        const label1 = 'บริจาคทั่วไป (มูลนิธิ / สาธารณกุศล)';
        const label2 = 'บริจาคเพื่อการศึกษา / กีฬา / โรงพยาบาลรัฐ';
        const label3 = 'บริจาคเพื่อการเมือง';

        expect(screen.getByLabelText<HTMLInputElement>(label1).value).toBe('');
        expect(screen.getByLabelText<HTMLInputElement>(label2).value).toBe('');
        expect(screen.getByLabelText<HTMLInputElement>(label3).value).toBe('');

        // Check footer buttons with the correct Thai text
        expect(screen.getByText('ย้อนกลับ')).toBeInTheDocument();
        expect(screen.getByText('ถัดไป')).toBeInTheDocument();
    });

    /**
     * FIX: Changed 'Back'/'Next' to 'ย้อนกลับ'/'ถัดไป' to find
     * the buttons for clicking.
     */
    it('should call onBack and onNext when footer buttons are clicked', () => {
        // Find and click the 'Back' button
        fireEvent.click(screen.getByText('ย้อนกลับ'));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
        expect(mockOnNext).not.toHaveBeenCalled();

        // Find and click the 'Next' button
        fireEvent.click(screen.getByText('ถัดไป'));
        expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    /**
     * FIX: Changed the expected value from '1000' to '1,000' to
     * match the formatted output of your AmountInput component.
     */
    it('should call setValues with correct data when inputs change', () => {
        const label1 = 'บริจาคทั่วไป (มูลนิธิ / สาธารณกุศล)';
        const label3 = 'บริจาคเพื่อการเมือง';

        // Simulate typing in the "general donation" input
        const generalInput = screen.getByLabelText<HTMLInputElement>(label1);
        fireEvent.change(generalInput, { target: { value: '1000' } });

        // Expect the FORMATTED value (with a comma)
        expect(mockSetValues).toHaveBeenCalledWith({ donationGeneral: '1,000' });

        // Simulate typing in the "political donation" input
        const politicalInput = screen.getByLabelText<HTMLInputElement>(label3);
        fireEvent.change(politicalInput, { target: { value: '500' } });

        // Expect the value (no comma needed for '500')
        expect(mockSetValues).toHaveBeenCalledWith({ donationPolitical: '500' });
    });
});