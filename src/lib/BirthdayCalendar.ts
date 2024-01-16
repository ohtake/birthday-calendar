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

  private inferBirthYear(
    month: number,
    day: number,
    releaseYear?: number
  ): number {
    const year = releaseYear ?? this.initialYear;
    if (month !== 2 || day !== 29) return year;
    const mod4 = year % 4;
    const mod100 = year % 100;
    const mod400 = year % 400;
    // 0 (mod 4) が 1900 や 2100 のときには閏年ではないが、その範囲の年になることはないので実用上問題ない
    if (mod4 === 0 && (mod100 !== 0 || mod400 === 0)) return year;
    return this.inferBirthYear(month, day, year + 4 - mod4);
  }

  public async writeFile(filename: string) {
    await writeFile(filename, this.cal.toString());
  }
}
