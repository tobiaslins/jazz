import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContext } from 'svelte';
import { Account } from 'jazz-tools';
import { getJazzContext, JAZZ_CTX } from '../jazz.svelte.js';
import { render, screen } from '@testing-library/svelte';
import ProviderTestComponent from './components/ProviderTestComponent.svelte'
import { createJazzTestAccount, getJazzContextShape } from 'jazz-tools/testing';
import { JazzBrowserContextManager } from 'jazz-browser';

vi.mock('svelte', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('svelte')>(),
    getContext: vi.fn(),
    untrack: vi.fn((fn) => fn())
  };
});

const account = await createJazzTestAccount();

JazzBrowserContextManager.prototype.getCurrentValue = vi.fn(() => getJazzContextShape(account));
const createContexSpy = vi.spyOn(JazzBrowserContextManager.prototype, 'createContext');

// Mock jazz-browser as the browser context is not always available
vi.mock('jazz-browser', () => ({
  JazzBrowserContextManager: class {
    async createContext() {}
    subscribe(fn: () => void) {
      fn();

      return () => {}
    }
    getCurrentValue() {
      return undefined;
    }
  },
}));

// Mocks for coValue observables
const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn((Schema, id, me, depth, callback) => {
  callback();
  return {
    unsubscribe: mockUnsubscribe
  };
});

// Mock of a coValue observable
const mockObservable = {
  subscribe: mockSubscribe,
  getCurrentValue: vi.fn(() => ({ value: 'test value' }))
};

// Mock jazz-tools as we don't want to actually subscribe to any coValues
vi.mock('jazz-tools', async (importOriginal) => ({
  ...await importOriginal<typeof import('jazz-tools')>(),
  createCoValueObservable: vi.fn(() => mockObservable)
}));

describe('jazz.svelte', () => {
  let mockAccount: Account;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAccount = {
      id: 'test-account-id',
      name: 'Test Account'
    } as unknown as Account;

    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    mockObservable.getCurrentValue.mockClear();
  });

  describe('getJazzContext', () => {
    it('should return the jazz context from svelte context', () => {
      const mockContext = { current: { me: mockAccount } };
      (getContext as jest.Mock).mockReturnValue(mockContext);

      const result = getJazzContext();
      expect(result).toBe(mockContext);
      expect(getContext).toHaveBeenCalledWith(JAZZ_CTX);
    });

    it('should throw if no context is set', () => {
      (getContext as jest.Mock).mockReturnValue(undefined);

      expect(() => getJazzContext()).toThrow('useJazzContext must be used within a JazzProvider');
    });
  });

  describe('Provider Component', () => {
    it('should provide jazz context to children', async () => {
      render(ProviderTestComponent, {
        props: {
          guestMode: false
        }
      });

      expect( await screen.findByTestId('provider-auth-test')).toHaveTextContent('Hello')
    });

    it('should handle guest mode correctly', async () => {
      render(ProviderTestComponent, {
        props: {
          guestMode: true
        }
      });

      expect(createContexSpy).toHaveBeenCalledWith(expect.objectContaining({
        guestMode: true
      }));
    });
  });
});
