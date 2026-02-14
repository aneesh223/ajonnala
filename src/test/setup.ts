import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => { },
  }),
});

// Mock requestAnimationFrame and cancelAnimationFrame globally
// These are needed for audio analysis tests
let rafId = 0;
const rafCallbacks = new Map<number, FrameRequestCallback>();

const mockRAF = vi.fn((callback: FrameRequestCallback) => {
  rafId++;
  rafCallbacks.set(rafId, callback);
  return rafId;
});

const mockCAF = vi.fn((id: number) => {
  rafCallbacks.delete(id);
});

// Set on globalThis to ensure availability in all contexts
globalThis.requestAnimationFrame = mockRAF as any;
globalThis.cancelAnimationFrame = mockCAF as any;
