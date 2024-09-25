import ical, {
  ICalCalendar,
  ICalEventData,
  ICalEventRepeatingFreq,
  ICalEventStatus,
  ICalEventTransparency,
  ICalRepeatingOptions,
} from "ical-generator";
import { writeFile } from "node:fs/promises";

const repeatingAnnualy: ICalRepeatingOptions = {
  freq: ICalEventRepeatingFreq.YEARLY,
};

export class BirthdayCalender {
  private cal: ICalCalendar;

  public constructor(
    calendarName: string,
    private readonly initialYear: number
  ) {
    this.cal = ical({ name: calendarName });
  }

  /**
   * @param summary
   * @param month [1-12] の範囲での月
   * @param day
   * @param opts
   */
  public addBirthday(
    summary: string,
    month: number,
    day: number,
    opts?: {
      releaseYear?: number;
      description?: string;
    }
  ) {
    const year = this.inferBirthYear(month, day, opts?.releaseYear);
    const data: ICalEventData = {
      summary,
      start: new Date(Date.UTC(year, month - 1, day)),
      end: new Date(Date.UTC(year, month - 1, day + 1)),
      allDay: true,
      repeating: repeatingAnnualy,
      transparency: ICalEventTransparency.TRANSPARENT,
      status: ICalEventStatus.CONFIRMED,
    };
    if (opts?.description) data.description = opts.description;
    this.cal.createEvent(data);
  }

  /**
   * 開発年と誕生日が矛盾しないように誕生年を推定する。
   */
  private inferBirthYear(
    month: number,
    day: number,
    releaseYear?: number
  ): number {
    const year = releaseYear ?? this.initialYear;
    // 2月29日以外なら開発年を誕生年とする
    if (month !== 2 || day !== 29) return year;
    const mod4 = year % 4;
    const mod100 = year % 100;
    const mod400 = year % 400;
    // 開発年が閏年なら開発年を誕生年とする
    if (mod4 === 0 && (mod100 !== 0 || mod400 === 0)) return year;
    // 2月29日生まれなのに開発年が閏年でないのなら、開発年の直近の閏年を誕生年とする。
    // e.g. 1995-02-29 => 1992-02-29
    // 閏年が必ずしも4年周期で来るとは限らないので再帰する。
    // e.g. 1901-02-29 => 1900-02-29 => 1896-02-29
    return this.inferBirthYear(month, day, year - mod4);
  }

  public async writeFile(filename: string) {
    await writeFile(filename, this.cal.toString());
  }
}
