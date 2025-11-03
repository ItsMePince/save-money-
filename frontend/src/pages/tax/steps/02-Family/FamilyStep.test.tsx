import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FamilyStep from './FamilyStep'; // Adjust the import path as needed

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

// Define the Props type for our test setup
type Props = React.ComponentProps<typeof FamilyStep>;

describe('FamilyStep Component', () => {
    // Define mock functions and default props
    let mockSetValues: ReturnType<typeof vi.fn>;
    let mockOnBack: ReturnType<typeof vi.fn>;
    let mockOnNext: ReturnType<typeof vi.fn>;
    let defaultProps: Props;

    // Helper function to render (and re-render) the component with updated values
    let rerender: (
        newProps: Partial<Props> | { values: Partial<Props['values']> }
    ) => void;

    beforeEach(() => {
        // Reset mocks before each test
        mockSetValues = vi.fn();
        mockOnBack = vi.fn();
        mockOnNext = vi.fn();

        defaultProps = {
            values: {},
            setValues: mockSetValues,
            onBack: mockOnBack,
            onNext: mockOnNext,
        };

        // Use RTL's rerender function to simulate prop updates
        const { rerender: rtlRerender } = render(<FamilyStep {...defaultProps} />);
        rerender = (newProps) => {
            if ('values' in newProps) {
                defaultProps.values = { ...defaultProps.values, ...newProps.values };
            }
            if ('setValues' in newProps) defaultProps.setValues = newProps.setValues!;
            if ('onBack' in newProps) defaultProps.onBack = newProps.onBack!;
            if ('onNext' in newProps) defaultProps.onNext = newProps.onNext!;

            rtlRerender(<FamilyStep {...defaultProps} />);
        };
    });

    it('should render the default state correctly', () => {
        expect(screen.getByText('ครอบครัว')).toBeInTheDocument();
        expect(screen.getByLabelText('สถานะสมรส')).toBeInTheDocument();
        expect(screen.getByDisplayValue('กรุณากำหนดสถานะ')).toBeInTheDocument();
    });

    it('should call onBack and onNext when footer buttons are clicked', () => {
        fireEvent.click(screen.getByTestId('back-button'));
        expect(mockOnBack).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId('next-button'));
        expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('should open and close the info modal', () => {
        // Modal should not be visible initially
        expect(
            screen.queryByText(/ระบบได้รวมสิทธิลดหย่อนส่วนบุคคล/)
        ).not.toBeInTheDocument();

        // Click the 'i' button
        fireEvent.click(screen.getByLabelText('ข้อมูลเพิ่มเติม'));

        // Modal should now be visible
        expect(
            screen.getByText(/ระบบได้รวมสิทธิลดหย่อนส่วนบุคคล/)
        ).toBeVisible();

        // Click the 'Close' button
        fireEvent.click(screen.getByRole('button', { name: 'ปิด' }));

        // Modal should be gone
        expect(
            screen.queryByText(/ระบบได้รวมสิทธิลดหย่อนส่วนบุคคล/)
        ).not.toBeInTheDocument();
    });

    it('should call setValues with cleared fields when changing status to "placeholder"', () => {
        // First, set a value
        rerender({ values: { maritalStatus: 'single' } });

        // Then, change back to the placeholder
        const select = screen.getByLabelText('สถานะสมรส');
        fireEvent.change(select, { target: { value: '' } });

        expect(mockSetValues).toHaveBeenCalledWith({
            maritalStatus: undefined,
            hasChildren: undefined,
            childCountPre2561: '',
            childCountFrom2561: '',
            disabledChildrenCount: '',
            parentSpouse: undefined,
            disabledNoIncome: { child: false },
        });
    });

    it('should show child inputs when "hasChildren" is "yes"', () => {
        rerender({ values: { maritalStatus: 'divorced' } });

        const radioYes = screen.getByRole('radio', { name: 'มี' });
        fireEvent.click(radioYes);

        expect(mockSetValues).toHaveBeenCalledWith({ hasChildren: 'yes' });

        // Simulate prop update
        rerender({ values: { maritalStatus: 'divorced', hasChildren: 'yes' } });

        expect(
            screen.getByLabelText('จำนวนบุตรที่เกิดก่อนปี 2561')
        ).toBeInTheDocument();
        expect(
            screen.getByLabelText('จำนวนบุตรที่เกิดตั้งแต่ปี 2561 เป็นต้นไป')
        ).toBeInTheDocument();
    });

    it('should clear child fields when "hasChildren" is set to "no"', () => {
        rerender({
            values: {
                maritalStatus: 'divorced',
                hasChildren: 'yes',
                childCountPre2561: '1',
            },
        });

        const radioNo = screen.getByRole('radio', { name: 'ไม่มี' });
        fireEvent.click(radioNo);

        // Check that setHasChildren('no') clears the correct fields
        expect(mockSetValues).toHaveBeenCalledWith({
            hasChildren: 'no',
            childCountPre2561: '',
            childCountFrom2561: '',
            disabledChildrenCount: '',
            disabledNoIncome: { child: false },
        });

        // Simulate prop update
        rerender({ values: { hasChildren: 'no' } });

        expect(
            screen.queryByLabelText('จำนวนบุตรที่เกิดก่อนปี 2561')
        ).not.toBeInTheDocument();
    });

    it('should only allow numeric input in CountInput', () => {
        rerender({ values: { maritalStatus: 'divorced', hasChildren: 'yes' } });

        const childInput = screen.getByLabelText('จำนวนบุตรที่เกิดก่อนปี 2561');
        fireEvent.change(childInput, { target: { value: '123' } });
        expect(mockSetValues).toHaveBeenCalledWith({ childCountPre2561: '123' });

        // Test non-numeric filtering
        fireEvent.change(childInput, { target: { value: 'abc456def' } });
        expect(mockSetValues).toHaveBeenCalledWith({ childCountPre2561: '456' });
    });

    it('should show disabled child count input when "disabled child" is checked', () => {
        rerender({ values: { maritalStatus: 'divorced', hasChildren: 'yes' } });

        // "Disabled child" checkbox should be present
        const disabledChildCheckbox = screen.getByRole('checkbox', { name: 'บุตร' });
        expect(disabledChildCheckbox).toBeInTheDocument();

        // Count input should not be visible yet
        expect(
            screen.queryByLabelText('จำนวนบุตรที่ต้องการใช้สิทธิ์ลดหย่อนผู้พิการ')
        ).not.toBeInTheDocument();

        // Click the "disabled child" checkbox
        fireEvent.click(disabledChildCheckbox);
        expect(mockSetValues).toHaveBeenCalledWith({
            disabledNoIncome: { child: true },
        });

        // Simulate prop update
        rerender({ values: { disabledNoIncome: { child: true } } });

        // Now the count input should be visible
        expect(
            screen.getByLabelText('จำนวนบุตรที่ต้องการใช้สิทธิ์ลดหย่อนผู้พิการ')
        ).toBeInTheDocument();
    });
});