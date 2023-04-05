import { parse } from "csv-parse";
import fs from "fs";

export async function loadTSV<T>(
  filename: string,
  transform: (row: Record<string, string>) => T
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const rows: T[] = [];
    fs.createReadStream(filename)
      .pipe(parse({ columns: true, delimiter: "\t" }))
      .on("data", (row) => {
        const r = transform(row);
        rows.push(r);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

export function leftJoin<
  TLeft extends {},
  TRight extends {},
  TKey extends keyof TLeft & keyof TRight
>(
  left: readonly TLeft[],
  right: readonly TRight[],
  key: TKey
): (TLeft & Partial<Omit<TRight, keyof TLeft>>)[] {
  const rightMap = new Map<unknown, TRight>();
  right.forEach((r) => {
    rightMap.set(r[key], r);
  });
  return left.map((l) => {
    const k = l[key];
    const r = rightMap.get(k);
    if (r) {
      return {
        ...r,
        ...l,
      };
    } else {
      return l;
    }
  });
}

export function groupBy<TRow extends {}>(
  rows: readonly TRow[],
  selector: (r: TRow) => string
): Map<string, TRow[]> {
  const map: Map<string, TRow[]> = new Map();
  rows.forEach((r) => {
    const key = selector(r);
    const arr = map.get(key);
    if (arr) {
      arr.push(r);
    } else {
      map.set(key, [r]);
    }
  });
  return map;
}
