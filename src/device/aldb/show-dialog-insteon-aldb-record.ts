import { fireEvent } from "@ha/common/dom/fire_event";
import type { Insteon } from "../../data/insteon";
import type { ALDBRecord } from "../../data/device";
import type { HomeAssistant } from "@ha/types";
import type { HaFormSchema } from "@ha/components/ha-form/types";

export interface InsteonALDBRecordDialogParams {
  hass: HomeAssistant;
  insteon: Insteon;
  record: ALDBRecord;
  schema: HaFormSchema[];
  title: string;
  callback: (rec: ALDBRecord) => Promise<void>;
  require_change: boolean;
}

export const loadInsteonALDBRecordDialog = () =>
  import(/* webpackChunkName: "dialog-insteon-aldb-record" */ "./dialog-insteon-aldb-record");

export const showInsteonALDBRecordDialog = (
  element: HTMLElement,
  insteonALDBRecordParams: InsteonALDBRecordDialogParams,
): void => {
  fireEvent(element, "show-dialog", {
    dialogTag: "dialog-insteon-aldb-record",
    dialogImport: loadInsteonALDBRecordDialog,
    dialogParams: insteonALDBRecordParams,
  });
};
