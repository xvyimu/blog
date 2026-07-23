import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePrefersFinePointer } from './usePrefersFinePointer';

function setFinePointer(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(hover: hover) and (pointer: fine)' ? matches : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('usePrefersFinePointer', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns true after mount when the primary pointer is fine', async () => {
    setFinePointer(true);
    const { result } = renderHook(() => usePrefersFinePointer());
    await vi.waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns false after mount on coarse / no-hover pointers', async () => {
    setFinePointer(false);
    const { result } = renderHook(() => usePrefersFinePointer());
    await vi.waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('subscribes to media query changes', async () => {
    const listeners: ((e: { matches: boolean }) => void)[] = [];
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => {
          listeners.push(fn);
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePrefersFinePointer());
    await vi.waitFor(() => {
      expect(result.current).toBe(false);
    });

    expect(listeners).toHaveLength(1);
    act(() => {
      listeners[0]({ matches: true });
    });
    await vi.waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
