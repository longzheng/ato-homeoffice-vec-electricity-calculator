import * as papaparse from "papaparse";

type VecRecord = {
  nmi: number;
  meter_serial_number: number;
  type: "consumption" | "generation";
  date: Date;
  estimated: boolean;
  usageByHalfHour: { [hour: number]: number };
};

export const parseCsv = async (file: File): Promise<VecRecord[]> => {
  return new Promise(async (resolve, reject) => {
    if ((await validateCsv(file)) === false) return reject();
    let records: VecRecord[] = [];

    papaparse.parse(file, {
      worker: true, // use web workers
      delimiter: ",",
      header: true,
      step: (results) => onParseStep(results, records),
      complete: () => {
        return resolve(records);
      },
      error: () => {
        return reject();
      },
      skipEmptyLines: true,
    });
  });
};

const validateCsv = async (file: File): Promise<boolean> => {
  const firstLine = file.slice(0, 825, "text/plain");
  const text = await firstLine.text();

  // match text with expected CSV headers
  return (
    text ===
    `"NMI","METER SERIAL NUMBER","CON/GEN","DATE","ESTIMATED?","00:00 - 00:30","00:30 - 01:00","01:00 - 01:30","01:30 - 02:00","02:00 - 02:30","02:30 - 03:00","03:00 - 03:30","03:30 - 04:00","04:00 - 04:30","04:30 - 05:00","05:00 - 05:30","05:30 - 06:00","06:00 - 06:30","06:30 - 07:00","07:00 - 07:30","07:30 - 08:00","08:00 - 08:30","08:30 - 09:00","09:00 - 09:30","09:30 - 10:00","10:00 - 10:30","10:30 - 11:00","11:00 - 11:30","11:30 - 12:00","12:00 - 12:30","12:30 - 13:00","13:00 - 13:30","13:30 - 14:00","14:00 - 14:30","14:30 - 15:00","15:00 - 15:30","15:30 - 16:00","16:00 - 16:30","16:30 - 17:00","17:00 - 17:30","17:30 - 18:00","18:00 - 18:30","18:30 - 19:00","19:00 - 19:30","19:30 - 20:00","20:00 - 20:30","20:30 - 21:00","21:00 - 21:30","21:30 - 22:00","22:00 - 22:30","22:30 - 23:00","23:00 - 23:30","23:30 - 00:00"`
  );
};

const onParseStep = (
  results: papaparse.ParseResult<unknown>,
  records: VecRecord[]
) => {
  const data = (results.data as unknown) as { [key: string]: string };

  records.push({
    nmi: parseInt(data["NMI"]),
    meter_serial_number: parseInt(data["METER SERIAL NUMBER"]),
    type: data["CON/GEN"] === "Consumption" ? "consumption" : "generation",
    date: new Date(data["DATE"]),
    estimated: data["ESTIMATED?"] === "Yes",
    usageByHalfHour: buildUsageByHalfHour(data),
  });
};

const buildUsageByHalfHour = (data: {
  [key: string]: string;
}): { [key: number]: number } => {
  let halfHourlyUsage: { [key: number]: number } = {};

  // loop through 30 minute blocks
  for (let hour = 0; hour < 24; hour++) {
    for (let halfHour = 0; halfHour < 2; halfHour++) {
      let timeStart = `${hour.toString().padStart(2, "0")}:${(halfHour * 30)
        .toString()
        .padEnd(2, "0")}`;
      let timeEnd =
        halfHour === 0
          ? `${hour.toString().padStart(2, "0")}:${((halfHour + 1) * 30)
              .toString()
              .padEnd(2, "0")}`
          : `${(hour + 1).toString().padStart(2, "0")}:${((halfHour - 1) * 30)
              .toString()
              .padEnd(2, "0")}`;

      if (timeEnd === "24:00") {
        timeEnd = "00:00";
      }

      let timeRange = `${timeStart} - ${timeEnd}`;
      let blockKwh = parseFloat(data[timeRange]);

      if (isNaN(blockKwh)) {
        blockKwh = 0;
      }

      // write record
      halfHourlyUsage[hour + (halfHour ? 0.5 : 0)] = blockKwh;
    }
  }

  return halfHourlyUsage;
};
