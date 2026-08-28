import type { ALDBRecord } from "../data/device";

export interface LinkRow {
  target: string;
  name: string;
  group: number;
  count: number;
}

const collapse = (records: ALDBRecord[]): LinkRow[] => {
  const rows = new Map<string, LinkRow>();
  records.forEach((rec) => {
    const key = `${rec.target}:${rec.group}`;
    const row = rows.get(key);
    if (row) {
      row.count += 1;
      return;
    }
    rows.set(key, {
      target: rec.target,
      name: rec.target_name || rec.target,
      group: rec.group,
      count: 1,
    });
  });
  return [...rows.values()];
};

const respondsFor = (rec: ALDBRecord, group: number, singleButton: boolean): boolean =>
  singleButton || rec.data3 === group || (group === 1 && rec.data3 === 0);

export const controlRows = (records: ALDBRecord[], group: number): LinkRow[] =>
  collapse(records.filter((rec) => rec.in_use && rec.is_controller && rec.group === group));

export const responderRows = (
  records: ALDBRecord[],
  group: number,
  singleButton: boolean,
): LinkRow[] =>
  collapse(
    records.filter(
      (rec) => rec.in_use && !rec.is_controller && respondsFor(rec, group, singleButton),
    ),
  );
