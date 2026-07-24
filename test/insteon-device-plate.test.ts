import { describe, expect, it } from "vitest";
import "../src/device/insteon-device-plate";
import { plateLayout } from "../src/device/plate-layout";
import type { InsteonDevicePlate } from "../src/device/insteon-device-plate";

const renderPlate = async (cat: number, subcat: number): Promise<InsteonDevicePlate> => {
  const el = document.createElement("insteon-device-plate") as InsteonDevicePlate;
  el.cat = cat;
  el.subcat = subcat;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
};

describe("plateLayout", () => {
  it("maps the fleet classes", () => {
    expect(plateLayout(0x01, 0x57)).toBe("paddle_i3");
    expect(plateLayout(0x01, 0x59)).toBe("keypad_i3_4");
    expect(plateLayout(0x01, 0x42)).toBe("keypad_6");
    expect(plateLayout(0x01, 0x24)).toBe("paddle_dimmer");
    expect(plateLayout(0x01, 0x35)).toBe("module");
    expect(plateLayout(0x02, 0x3f)).toBe("outlet_dual");
    expect(plateLayout(0x02, 0x2a)).toBe("paddle_relay");
    expect(plateLayout(0x02, 0x0f)).toBe("keypad_6");
    expect(plateLayout(0x01, 0x21)).toBe("outlet_dimmer");
    expect(plateLayout(0x01, 0x58)).toBe("dial_i3");
    expect(plateLayout(0x03, 0x15)).toBe("none");
  });
});

describe("insteon-device-plate", () => {
  it("registers the custom element", () => {
    expect(customElements.get("insteon-device-plate")).toBeDefined();
  });

  it("renders the KP014 as four stacked rows", async () => {
    const el = await renderPlate(0x01, 0x59);
    const rows = el.shadowRoot!.querySelectorAll(".krow");
    expect(rows.length).toBe(4);
    expect(rows[0].textContent).toContain("A");
    expect(rows[3].textContent).toContain("D");
    expect(el.shadowRoot!.querySelector(".kp-foot .slot")).not.toBeNull();
  });

  it("renders the 6-button keypad with ON and OFF on group 1", async () => {
    const el = await renderPlate(0x01, 0x42);
    const keys = el.shadowRoot!.querySelectorAll(".kgrid .key");
    expect(keys.length).toBe(6);
    expect(keys[0].textContent).toContain("ON");
    expect(keys[5].textContent).toContain("OFF");
  });

  it("renders a dimmer paddle with the 8 LED column", async () => {
    const el = await renderPlate(0x01, 0x24);
    expect(el.shadowRoot!.querySelectorAll(".ledcol .led").length).toBe(8);
    expect(el.shadowRoot!.querySelector(".paddle")).not.toBeNull();
  });

  it("renders a relay paddle with two LEDs and no LED column", async () => {
    const el = await renderPlate(0x02, 0x2a);
    expect(el.shadowRoot!.querySelector(".ledcol")).toBeNull();
    expect(el.shadowRoot!.querySelectorAll(".paddle .led").length).toBe(2);
  });

  it("renders the dual outlet with two selectable receptacles", async () => {
    const el = await renderPlate(0x02, 0x3f);
    expect(el.shadowRoot!.querySelectorAll(".key.recep").length).toBe(2);
  });

  it("marks the selected key", async () => {
    const el = await renderPlate(0x01, 0x59);
    el.selected = 2;
    await el.updateComplete;
    const selected = el.shadowRoot!.querySelectorAll(".selected");
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain("B");
  });

  it("tags the load button on keypads", async () => {
    const el = await renderPlate(0x01, 0x59);
    el.loadGroup = 2;
    await el.updateComplete;
    const tags = el.shadowRoot!.querySelectorAll(".load-tag");
    expect(tags.length).toBe(1);
    expect(tags[0].closest(".krow")!.textContent).toContain("B");
  });

  it("does not tag paddles", async () => {
    const el = await renderPlate(0x01, 0x24);
    el.loadGroup = 1;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelectorAll(".load-tag").length).toBe(0);
  });

  it("fires selection events on click", async () => {
    const el = await renderPlate(0x01, 0x59);
    let got: number | undefined;
    el.addEventListener("insteon-button-selected", (ev) => {
      got = (ev as CustomEvent<{ group: number }>).detail.group;
    });
    (el.shadowRoot!.querySelectorAll(".krow")[2] as HTMLElement).click();
    expect(got).toBe(3);
  });
});
