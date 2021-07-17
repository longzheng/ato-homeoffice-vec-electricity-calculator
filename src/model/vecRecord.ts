export type VecRecord = {
    nmi: number;
    meter_serial_number: number;
    type: "consumption" | "generation";
    date: Date;
    estimated: boolean;
    usageByHalfHour: { [hour: number]: number };
  };
  