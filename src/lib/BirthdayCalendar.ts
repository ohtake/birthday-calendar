import ical, {
  ICalCalendar,
  ICalEventData,
  ICalRepeatingOptions,
  ICalEventRepeatingFreq,
  ICalEventTransparency,
  ICalEventStatus,
} from "ical-generator";

const repeatingAnnualy: ICalRepeatingOptions = {
  freq: ICalEventRepeatingFreq.YEARLY,
};

export class BirthdayCalender {
  private cal: ICalCalendar;

  public constructor(calendarName: string) {
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
      startYear?: number;
      description?: string;
    }
  ) {
    const startYear = opts?.startYear ?? 1900;
    const data: ICalEventData = {
      summary,
      start: new Date(Date.UTC(startYear, month - 1, day)),
      end: new Date(Date.UTC(startYear, month - 1, day + 1)),
      allDay: true,
      repeating: repeatingAnnualy,
      transparency: ICalEventTransparency.TRANSPARENT,
      status: ICalEventStatus.CONFIRMED,
    };
    if (opts?.description) data.description = opts.description;
    this.cal.createEvent(data);
  }

  public async writeFile(filename: string) {
    await this.cal.save(filename);
  }
}
