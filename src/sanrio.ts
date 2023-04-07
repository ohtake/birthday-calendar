import { BirthdayCalender, groupBy, leftJoin, loadTSV } from "./lib";

type Birthday = {
  BirthMonth: number;
  BirthDay: number;
};

type CharaData = {
  SeriesKey: string;
  CharaName: string;
  Species: string;
  BirthdayNote: string;
} & Partial<Birthday>;

type SeriesData = {
  SeriesKey: string;
  SeriesNameJa: string;
  SeriesNameEn: string;
  ReleaseYear: number;
  ReleaseYearNote: string;
  ParentSeriesKey: string;
};

function hasBirthday<T extends Partial<Birthday>>(d: T): d is T & Birthday {
  return d.BirthMonth !== undefined && d.BirthDay !== undefined;
}

function getYear(c: CharaData & Birthday & Partial<SeriesData>): number {
  if (!c.ReleaseYear) return 1960; // 山梨シルクセンターの設立年
  if (c.BirthMonth !== 2 || c.BirthDay !== 29) return c.ReleaseYear;
  const mod4 = c.ReleaseYear % 4;
  // 0 (mod 4) が 1900 や 2100 のときには閏年ではないが、その範囲の年になることはないので実用上問題ない
  if (mod4 === 0) return c.ReleaseYear;
  return c.ReleaseYear + 4 - mod4;
}

export async function createSanrioCalendar() {
  const characters = await loadTSV<CharaData>("./data/sanrio.tsv", (row) => {
    const BirthMonth =
      row.BirthMonth === "" ? undefined : parseInt(row.BirthMonth);
    const BirthDay = row.BirthDay === "" ? undefined : parseInt(row.BirthDay);
    return {
      ...row,
      BirthMonth,
      BirthDay,
    } as CharaData;
  });
  const series = await loadTSV<SeriesData>("./data/sanrioSeries.tsv", (row) => {
    const ReleaseYear = parseInt(row.ReleaseYear);
    return {
      ...row,
      ReleaseYear,
    } as SeriesData;
  });

  const joined = leftJoin(characters, series, "SeriesKey");
  const grouped = groupBy(joined, (c) => c.SeriesKey);

  const bc = new BirthdayCalender("Sanrio Birthdays");
  grouped.forEach((characters, seriesKey) => {
    const c0 = characters[0];
    const groupSummaries = [c0.SeriesNameJa];
    if (c0.SeriesNameEn) groupSummaries.push("/", c0.SeriesNameEn);
    groupSummaries.push(
      `[${c0.ReleaseYear}${
        c0.ReleaseYearNote ? `(${c0.ReleaseYearNote})` : ""
      }]`
    );
    const groupSummary = groupSummaries.join(" ");
    const groupTable =
      characters.length === 1
        ? ""
        : characters
            .map((c) => {
              return `${c.CharaName} ${c.BirthMonth ?? "?"}/${
                c.BirthDay ?? "?"
              }`;
            })
            .join("\n");
    characters.forEach((c) => {
      if (!hasBirthday(c)) return;
      const summary =
        c.SeriesKey === c.CharaName
          ? c.CharaName
          : `${c.SeriesKey} ${c.CharaName}`;
      const startYear = getYear(c);
      const descriptionBlocks: string[] = [];
      if (c.BirthdayNote) descriptionBlocks.push(c.BirthdayNote);
      descriptionBlocks.push(groupSummary, groupTable);
      bc.addBirthday(summary, c.BirthMonth, c.BirthDay, {
        startYear,
        description: descriptionBlocks.join("\n\n"),
      });
    });
  });
  return bc;
}
