import { describe, expect, it } from "vitest";
import "../src/device/insteon-device-plate";
import type { InsteonDevicePlate } from "../src/device/insteon-device-plate";

export const renderPlate = async (
  cat: number,
  subcat: number,
  names: Record<number, string> = {},
): Promise<InsteonDevicePlate> => {
  const el = document.createElement("insteon-device-plate") as InsteonDevicePlate;
  el.cat = cat;
  el.subcat = subcat;
  el.names = names;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

export const root = (el: InsteonDevicePlate) => el.shadowRoot!;

export const click = (target: Element) =>
  target.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

describe("insteon-device-plate scaffold", () => {
  it("registers the custom element", () => {
    expect(customElements.get("insteon-device-plate")).toBeDefined();
  });

  it("renders nothing for an unmapped device", async () => {
    const el = await renderPlate(0x03, 0x15);
    expect(root(el).querySelector("svg")).toBeNull();
  });

  it("fires the selected group on click and on enter", async () => {
    const el = await renderPlate(0x01, 0x24);
    const seen: number[] = [];
    el.addEventListener("insteon-button-selected", (ev) => {
      seen.push((ev as CustomEvent<{ group: number }>).detail.group);
    });
    const key = root(el).querySelector(".key")!;
    click(key);
    key.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(seen).toEqual([1, 1]);
  });

  it("labels keys from the names map", async () => {
    const el = await renderPlate(0x01, 0x24, { 1: "Paddle" });
    expect(root(el).querySelector(".key")!.getAttribute("aria-label")).toBe("Paddle");
  });

  it("does not ring the only key on a single button device", async () => {
    const el = await renderPlate(0x01, 0x24);
    el.selected = 1;
    await el.updateComplete;
    expect(root(el).querySelector(".key.selected")).toBeNull();
    expect(root(el).querySelector(".key")!.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("switchlinc led bar paddle", () => {
  it("draws a bezel and nine equal leds on the left strip, top half only", async () => {
    const el = await renderPlate(0x01, 0x24);
    const r = root(el);
    expect(r.querySelector(".bezel")).not.toBeNull();
    const leds = [...r.querySelectorAll(".led")];
    expect(leds.length).toBe(9);
    expect(new Set(leds.map((c) => c.getAttribute("cx")))).toEqual(new Set(["4"]));
    expect(new Set(leds.map((c) => c.getAttribute("r")))).toEqual(new Set(["2"]));
    const ys = leds.map((c) => Number(c.getAttribute("cy")));
    expect(ys[0]).toBe(11);
    expect(ys[8]).toBeCloseTo(78.6, 1);
    expect(ys[8] - ys[7]).toBeGreaterThan(ys[2] - ys[1]);
  });

  it("puts the set button under the paddle inside the bezel, black on the 2474dwh", async () => {
    const white = await renderPlate(0x01, 0x20);
    expect(white.shadowRoot!.querySelector(".tab.dark")).toBeNull();
    const dwh = await renderPlate(0x01, 0x24);
    const tab = dwh.shadowRoot!.querySelector(".tab")!;
    expect(tab.classList.contains("dark")).toBe(true);
    expect(Number(tab.getAttribute("y"))).toBe(152);
    expect(Number(tab.getAttribute("width"))).toBe(12);
  });

  it("uses the same drawing for the 2476s relay", async () => {
    const el = await renderPlate(0x02, 0x0a);
    expect(root(el).querySelectorAll(".led").length).toBe(9);
  });
});

describe("switchlinc two indicator paddle", () => {
  it("draws the on led at the top and the off led at mid paddle, same size", async () => {
    const el = await renderPlate(0x02, 0x2a);
    const leds = [...root(el).querySelectorAll(".led")];
    expect(leds.length).toBe(2);
    expect(leds.map((c) => c.getAttribute("r"))).toEqual(["2", "2"]);
    expect(leds.map((c) => c.getAttribute("cy"))).toEqual(["10", "78"]);
    expect(leds.map((c) => c.getAttribute("cx"))).toEqual(["4", "4"]);
    expect(root(el).querySelector(".bezel")).not.toBeNull();
  });
});

describe("i3 paddle", () => {
  it("fills the insert with no bezel, one small led and a slot in the lip", async () => {
    const el = await renderPlate(0x01, 0x57);
    const r = root(el);
    expect(r.querySelector(".bezel")).toBeNull();
    const face = r.querySelector(".key .face")!;
    expect(face.getAttribute("width")).toBe("79");
    expect(face.getAttribute("height")).toBe("159");
    const leds = r.querySelectorAll(".led");
    expect(leds.length).toBe(1);
    expect(leds[0].getAttribute("r")).toBe("1.2");
    expect(leds[0].getAttribute("cx")).toBe("8");
    const slot = r.querySelector(".slot.lip")!;
    expect(slot.getAttribute("width")).toBe("27");
    expect(Number(slot.getAttribute("y"))).toBeCloseTo(154.5, 1);
  });
});
