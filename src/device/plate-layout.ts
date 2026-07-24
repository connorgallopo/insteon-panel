export type PlateLayout =
  | "paddle_dimmer"
  | "paddle_relay"
  | "paddle_i3"
  | "keypad_i3_4"
  | "keypad_6"
  | "keypad_8"
  | "dial_i3"
  | "outlet_dual"
  | "outlet_dimmer"
  | "module"
  | "none";

const DIMMER_PADDLES = new Set([
  0x01, 0x03, 0x04, 0x19, 0x0b, 0x0f, 0x11, 0x12, 0x1d, 0x1e, 0x20, 0x24, 0x25, 0x27, 0x2b, 0x2d,
  0x30, 0x31, 0x17, 0x1f, 0x02, 0x18, 0x1a, 0x2c, 0x32, 0x3d, 0x3e, 0x3f, 0x40,
]);
const DIMMER_MODULES = new Set([0x00, 0x06, 0x07, 0x0d, 0x0e, 0x22, 0x23, 0x2a, 0x35, 0x38, 0x39]);
const DIMMER_KEYPAD_6 = new Set([0x09, 0x0a, 0x1b, 0x29, 0x2f, 0x42]);
const DIMMER_KEYPAD_8 = new Set([0x0c, 0x1c, 0x41]);

const RELAY_PADDLES = new Set([
  0x0a, 0x0b, 0x0e, 0x15, 0x16, 0x18, 0x19, 0x1c, 0x23, 0x29, 0x2a, 0x2d, 0x30, 0x35, 0x36, 0x37,
  0x0d, 0x1a, 0x10, 0x12, 0x14, 0x1f, 0x22, 0x2b,
]);
const RELAY_MODULES = new Set([0x06, 0x09, 0x0c, 0x17, 0x38, 0x2f, 0x31, 0x32]);
const RELAY_KEYPAD_6 = new Set([0x0f, 0x1e, 0x2c]);
const RELAY_KEYPAD_8 = new Set([0x05]);

export const plateLayout = (cat?: number | null, subcat?: number | null): PlateLayout => {
  if (cat === undefined || cat === null || subcat === undefined || subcat === null) {
    return "none";
  }
  if (cat === 0x01) {
    if (subcat === 0x57) return "paddle_i3";
    if (subcat === 0x58) return "dial_i3";
    if (subcat === 0x59) return "keypad_i3_4";
    if (subcat === 0x21) return "outlet_dimmer";
    if (DIMMER_KEYPAD_6.has(subcat)) return "keypad_6";
    if (DIMMER_KEYPAD_8.has(subcat)) return "keypad_8";
    if (DIMMER_MODULES.has(subcat)) return "module";
    if (DIMMER_PADDLES.has(subcat)) return "paddle_dimmer";
    return "paddle_dimmer";
  }
  if (cat === 0x02) {
    if (subcat === 0x39 || subcat === 0x3f) return "outlet_dual";
    if (RELAY_KEYPAD_6.has(subcat)) return "keypad_6";
    if (RELAY_KEYPAD_8.has(subcat)) return "keypad_8";
    if (RELAY_MODULES.has(subcat)) return "module";
    if (RELAY_PADDLES.has(subcat)) return "paddle_relay";
    return "paddle_relay";
  }
  return "none";
};
