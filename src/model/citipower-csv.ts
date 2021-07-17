import * as papaparse from "papaparse";
import { parse } from "date-fns";
import { VecRecord } from "./vecRecord";
import { ParseResult } from "papaparse";

export const parseCsv = async (file: File): Promise<VecRecord[]> => {
  return new Promise(async (resolve, reject) => {
    if ((await validateCsv(file)) === false) return reject();
    let records: VecRecord[] = [];

    papaparse.parse(file, {
      worker: true, // use web workers
      delimiter: ",",
      header: false,
      step: (results: ParseResult<string>) => onParseStep(results, records),
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
  const startOfFile = file.slice(0, 825, "text/plain");
  const text = await startOfFile.text();
  const firstLine = text.split("\n")[0];

  // expect 12 columns in the first line
  return firstLine.split(",").length === 12;
};

const onParseStep = (
  result: ParseResult<string>,
  records: VecRecord[]
) => {
  // sample data
  // 6102583120,14/07/2020,00:30,A4369789,E1,,,0.023,,VIC,,N

  const isConsumption = result.data[4] === "E1";

  // ignore non-consumption records
  if (!isConsumption) {
    return;
  }

  const hourString = result.data[2];

  records.push({
    date: parse(result.data[1], "dd/MM/yyyy", new Date()),
    hour: parseInt(hourString.substring(0, 2)) + (hourString.substring(3,5) === "30" ? 0.5 : 0),
    consumption: parseFloat(result.data[7]),
  });
};