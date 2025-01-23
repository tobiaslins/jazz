// @vitest-environment happy-dom

import { act, render } from "@testing-library/react";
import {
  BrowserContext,
  BrowserGuestContext,
  createJazzBrowserContext,
} from "jazz-browser";
import { Account } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JazzProvider } from "../provider";

vi.mock("jazz-browser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jazz-browser")>();
  return {
    ...actual,
    createJazzBrowserContext: vi.fn(),
  };
});

describe("JazzProvider", () => {
  const mockContext = {
    me: { id: "test-account" },
    done: vi.fn(),
    toggleNetwork: vi.fn(),
    logOut: vi.fn(),
  } as unknown as BrowserContext<Account>;

  const mockGuestContext = {
    guest: { id: "guest-agent" },
    done: vi.fn(),
    toggleNetwork: vi.fn(),
    logOut: vi.fn(),
  } as unknown as BrowserGuestContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createJazzBrowserContext).mockReset();
  });

  it("should create and cleanup context properly", async () => {
    vi.mocked(createJazzBrowserContext).mockResolvedValue(mockContext);

    const { unmount } = render(
      <JazzProvider peer="wss://test.com">
        <div>Test Content</div>
      </JazzProvider>,
    );

    // Wait for context creation
    await act(async () => {});

    expect(createJazzBrowserContext).toHaveBeenCalledWith(
      expect.objectContaining({
        guest: false,
        peer: "wss://test.com",
      }),
    );

    unmount();
    expect(mockContext.done).toHaveBeenCalled();
  });

  it("should handle guest mode correctly", async () => {
    vi.mocked(createJazzBrowserContext).mockResolvedValue(mockGuestContext);

    render(
      <JazzProvider auth="guest" peer="wss://test.com">
        <div>Test Content</div>
      </JazzProvider>,
    );

    await act(async () => {});

    expect(createJazzBrowserContext).toHaveBeenCalledWith(
      expect.objectContaining({
        guest: true,
        peer: "wss://test.com",
      }),
    );
  });

  it("should handle network toggling", async () => {
    vi.mocked(createJazzBrowserContext).mockResolvedValue(mockContext);

    render(
      <JazzProvider auth="guest" peer="wss://test.com" localOnly={true}>
        <div>Test Content</div>
      </JazzProvider>,
    );

    await act(async () => {});

    expect(createJazzBrowserContext).toHaveBeenCalledWith(
      expect.objectContaining({
        localOnly: true,
      }),
    );
  });

  it("should handle context refresh on props change", async () => {
    vi.mocked(createJazzBrowserContext).mockResolvedValue(mockContext);

    const { rerender } = render(
      <JazzProvider auth="guest" peer="wss://test.com">
        <div>Test Content</div>
      </JazzProvider>,
    );

    await act(async () => {});

    // Change props
    rerender(
      <JazzProvider auth="guest" peer="wss://other.com">
        <div>Test Content</div>
      </JazzProvider>,
    );

    await act(async () => {});

    expect(createJazzBrowserContext).toHaveBeenCalledTimes(2);
    expect(mockContext.done).toHaveBeenCalled();
  });

  it("should not render children until context is ready", async () => {
    vi.mocked(createJazzBrowserContext).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const { container } = render(
      <JazzProvider auth="guest" peer="wss://test.com">
        <div>Test Content</div>
      </JazzProvider>,
    );

    expect(container.textContent).toBe("");
  });

  it("should handle context creation errors", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(createJazzBrowserContext).mockRejectedValue(
      new Error("Test error"),
    );

    render(
      <JazzProvider peer="wss://test.com">
        <div>Test Content</div>
      </JazzProvider>,
    );

    await act(async () => {});

    expect(consoleError).toHaveBeenCalledWith(
      "Error creating Jazz browser context:",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
