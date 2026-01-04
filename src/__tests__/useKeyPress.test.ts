import { renderHook, act } from '@testing-library/react';
import useKeyPress from '@/hooks/useKeyPress';

describe('useKeyPress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call callback when a single character key is pressed', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        });

        expect(callback).toHaveBeenCalledWith('a');
    });

    it('should not call callback for multi-character keys like Shift', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
        });

        expect(callback).not.toHaveBeenCalled();
    });

    it('should not call callback for arrow keys', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        });

        expect(callback).not.toHaveBeenCalled();
    });

    it('should handle space character', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        });

        expect(callback).toHaveBeenCalledWith(' ');
    });

    it('should handle apostrophe and prevent default (Firefox quick find)', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        const event = new KeyboardEvent('keydown', { key: "'" });
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        act(() => {
            window.dispatchEvent(event);
        });

        expect(callback).toHaveBeenCalledWith("'");
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should return the currently pressed key', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => useKeyPress({ callback }));

        expect(result.current).toBeNull();

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
        });

        expect(result.current).toBe('h');
    });

    it('should reset key on keyup', () => {
        const callback = jest.fn();
        const { result } = renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
        });

        expect(result.current).toBe('x');

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', {}));
        });

        expect(result.current).toBeNull();
    });

    it('should not call callback twice for same key held down', async () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        // First keydown
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        });

        expect(callback).toHaveBeenCalledTimes(1);

        // Same key again without keyup - should be ignored
        // Note: Due to React state batching, we need to verify the hook
        // tracks the key properly. The hook prevents double-firing by
        // checking keyPressed !== key, so after the first press,
        // another 'a' won't trigger callback until keyup resets it.
        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
        });

        // Should still be 1 because same key is still held
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should call callback for different keys pressed sequentially', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', {}));
        });

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
        });

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, 'a');
        expect(callback).toHaveBeenNthCalledWith(2, 'b');
    });

    it('should handle numbers', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }));
        });

        expect(callback).toHaveBeenCalledWith('5');
    });

    it('should handle special characters', () => {
        const callback = jest.fn();
        renderHook(() => useKeyPress({ callback }));

        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];

        specialChars.forEach((char, index) => {
            act(() => {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
                window.dispatchEvent(new KeyboardEvent('keyup', {}));
            });
        });

        expect(callback).toHaveBeenCalledTimes(specialChars.length);
    });

    it('should clean up event listeners on unmount', () => {
        const callback = jest.fn();
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useKeyPress({ callback }));
        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

        removeEventListenerSpy.mockRestore();
    });
});
