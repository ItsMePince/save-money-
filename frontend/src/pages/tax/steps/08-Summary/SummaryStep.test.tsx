import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SummaryStep from './SummaryStep';

// Mock the props that the component expects
const mockOnBack = vi.fn();

// Create a base summary object for testing
const mockSummary = {
    incomePerYear: 1000000,
    expense50pct: 50000,
    totalDeductions: 120000,
    taxableIncome: 730000,
    taxWithheld: 10000,
    taxByBracket: 94500,
    netTax: 84500, // This will be overridden in specific tests
};

describe('SummaryStep Component', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    /**
     * Test 1: Renders correctly when there is tax to pay (netTax is positive)
     */
    it('should render all summary data correctly when tax is due', () => {
        const props = {
            summary: { ...mockSummary, netTax: 5000 }, // Tax due
            onBack: mockOnBack,
        };

        render(<SummaryStep {...props} />);

        // Check title
        expect(screen.getByText('สรุป')).toBeInTheDocument();

        // Check all labels
        expect(screen.getByText('รายได้รวมต่อปี')).toBeInTheDocument();
        expect(screen.getByText('หักค่าใช้จ่าย (50%)')).toBeInTheDocument();
        expect(screen.getByText('รวมลดหย่อนทั้งหมด')).toBeInTheDocument();
        expect(screen.getByText('รายได้สุทธิ เพื่อคำนวณภาษี')).toBeInTheDocument();
        expect(screen.getByText('ภาษีที่ถูกหัก ณ ที่จ่าย')).toBeInTheDocument();
        expect(screen.getByText('ภาษีที่ต้องชำระตามขั้นบันได')).toBeInTheDocument();
        expect(screen.getByText('ภาษีสุทธิที่ต้องชำระ')).toBeInTheDocument();

        // Check all FORMATTED values
        expect(screen.getByText('1,000,000')).toBeInTheDocument();
        expect(screen.getByText('50,000')).toBeInTheDocument();
        expect(screen.getByText('120,000')).toBeInTheDocument();
        expect(screen.getByText('730,000')).toBeInTheDocument();
        expect(screen.getByText('10,000')).toBeInTheDocument();
        expect(screen.getByText('94,500')).toBeInTheDocument();

        // Check final net tax (value and class)
        const netTaxValue = screen.getByText('5,000');
        expect(netTaxValue).toBeInTheDocument();
        expect(netTaxValue).toHaveClass('red');
        expect(netTaxValue).not.toHaveClass('green');
    });

    /**
     * Test 2: Renders correctly when there is a refund (netTax is negative)
     */
    it('should render correctly with "green" class when a refund is due', () => {
        const props = {
            summary: { ...mockSummary, netTax: -2000 }, // Refund due
            onBack: mockOnBack,
        };

        render(<SummaryStep {...props} />);

        // Check final net tax (value should be absolute)
        const netTaxValue = screen.getByText('2,000');
        expect(netTaxValue).toBeInTheDocument();

        // Check class is green for refund
        expect(netTaxValue).toHaveClass('green');
        expect(netTaxValue).not.toHaveClass('red');
    });

    /**
     * Test 3: Checks navigation (Back button only, no Next button)
     */
    it('should call onBack and have no next button', () => {
        const props = {
            summary: mockSummary,
            onBack: mockOnBack,
        };

        render(<SummaryStep {...props} />);

        // Find and click the 'Back' button (using text from previous error)
        const backButton = screen.getByText('ย้อนกลับ');
        expect(backButton).toBeInTheDocument();
        fireEvent.click(backButton);

        // Check that onBack was called
        expect(mockOnBack).toHaveBeenCalledTimes(1);

        // Check that 'Next' button is NOT rendered
        expect(screen.queryByText('ถัดไป')).not.toBeInTheDocument();
    });
});