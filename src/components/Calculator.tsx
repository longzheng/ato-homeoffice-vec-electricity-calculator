import {
  Button,
  Container,
  FormControl,
  FormLabel,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { KeyboardDatePicker } from "@material-ui/pickers";
import React, { useMemo, useState } from "react";
import { parseCsv } from "../model/vec-csv";

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  input: {
    display: "none",
  },
}));

export const Upload = () => {
  const fileInputRef = React.createRef<HTMLInputElement>();
  const [usageFile, setUsageFile] = useState<File | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date>(new Date("2020-03-01"));
  const [endDate, setEndDate] = useState<Date>(new Date("2020-06-30"));
  const [wfhUsage, setWfhUsage] = useState<number | undefined>();
  const classes = useStyles();

  useMemo(async () => {
    if (!usageFile) return;

    try {
      const usageData = await parseCsv(usageFile);

      // filter usage data by consumption
      const consumptionData = usageData.filter(
        (x) =>
          x.date >= startDate &&
          x.date <= endDate &&
          x.date.getDay() >= 1 &&
          x.date.getDay() <= 5 &&
          x.type === "consumption"
      );

      let wfhUsage = 0;
      consumptionData.map((record) => {
        for (const [key, value] of Object.entries(record.usageByHalfHour)) {
          let hour = parseFloat(key);
          if (hour >= 9 && hour < 18) {
            wfhUsage += value;
          }
        }
      });

      setWfhUsage(wfhUsage);
    } catch {}
  }, [usageFile, startDate, endDate]);

  const onFilesAdded = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files?.length !== 1) {
      return;
    }

    const file = files.item(0);

    if (!file) {
      return;
    }

    setUsageFile(file);

    // clear file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const upload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.paper}>
        <Typography variant="h5" component="h1">
          Home office electricity calculator using Victorian Energy Compare Data
        </Typography>
        <div>
          <input
            ref={fileInputRef}
            className={classes.input}
            type="file"
            accept="text/csv"
            onChange={onFilesAdded}
          />
          <Button onClick={upload} variant="contained" color="primary">
            Upload CSV
          </Button>
        </div>
        <FormControl>
          <FormLabel>Working form home period</FormLabel>
          <KeyboardDatePicker
            autoOk
            disableToolbar
            variant="inline"
            label="Start date"
            format="dd/MM/yyyy"
            value={startDate}
            InputAdornmentProps={{ position: "start" }}
            onChange={(date) => date && setStartDate(date)}
          />
          <KeyboardDatePicker
            autoOk
            disableToolbar
            variant="inline"
            label="End date"
            format="dd/MM/yyyy"
            value={endDate}
            InputAdornmentProps={{ position: "start" }}
            onChange={(date) => date && setEndDate(date)}
          />
        </FormControl>
        <div>WFH Usage:{wfhUsage}</div>
      </div>
    </Container>
  );
};
