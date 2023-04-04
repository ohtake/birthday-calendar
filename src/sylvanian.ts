import { BirthdayCalender, leftJoin, loadTSV } from "./lib";

type Birthday = {
  BirthMonth: number;
  BirthDay: number;
};

type CharaData = {
  Family: string;
  Relation1: string;
  Relation2: string;
  GivenName: string;
  Sex: "M" | "F" | "";
  Favorites: string;
} & Partial<Birthday>;

type FamilyData = {
  Family: string;
  FamilyName: string;
};

function hasBirthday<T extends Partial<Birthday>>(d: T): d is T & Birthday {
  return d.BirthMonth !== undefined && d.BirthDay !== undefined;
}

function isLeap(d: Birthday): boolean {
  return d.BirthMonth === 2 && d.BirthDay === 29;
}

function getYear(d: Birthday): number {
  // キャラごとの開発年を入れたい

  // 1985年3月20日が初代の発売日なので
  if (isLeap(d)) return 1986;
  return 1985;
}

export async function createSylvanianCalendar() {
  const characters = await loadTSV<CharaData>("./data/sylvanian.tsv", (row) => {
    const BirthMonth =
      row.BirthMonth === "" ? undefined : parseInt(row.BirthMonth);
    const BirthDay = row.BirthDay === "" ? undefined : parseInt(row.BirthDay);
    return {
      ...row,
      BirthMonth,
      BirthDay,
    } as CharaData;
  });
  const families = await loadTSV<FamilyData>(
    "./data/sylvanianFamilyName.tsv",
    (row) => {
      return {
        ...row,
      } as FamilyData;
    }
  );

  const joined = leftJoin(characters, families, "Family");

  const bc = new BirthdayCalender("Sylvanian Birthdays");
  joined.forEach((r) => {
    if (!hasBirthday(r)) return;
    const familyRel = `${r.Family}の${r.Relation1}`;
    const relOption = r.Relation2 ? `(${r.Relation2})` : "";
    const fullName = `${r.GivenName} ${r.FamilyName || "NoFamilyName"}`;
    const summary = `${familyRel}${relOption} ${fullName}`;
    const startYear = getYear(r);
    bc.addBirthday(summary, r.BirthMonth, r.BirthDay, {
      description: r.Favorites,
      startYear,
    });
  });
  return bc;
}
