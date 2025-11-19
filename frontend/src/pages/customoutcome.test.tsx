// src/pages/__tests__/CustomOutcome.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CategoryCustom from './customoutcome';

// Mock dependencies
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// ไม่ต้อง mock BottomNav ถ้ามันไม่สำคัญ
vi.mock('../buttomnav', () => ({
    default: () => null,
}));

// Helper function to render
const renderComponent = () => {
    return render(
        <BrowserRouter>
            <CategoryCustom />
        </BrowserRouter>
    );
};

describe('CategoryCustom Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render confirm button', () => {
            renderComponent();
            const confirmButton = screen.getByLabelText('ยืนยัน');
            expect(confirmButton).toBeInTheDocument();
        });
    });

    describe('Icon Selection', () => {
        it('should show question mark when no icon is selected', () => {
            renderComponent();
            expect(screen.getByText('?')).toBeInTheDocument();
        });

        it('should select an icon when clicked', () => {
            renderComponent();
            const iconButtons = screen.getAllByRole('button');
            const coffeeButton = iconButtons.find(btn => btn.getAttribute('title') === 'กาแฟ');

            if (coffeeButton) {
                fireEvent.click(coffeeButton);
                expect(coffeeButton).toHaveClass('active');
            }
        });

        it('should change selection when clicking different icon', () => {
            renderComponent();
            const iconButtons = screen.getAllByRole('button');

            const coffeeButton = iconButtons.find(btn => btn.getAttribute('title') === 'กาแฟ');
            const pizzaButton = iconButtons.find(btn => btn.getAttribute('title') === 'พิซซ่า');

            if (coffeeButton && pizzaButton) {
                fireEvent.click(coffeeButton);
                expect(coffeeButton).toHaveClass('active');

                fireEvent.click(pizzaButton);
                expect(pizzaButton).toHaveClass('active');
                expect(coffeeButton).not.toHaveClass('active');
            }
        });
    });

    describe('Form Submission', () => {
        it('should show alert when submitting without name', () => {
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            renderComponent();

            const iconButtons = screen.getAllByRole('button');
            const coffeeButton = iconButtons.find(btn => btn.getAttribute('title') === 'กาแฟ');
            if (coffeeButton) fireEvent.click(coffeeButton);

            const confirmButton = screen.getByLabelText('ยืนยัน');
            fireEvent.click(confirmButton);

            expect(alertSpy).toHaveBeenCalledWith('กรุณาเลือกไอคอนและตั้งชื่อ');
            alertSpy.mockRestore();
        });
    });
});