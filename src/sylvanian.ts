import { BirthdayCalender, groupBy, leftJoin, loadTSV } from "./lib";

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
  const familyGroups = groupBy(joined, (m) => m.Family);

  const bc = new BirthdayCalender("Sylvanian Birthdays");
  familyGroups.forEach((familyMembers, _family) => {
    const familyTable = familyMembers
      .map((m) => {
        const bdStr = `${m.BirthMonth ?? "?"}/${m.BirthDay ?? "?"}`;
        const str = `${toFullRelation(m)} ${m.GivenName} ${bdStr}`;
        return str;
      })
      .join("\n");
    // 双子や三つ子をまとめる
    // TODO 「ふたごの女の子」と「ふたごの男の子」がまとまらない
    const relGroups = groupBy(familyMembers, (m) =>
      [m.Relation1, m.BirthMonth, m.BirthDay].join("-")
    );
    relGroups.forEach((rg) => {
      addBirthdayEntry(bc, rg, familyTable);
    });
  });
  return bc;
}

function addBirthdayEntry(
  bc: BirthdayCalender,
  members: (CharaData & Partial<FamilyData>)[],
  familyTable: string
) {
  const m0 = members[0];
  if (!hasBirthday(m0)) return;
  const summaries: string[] = [];
  summaries.push(`${m0.Family}の${m0.Relation1}`);
  if (members.length === 1 && m0.Relation2) summaries.push(`(${m0.Relation2})`);
  summaries.push(" ");
  if (members.length === 1) {
    summaries.push(toFullName(m0));
  } else {
    const givenNames = members
      .map((m) => m.GivenName ?? "NoGivenName")
      .join("/");
    summaries.push(`${givenNames} ${m0.FamilyName ?? "NoFamilyName"}`);
  }
  const summary = summaries.join("");
  const startYear = getYear(m0);
  let groupList: string;
  if (members.length === 1) {
    groupList = m0.Favorites ?? "";
  } else {
    groupList = members
      .map(
        (m) =>
          `${m.Relation2} ${toFullName(m)}${
            m.Favorites ? ` [${m.Favorites}]` : ""
          }`
      )
      .join("\n");
  }
  const descriptions: string[] = [];
  if (groupList) descriptions.push(groupList);
  descriptions.push(familyTable);
  bc.addBirthday(summary, m0.BirthMonth, m0.BirthDay, {
    description: descriptions.join("\n\n"),
    startYear,
  });
}

function toFullRelation(
  m: Partial<Pick<CharaData, "Relation1" | "Relation2">>
): string {
  return `${m.Relation1}${m.Relation2 ? `(${m.Relation2})` : ""}`;
}

function toFullName(
  m: Partial<Pick<CharaData, "GivenName"> & Pick<FamilyData, "FamilyName">>
): string {
  return `${m.GivenName || "NoGivenName"} ${m.FamilyName || "NoFamilyName"}`;
}
