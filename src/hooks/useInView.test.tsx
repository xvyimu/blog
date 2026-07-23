import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import React, { useRef } from 'react';
import { useInView, type UseInViewOptions } from './useInView';

class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit;
  static instances: MockIntersectionObserver[] = [];
  static elements: Element[] = [];

  constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = cb;
    this.options = options ?? {};
    MockIntersectionObserver.instances.push(this);
  }
  observe(target: Element) {
    MockIntersectionObserver.elements.push(target);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = '';
  thresholds = [];

  static fireIntersection(isIntersecting: boolean, target?: Element) {
    const entry = {
      isIntersecting,
      target: target ?? MockIntersectionObserver.elements[0],
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      boundingClientRect: {} as DOMRectReadOnly,
      time: 0,
    } as unknown as IntersectionObserverEntry;
    for (const observer of MockIntersectionObserver.instances) {
      observer.callback([entry], observer as unknown as IntersectionObserver);
    }
  }

  static reset() {
    MockIntersectionObserver.instances = [];
    MockIntersectionObserver.elements = [];
  }
}

globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Test component that renders a real DOM element and uses the hook
function TestComponent({ options }: { options?: UseInViewOptions }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, options);
  return (
    <div ref={ref} data-testid="target">
      {inView ? 'in' : 'out'}
    </div>
  );
}

describe('useInView', () => {
  beforeEach(() => {
    MockIntersectionObserver.reset();
  });

  it('returns false initially before intersection fires', () => {
    const { getByText } = render(<TestComponent />);
    expect(getByText('out')).toBeTruthy();
  });

  it('does not create an observer when enabled is false', () => {
    const { getByText } = render(<TestComponent options={{ enabled: false }} />);
    expect(getByText('out')).toBeTruthy();
    expect(MockIntersectionObserver.instances).toHaveLength(0);
  });

  it('returns true after intersection fires (once: true default)', async () => {
    const { getByText } = render(<TestComponent />);
    act(() => {
      MockIntersectionObserver.fireIntersection(true);
    });
    await vi.waitFor(() => {
      expect(getByText('in')).toBeTruthy();
    });
  });

  it('does not revert to false when once is true', async () => {
    const { getByText } = render(<TestComponent options={{ once: true }} />);
    act(() => {
      MockIntersectionObserver.fireIntersection(true);
    });
    await vi.waitFor(() => {
      expect(getByText('in')).toBeTruthy();
    });

    // Element leaves viewport — should NOT revert
    act(() => {
      MockIntersectionObserver.fireIntersection(false);
    });
    expect(getByText('in')).toBeTruthy();
  });

  it('reverts to false when once is false and element leaves', async () => {
    const { getByText } = render(<TestComponent options={{ once: false }} />);
    act(() => {
      MockIntersectionObserver.fireIntersection(true);
    });
    await vi.waitFor(() => {
      expect(getByText('in')).toBeTruthy();
    });

    act(() => {
      MockIntersectionObserver.fireIntersection(false);
    });
    await vi.waitFor(() => {
      expect(getByText('out')).toBeTruthy();
    });
  });

  it('passes threshold and rootMargin to observer', () => {
    render(<TestComponent options={{ threshold: 0.5, rootMargin: '100px' }} />);
    expect(MockIntersectionObserver.instances).toHaveLength(1);
    const observer = MockIntersectionObserver.instances[0];
    expect(observer.options.threshold).toBe(0.5);
    expect(observer.options.rootMargin).toBe('100px');
  });
});
