// refactored from https://stackoverflow.com/a/55297611

const asc = (arr: number[]) => arr.sort((a, b) => a - b);

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const mean = (arr: number[]) => sum(arr) / arr.length;

// standard deviation
export const std = (arr: number[]): number => {
  const mu = mean(arr);
  const diffArr = arr.map((a) => (a - mu) ** 2);
  return Math.sqrt(sum(diffArr) / (arr.length - 1));
};

// max
export const max = (arr: number[]): number => {
  return asc(arr).reverse()[0];
};

// quantiles
export const quantile = (arr: number[], q: number): number => {
  const sorted = asc(arr);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
};

export const q25 = (arr: number[]): number => quantile(arr, 0.25);

export const q50 = (arr: number[]): number => quantile(arr, 0.5);

export const q75 = (arr: number[]): number => quantile(arr, 0.75);

export const median = (arr: number[]): number => q50(arr);
