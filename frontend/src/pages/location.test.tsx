// src/pages/location.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Location from './Location';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock geolocation
const mockGeolocation = {
    getCurrentPosition: vi.fn(),
};

// Helper function to render component
const renderComponent = () => {
    render(
        <MemoryRouter>
            <Location />
        </MemoryRouter>
    );
};

describe('Location Page', () => {
    let mockMap: any;
    let mockMarker: any;
    let appendChildSpy: any;

    beforeEach(() => {
        global.fetch = vi.fn();
        mockNavigate.mockClear();
        sessionStorage.clear();

        // Setup geolocation mock
        Object.defineProperty(global.navigator, 'geolocation', {
            value: mockGeolocation,
            writable: true,
            configurable: true,
        });
        mockGeolocation.getCurrentPosition.mockClear();

        // Mock document.head.appendChild for Longdo Map script loading
        appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
            if (node.tagName === 'SCRIPT' && node.src.includes('api.longdo.com')) {
                mockMap = {
                    location: vi.fn(),
                    Overlays: { add: vi.fn(), remove: vi.fn() },
                };
                mockMarker = vi.fn();
                (window as any).longdo = {
                    Map: vi.fn(() => mockMap),
                    Marker: vi.fn(() => mockMarker),
                };
                // Trigger onload callback
                setTimeout(() => {
                    if (node.onload) node.onload();
                }, 0);
            }
            return node;
        });

        mockMap?.location.mockClear();
        mockMap?.Overlays.add.mockClear();
        mockMap?.Overlays.remove.mockClear();
    });

    afterEach(() => {
        appendChildSpy.mockRestore();
        vi.restoreAllMocks();
        delete (window as any).longdo;
    });

    // Helper functions
    const mockReverseGeocode = (lat: number, lon: number) => ({
        display_name: `ที่อยู่จำลอง ${lat} ${lon}`,
    });

    const simulateInitLoad = (type: 'success' | 'fail') => {
        (global.fetch as any).mockImplementation((url: string) => {
            if (url.includes('reverse')) {
                const lat = type === 'success' ? 10 : 13.736717;
                const lon = type === 'success' ? 20 : 100.523186;
                return Promise.resolve({
                    ok: true,
                    json: async () => mockReverseGeocode(lat, lon),
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        mockGeolocation.getCurrentPosition.mockImplementation((successCb: any, errorCb: any) => {
            if (type === 'success') {
                successCb({ coords: { latitude: 10, longitude: 20 } });
            } else {
                errorCb();
            }
        });
    };

    it('ควรโหลดแผนที่และตำแหน่งปัจจุบัน (Geolocation) สำเร็จ', async () => {
        simulateInitLoad('success');
        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText('กำลังโหลดแผนที่…')).not.toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText('ที่อยู่จำลอง 10 20')).toBeInTheDocument();
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('reverse?format=jsonv2&lat=10&lon=20'),
            expect.any(Object)
        );
    });

    it('ควรใช้ตำแหน่ง fallback เมื่อ Geolocation ล้มเหลว', async () => {
        simulateInitLoad('fail');
        renderComponent();

        await waitFor(() => {
            expect(screen.queryByText('กำลังโหลดแผนที่…')).not.toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByText('ที่อยู่จำลอง 13.736717 100.523186')).toBeInTheDocument();
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });

    it('ควรแสดง Suggested section', async () => {
        simulateInitLoad('success');
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Suggested')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('ควรแสดง search input', async () => {
        simulateInitLoad('success');
        renderComponent();

        await waitFor(() => {
            expect(screen.getByPlaceholderText('ที่อยู่ปัจจุบัน')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('ควรแสดงปุ่มยืนยันที่อยู่', async () => {
        simulateInitLoad('success');
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('ยืนยันที่อยู่')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('ไม่ควร navigate เมื่อกดยืนยันโดยที่ยังไม่มีสถานที่ที่เลือก', async () => {
        mockGeolocation.getCurrentPosition.mockImplementation(() => {
            // Simulate timeout - never call callback
        });

        (global.fetch as any).mockImplementation(() => {
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('ยืนยันที่อยู่')).toBeInTheDocument();
        }, { timeout: 3000 });

        const confirmButton = screen.getByText('ยืนยันที่อยู่');

        await act(async () => {
            fireEvent.click(confirmButton);
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(sessionStorage.getItem('selectedPlaceName')).toBeNull();
    });
});