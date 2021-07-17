export type VecRecord = {
    date: Date;
    usageByHalfHour: { [hour: number]: number };
  };