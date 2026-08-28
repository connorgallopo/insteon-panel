import { describe, expect, it } from "vitest";
import type { ALDBRecord } from "../src/data/device";
import { controlRows, responderRows } from "../src/device/link-rows";

const rec = (over: Partial<ALDBRecord>): ALDBRecord => ({
  mem_addr: 0x0fff,
  in_use: true,
  is_controller: false,
  highwater: false,
  group: 0,
  target: "70.8C.C4",
  target_name: "PowerLinc USB Modem 70.8C.C4",
  data1: 255,
  data2: 28,
  data3: 1,
  dirty: false,
  ...over,
});

describe("responderRows", () => {
  it("collapses identical target and group pairs and counts them", () => {
    const rows = responderRows(
      [rec({ mem_addr: 0x0fff }), rec({ mem_addr: 0x0ff7 }), rec({ target: "4D.52.0A", group: 3 })],
      1,
      true,
    );
    expect(rows).toEqual([
      { target: "70.8C.C4", name: "PowerLinc USB Modem 70.8C.C4", group: 0, count: 2 },
      { target: "4D.52.0A", name: "PowerLinc USB Modem 70.8C.C4", group: 3, count: 1 },
    ]);
  });

  it("keeps only the selected button on multi button devices", () => {
    const records = [
      rec({ data3: 1, group: 5 }),
      rec({ data3: 0, group: 6 }),
      rec({ data3: 3, group: 7 }),
      rec({ data3: 3, group: 7, is_controller: true }),
    ];
    expect(responderRows(records, 1, false).map((r) => r.group)).toEqual([5, 6]);
    expect(responderRows(records, 3, false).map((r) => r.group)).toEqual([7]);
  });

  it("drops records that are not in use", () => {
    expect(responderRows([rec({ in_use: false })], 1, true)).toEqual([]);
  });
});

describe("controlRows", () => {
  it("returns controller records for the group, collapsed", () => {
    const records = [
      rec({ is_controller: true, group: 1, target: "11.22.33", target_name: "" }),
      rec({ is_controller: true, group: 1, target: "11.22.33", target_name: "" }),
      rec({ is_controller: true, group: 2, target: "44.55.66" }),
      rec({ is_controller: false, group: 1 }),
    ];
    expect(controlRows(records, 1)).toEqual([
      { target: "11.22.33", name: "11.22.33", group: 1, count: 2 },
    ]);
  });
});
