import type { ALDBRecord } from "../data/device";
import { buttonNotifiesModem, hasModemResponderLink } from "../device/link-rows";

export interface ModemLinkGaps {
  control: boolean;
  unreported: number[];
}

export const modemLinkGaps = (
  records: ALDBRecord[],
  buttons: number[],
  modem: string,
): ModemLinkGaps => ({
  control: !hasModemResponderLink(records, modem),
  unreported: buttons.filter((button) => !buttonNotifiesModem(records, modem, button)),
});

export const hasModemLinkGaps = (gaps: ModemLinkGaps): boolean =>
  gaps.control || gaps.unreported.length > 0;
