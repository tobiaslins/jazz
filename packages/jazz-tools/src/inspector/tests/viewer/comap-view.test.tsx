// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { createJazzTestAccount, setupJazzTestSync } from "jazz-tools/testing";
import { co, z } from "jazz-tools";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { CoMapView } from "../../viewer/co-map-view";
import { setup } from "goober";
import React from "react";
import { JsonObject } from "cojson";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("CoMapView", async () => {
  const account = await setupJazzTestSync();

  beforeAll(() => {
    setup(React.createElement);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Basic Rendering", () => {
    it("should render GridView with data", async () => {
      const value = co
        .map({
          pet: z.string(),
          age: z.number(),
        })
        .create({ pet: "dog", age: 10 }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      expect(screen.getByText("pet")).toBeDefined();
      expect(screen.getByText("age")).toBeDefined();
      expect(screen.getByText("dog")).toBeDefined();
      expect(screen.getByText("10")).toBeDefined();
    });

    it("should render restore button", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      expect(restoreButton).toBeDefined();
    });
  });

  describe("Modal Interactions", () => {
    it("should open restore modal when button is clicked", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      expect(screen.getByText("Restore to Snapshot")).toBeDefined();
      expect(screen.getByText("Select Timestamp")).toBeDefined();
      expect(screen.getByText("State at that time:")).toBeDefined();
    });

    it("should close modal when clicking overlay", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      expect(screen.getByText("Select Timestamp")).toBeDefined();

      const overlay = screen.getByText("Restore to Snapshot").parentElement
        ?.parentElement?.parentElement;
      fireEvent.click(overlay!);

      await waitFor(() => {
        expect(screen.queryByText("Select Timestamp")).toBeNull();
      });
    });

    it("should close modal when clicking close button", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const closeButton = screen.getByText("×");
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Select Timestamp")).toBeNull();
      });
    });

    it("should close modal when clicking Cancel button", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Select Timestamp")).toBeNull();
      });
    });
  });

  describe("Timestamp Selection", () => {
    it("should display timestamps and allow selection", async () => {
      const value = co
        .map({
          pet: z.string(),
        })
        .create({ pet: "dog" }, account);

      await sleep(2);
      value.$jazz.set("pet", "cat");
      await sleep(2);
      value.$jazz.set("pet", "bird");

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const slider = screen.getByRole("slider") as HTMLInputElement;
      expect(slider).toBeDefined();
      expect(slider.max).toBe("2");

      fireEvent.change(slider, { target: { value: "0" } });
      expect(slider.value).toBe("0");

      fireEvent.change(slider, { target: { value: "1" } });
      expect(slider.value).toBe("1");
    });

    it("should show timestamp in ISO format", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const timestampDisplay = screen.getAllByText(/\d{4}-\d{2}-\d{2}T/)[0];
      expect(timestampDisplay).toBeDefined();
    });

    it("should update preview when timestamp changes", async () => {
      const value = co
        .map({
          pet: z.string(),
        })
        .create({ pet: "dog" }, account);

      // wait to have different timestamps in transactions
      await sleep(2);
      value.$jazz.set("pet", "cat");
      await sleep(2);
      value.$jazz.set("pet", "bird");

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const slider = screen.getByRole("slider") as HTMLInputElement;
      const preview = screen.getByText(/State at that time:/);
      expect(preview).toBeDefined();

      // Modal starts at the most recent timestamp (last index)
      await waitFor(() => {
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("bird");
      });

      fireEvent.change(slider, { target: { value: 0 } });
      await waitFor(() => {
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("dog");
      });
    });
  });

  describe("Remove Unknown Properties Checkbox", () => {
    it("should render checkbox with correct label", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      expect(
        screen.getByText(
          "Remove unknown properties (properties that don't exist in the selected snapshot)",
        ),
      ).toBeDefined();
    });

    it("should toggle checkbox state", async () => {
      const value = co
        .map({
          foo: z.string(),
        })
        .create({ foo: "bar" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });
  });

  describe("Restore Functionality", () => {
    it("should show preview of state to restore", async () => {
      const value = co
        .map({
          pet: z.string(),
          age: z.number(),
        })
        .create({ pet: "dog", age: 10 }, account);

      await sleep(2);
      value.$jazz.set("pet", "cat");
      value.$jazz.set("age", 20);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const slider = screen.getByRole("slider") as HTMLInputElement;
      fireEvent.change(slider, { target: { value: 0 } });

      await waitFor(() => {
        const preview = screen.getByText(/State at that time:/);
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("dog");
        expect(previewPre?.textContent).toContain("10");
      });
    });

    it("should close modal when restore is clicked", async () => {
      const value = co
        .map({
          pet: z.string(),
          age: z.number(),
        })
        .create({ pet: "dog", age: 10 }, account);

      await sleep(2);
      value.$jazz.set("pet", "cat");

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      expect(screen.getByText("Select Timestamp")).toBeDefined();

      const slider = screen.getByRole("slider") as HTMLInputElement;
      fireEvent.change(slider, { target: { value: 0 } });

      const restoreActionButton = screen.getByText("Restore");
      fireEvent.click(restoreActionButton);

      await waitFor(() => {
        expect(screen.queryByText("Select Timestamp")).toBeNull();
      });
    });

    it("should allow selecting timestamp and checking remove properties option", async () => {
      const value = co
        .map({
          pet: z.string(),
          age: z.number().optional(),
        })
        .create({ pet: "dog" }, account);

      await sleep(2);
      value.$jazz.set("age", 10);
      await sleep(2);
      value.$jazz.set("pet", "cat");

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);

      // Change to earlier timestamp
      const slider = screen.getByRole("slider") as HTMLInputElement;
      fireEvent.change(slider, { target: { value: "0" } });

      await waitFor(() => {
        const preview = screen.getByText(/State at that time:/);
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("dog");
      });

      const restoreActionButton = screen.getByText(
        "Restore",
      ) as HTMLButtonElement;
      expect(restoreActionButton.disabled).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty CoMap", async () => {
      const value = co.map({}).create({}, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      expect(screen.getByTitle("Restore to Snapshot")).toBeDefined();
    });

    it("should handle complex data types", async () => {
      const value = co
        .map({
          obj: z.object({
            name: z.string(),
            count: z.number(),
          }),
          date: z.date(),
          bool: z.boolean(),
        })
        .create(
          {
            obj: { name: "test", count: 42 },
            date: new Date("2024-01-01"),
            bool: true,
          },
          account,
        );

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      expect(screen.getByText("obj")).toBeDefined();
      expect(screen.getByText("date")).toBeDefined();
      expect(screen.getByText("bool")).toBeDefined();
    });

    it("should handle restoring to same state (no changes)", async () => {
      const value = co
        .map({
          pet: z.string(),
        })
        .create({ pet: "dog" }, account);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const slider = screen.getByRole("slider") as HTMLInputElement;
      fireEvent.change(slider, { target: { value: 0 } });

      const restoreActionButton = screen.getByText("Restore");
      fireEvent.click(restoreActionButton);

      await waitFor(() => {
        expect(screen.queryByText("Select Timestamp")).toBeNull();
      });

      expect(value.pet).toBe("dog");
    });

    it("should handle multiple property changes at different times", async () => {
      const value = co
        .map({
          a: z.string(),
          b: z.string(),
          c: z.string(),
        })
        .create({ a: "1", b: "2", c: "3" }, account);

      await sleep(2);
      value.$jazz.set("a", "4");
      await sleep(2);
      value.$jazz.set("b", "5");
      await sleep(2);
      value.$jazz.set("c", "6");

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const slider = screen.getByRole("slider") as HTMLInputElement;

      // Verify we can navigate to initial state
      fireEvent.change(slider, { target: { value: 0 } });
      await waitFor(() => {
        const preview = screen.getByText(/State at that time:/);
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("1");
        expect(previewPre?.textContent).toContain("2");
        expect(previewPre?.textContent).toContain("3");
      });

      // Verify we can navigate to latest state
      fireEvent.change(slider, { target: { value: slider.max } });
      await waitFor(() => {
        const preview = screen.getByText(/State at that time:/);
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("4");
        expect(previewPre?.textContent).toContain("5");
        expect(previewPre?.textContent).toContain("6");
      });
    });
  });

  describe("Preview Display", () => {
    it("should show JSON preview of selected state", async () => {
      const value = co
        .map({
          pet: z.string(),
          age: z.number(),
        })
        .create({ pet: "dog", age: 10 }, account);

      // wait to have different timestamps in transactions
      await sleep(2);

      value.$jazz.set("pet", "cat");

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      // Modal starts at most recent timestamp
      const preview = screen.getByText(/State at that time:/);
      await waitFor(() => {
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain("cat");
      });

      const slider = screen.getByRole("slider") as HTMLInputElement;
      fireEvent.change(slider, { target: { value: "0" } });

      await waitFor(
        () => {
          const previewPre = preview.parentElement?.querySelector("pre");
          expect(previewPre?.textContent).toContain("dog");
        },
        {
          timeout: 1000,
        },
      );
    });

    it("should update preview when slider moves", async () => {
      const value = co
        .map({
          counter: z.number(),
        })
        .create({ counter: 1 }, account);

      // wait to have different timestamps in transactions
      await sleep(2);
      value.$jazz.set("counter", 2);
      await sleep(2);
      value.$jazz.set("counter", 3);
      await sleep(2);
      value.$jazz.set("counter", 4);

      const data = value.$jazz.raw.toJSON() as JsonObject;

      render(
        <CoMapView
          coValue={value.$jazz.raw}
          data={data}
          node={account.$jazz.localNode}
          onNavigate={() => {}}
        />,
      );

      const restoreButton = screen.getByTitle("Restore to Snapshot");
      fireEvent.click(restoreButton);

      const slider = screen.getByRole("slider") as HTMLInputElement;
      const preview = screen.getByText(/State at that time:/);

      // Modal starts at most recent timestamp (counter: 4)
      await waitFor(() => {
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain('"counter": 4');
      });

      fireEvent.change(slider, { target: { value: "0" } });
      await waitFor(() => {
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain('"counter": 1');
      });

      fireEvent.change(slider, { target: { value: "2" } });
      await waitFor(() => {
        const previewPre = preview.parentElement?.querySelector("pre");
        expect(previewPre?.textContent).toContain('"counter": 3');
      });
    });
  });
});
