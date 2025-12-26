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

export async function createSanrioCalendar() {
  const characters = await loadTSV<CharaData>("./data/sanrio.tsv", (row) => {
    const BirthMonth =
      row["BirthMonth"] === "" ? undefined : parseInt(row["BirthMonth"]!);
    const BirthDay =
      row["BirthDay"] === "" ? undefined : parseInt(row["BirthDay"]!);
    return {
      ...row,
      BirthMonth,
      BirthDay,
    } as CharaData;
  });
  const series = await loadTSV<SeriesData>("./data/sanrioSeries.tsv", (row) => {
    const ReleaseYear = parseInt(row["ReleaseYear"]!);
    return {
      ...row,
      ReleaseYear,
    } as SeriesData;
  });

  const joined = leftJoin(characters, series, "SeriesKey");
  const grouped = groupBy(joined, (c) => c.SeriesKey);

  const bc = new BirthdayCalender("Sanrio Birthdays", 1960); // 1960 = 山梨シルクセンターの設立年
  grouped.forEach((characters, seriesKey) => {
    const c0 = characters[0]!;
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
    const charactersWithBD = characters.filter(hasBirthday);
    const bdGroup = groupBy(
      charactersWithBD,
      (c) => `${c.BirthMonth}-${c.BirthDay}`
    );
    bdGroup.forEach((g) => {
      const c = g[0]!;
      const prefix = c.SeriesKey;
      const names = g.map((c) => c.CharaName).join("/");
      const summary = prefix === names ? prefix : `${prefix} ${names}`;
      const descriptionBlocks: string[] = [];
      const notes = g
        .map((c) => c.BirthdayNote)
        .filter((s) => s)
        .join("\n");
      if (notes) descriptionBlocks.push(notes);
      descriptionBlocks.push(groupSummary, groupTable);
      bc.addBirthday(summary, c.BirthMonth, c.BirthDay, {
        releaseYear: c.ReleaseYear,
        description: descriptionBlocks.join("\n\n"),
      });
    });
  });
  return bc;
}
