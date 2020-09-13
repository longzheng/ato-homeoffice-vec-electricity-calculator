import {
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import { KeyboardDatePicker, KeyboardTimePicker } from "@material-ui/pickers";
import React, { useCallback, useMemo, useState } from "react";
import { parseCsv } from "../model/vec-csv";
import { parse } from "date-fns";

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(6),
  },
  paper: {
    padding: theme.spacing(2),
  },
  input: {
    display: "none",
  },
}));

export const Upload = () => {
  const fileInputRef = React.createRef<HTMLInputElement>();
  const [usageFile, setUsageFile] = useState<File | undefined>(undefined);
  const [usageFilename, setUsageFilename] = useState<string>();
  const [startDate, setStartDate] = useState<Date>(new Date("2020-03-01"));
  const [endDate, setEndDate] = useState<Date>(new Date("2020-06-30"));
  const [startTime, setStartTime] = useState<Date>(
    parse("8:00 AM", "h:m a", new Date())
  );
  const [endTime, setEndTime] = useState<Date>(
    parse("5:00 PM", "h:m a", new Date())
  );
  const [daysOfWeek, setDaysOfWeek] = React.useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [wfhUsage, setWfhUsage] = useState<number | undefined>();
  const classes = useStyles();

  const isDayOfWeekMatch = useCallback(
    (date: Date) => {
      const dateDayOfWeek = date.getDay();

      switch (dateDayOfWeek) {
        case 0:
          return daysOfWeek.sunday;
        case 1:
          return daysOfWeek.monday;
        case 2:
          return daysOfWeek.tuesday;
        case 3:
          return daysOfWeek.wednesday;
        case 4:
          return daysOfWeek.thursday;
        case 5:
          return daysOfWeek.friday;
        case 6:
          return daysOfWeek.saturday;
        default:
          throw new Error();
      }
    },
    [daysOfWeek]
  );

  const isHourScheduleMatch = useCallback(
    (hour: number) => {
      // convert time to hours represented in decimal (e.g. 9:30 = 9.5)
      const startTimeHoursDecimal =
        startTime.getHours() + (startTime.getMinutes() === 30 ? 0.5 : 0);
      const endTimeHoursDecimal =
        endTime.getHours() + (endTime.getMinutes() === 30 ? 0.5 : 0);

      return hour >= startTimeHoursDecimal && hour < endTimeHoursDecimal;
    },
    [startTime, endTime]
  );

  useMemo(async () => {
    if (!usageFile) return;

    try {
      setUsageFilename(usageFile.name);
      const usageData = await parseCsv(usageFile);

      // filter usage data by consumption
      const consumptionData = usageData.filter(
        (x) =>
          x.date >= startDate &&
          x.date <= endDate &&
          isDayOfWeekMatch(x.date) &&
          x.type === "consumption"
      );

      let wfhUsage = 0;
      consumptionData.map((record) => {
        for (const [key, value] of Object.entries(record.usageByHalfHour)) {
          // our data's keys are represented as a decimal value (e.g. 9:30 = 9.5)
          let hour = parseFloat(key);
          if (isHourScheduleMatch(hour)) {
            wfhUsage += value;
          }
        }
      });

      setWfhUsage(wfhUsage);
    } catch {}
  }, [usageFile, startDate, endDate, isDayOfWeekMatch, isHourScheduleMatch]);

  const handleDaysOfWeekChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDaysOfWeek({ ...daysOfWeek, [event.target.name]: event.target.checked });
  };

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
    <Container maxWidth="sm" className={classes.container}>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <Typography variant="h5" component="h1">
            Home office electricity calculator using Victorian Energy Compare
            Data
          </Typography>
        </Grid>
        <Grid item xs>
          <Paper className={classes.paper}>
            <Typography variant="h6">
              Upload Victorian Energy Compare Data
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Export the CSV file from your energy distributor website
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
            {usageFile && (
              <div>
                <hr />
                <div>Selected file: {usageFilename}</div>
              </div>
            )}
          </Paper>
        </Grid>
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h6">Working from home schedule</Typography>
            <Typography variant="subtitle1" gutterBottom>
              Choose the appropriate times you work from home
            </Typography>
            <Grid container spacing={2}>
              <Grid item sm={6}>
                <FormControl>
                  <FormLabel>Dates</FormLabel>
                  <KeyboardDatePicker
                    autoOk
                    disableToolbar
                    variant="inline"
                    label="Start date"
                    format="dd/MM/yyyy"
                    value={startDate}
                    InputAdornmentProps={{ position: "start" }}
                    onChange={(date) => date && setStartDate(date)}
                    margin="dense"
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
                    margin="dense"
                  />
                </FormControl>
              </Grid>
              <Grid item sm={6}>
                <FormControl>
                  <FormLabel>Hours</FormLabel>
                  <KeyboardTimePicker
                    label="Start time"
                    mask="__:__ _M"
                    value={startTime}
                    InputAdornmentProps={{ position: "start" }}
                    minutesStep={30}
                    onChange={(date) => date && setStartTime(date)}
                    margin="dense"
                  />
                  <KeyboardTimePicker
                    label="End time"
                    mask="__:__ _M"
                    value={endTime}
                    InputAdornmentProps={{ position: "start" }}
                    minutesStep={30}
                    onChange={(date) => date && setEndTime(date)}
                    margin="dense"
                  />
                  <FormHelperText>
                    Usage data is only available in 30 minute increments
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            <FormControl>
              <FormLabel>Days of week</FormLabel>
              <FormGroup row>
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((value) => (
                  <FormControlLabel
                    key={value}
                    control={
                      <Checkbox
                        checked={(daysOfWeek as any)[value.toLowerCase()]}
                        onChange={handleDaysOfWeekChange}
                        name={value.toLowerCase()}
                      />
                    }
                    label={value}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Paper>
        </Grid>
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h6">Electricity usage</Typography>
            {wfhUsage !== undefined && wfhUsage > 0 && <div>{Math.round(wfhUsage * 1000) / 1000} kwh</div>}
            {wfhUsage !== undefined && wfhUsage === 0 && <div>No electricity usage</div>}
            {wfhUsage === undefined && <div>Not yet calculated</div>}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
