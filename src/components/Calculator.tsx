import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  InputAdornment,
  makeStyles,
  Paper,
  TextField,
  Typography,
} from "@material-ui/core";
import { KeyboardDatePicker, KeyboardTimePicker } from "@material-ui/pickers";
import React, { useCallback, useMemo, useState } from "react";
import { parseCsv } from "../model/vec-csv";
import { parse, format } from "date-fns";
import DateRangeTwoToneIcon from "@material-ui/icons/DateRangeTwoTone";
import PowerIcon from "@material-ui/icons/Power";
import MonetizationOnIcon from "@material-ui/icons/MonetizationOn";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import HomeIcon from "@material-ui/icons/Home";
import { VecRecord } from "../model/vec-csv";

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(6),
    marginBottom: theme.spacing(6),
  },
  paper: {
    padding: theme.spacing(2),
  },
  title: {
    color: theme.palette.primary.main,
    textAlign: "center",
    "& > svg": {
      display: "block",
      fontSize: 60,
      marginLeft: "auto",
      marginRight: "auto",
      marginBottom: theme.spacing(1),
    },
  },
  heading: {
    color: theme.palette.primary.main,
    "& > svg": {
      verticalAlign: "sub",
      marginRight: theme.spacing(1),
    },
  },
  uploaded: {
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.success.dark,
    color: "white",
    padding: theme.spacing(2),
  },
}));

export const Upload = () => {
  const fileInputRef = React.createRef<HTMLInputElement>();
  const [usageFile, setUsageFile] = useState<File | undefined>(undefined);
  const [usageData, setUsageData] = useState<VecRecord[]>();
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
  const [wfhUsage, setWfhUsage] = useState<number>(0);
  const [wfhDays, setWfhDays] = useState<number>(0);
  const [costPerKwh, setCostPerKwh] = useState<number>(0.22);
  const [percentageUsage, setPercentageUsage] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
        startTime.getHours() + (startTime.getMinutes() >= 30 ? 0.5 : 0);
      const endTimeHoursDecimal =
        endTime.getHours() + (endTime.getMinutes() >= 30 ? 0.5 : 0);

      return hour >= startTimeHoursDecimal && hour < endTimeHoursDecimal;
    },
    [startTime, endTime]
  );

  /** Handle uploading data */
  useMemo(async () => {
    if (!usageFile) return;

    try {
      setUsageData(await parseCsv(usageFile));
    } catch {
      // todo: handle error parsing CSV
    }
  }, [usageFile]);

  useMemo(async () => {
    if (!usageData) return;

    setIsProcessing(true);

    // filter usage data by consumption
    const consumptionData = usageData.filter(
      (x) =>
        x.date >= startDate &&
        x.date <= endDate &&
        isDayOfWeekMatch(x.date) &&
        x.type === "consumption"
    );

    let wfhUsage = 0;
    let wfhDays = 0;
    consumptionData.map((record) => {
      for (const [key, value] of Object.entries(record.usageByHalfHour)) {
        // our data's keys are represented as a decimal value (e.g. 9:30 = 9.5)
        let hour = parseFloat(key);
        if (isHourScheduleMatch(hour)) {
          wfhUsage += value;
        }
      }
      wfhDays++;
      return true;
    });

    setWfhUsage(wfhUsage);
    setWfhDays(wfhDays);

    setIsProcessing(false);
  }, [usageData, startDate, endDate, isDayOfWeekMatch, isHourScheduleMatch]);

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
        <Grid item xs>
          <Typography variant="h5" className={classes.title} gutterBottom>
            <HomeIcon />
            Home office electricity calculator using Victorian Energy Compare
            Data
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            To help calculating the electricity usage while working from home
            during lockdown for the "
            <a
              href="https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/home-office-expenses/#Actualcostmethod"
              target="_blank"
              rel="noopener noreferrer"
            >
              actual cost method
            </a>
            " of deducting home office expenses, this tool automatically
            calculates your electricity usage from the{" "}
            <a
              href="https://www.victorianenergysaver.vic.gov.au/energy-advice-for-business/accessing-and-understanding-energy-data"
              target="_blank"
              rel="noopener noreferrer"
            >
              Victorian Energy Compare Data
            </a>
            .
          </Typography>
        </Grid>
        <Grid item xs>
          <Paper className={classes.paper}>
            <Typography variant="h6" className={classes.heading}>
              <InsertDriveFileIcon />
              Victorian Energy Compare Data
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Export your Victorian Energy Compare Data CSV file from your{" "}
              <a
                href="https://www.victorianenergysaver.vic.gov.au/energy-advice-for-business/accessing-and-understanding-energy-data#portal"
                target="_blank"
                rel="noopener noreferrer"
              >
                electricity distributor's website
              </a>
              .
            </Typography>
            <input
              ref={fileInputRef}
              style={{ display: "none" }}
              type="file"
              accept="text/csv"
              onChange={onFilesAdded}
            />
            <Box textAlign="center" marginY={3}>
              <Button
                onClick={upload}
                variant="contained"
                color="primary"
                size="large"
              >
                Select your Victorian Energy Compare CSV
              </Button>
              <FormHelperText style={{ textAlign: "center", marginTop: 10 }}>
                No data is uploaded to any servers, processing is done in your
                browser on your device.
              </FormHelperText>
            </Box>
            {usageFile && usageData && (
              <Box className={classes.uploaded}>
                <strong>File name:</strong> {usageFile?.name}
                <br />
                <strong>File size:</strong> {usageFile?.size.toString()} bytes
                <br />
                <strong>Earliest record date:</strong>{" "}
                {format(usageData[0].date, "PPPP")}
                <br />
                <strong>Latest record date:</strong>{" "}
                {format(usageData[usageData.length - 1].date, "PPPP")}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h6" className={classes.heading}>
              <DateRangeTwoToneIcon />
              Working from home schedule
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Choose the appropriate times you work from home.
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
                    inputVariant="outlined"
                    value={startDate}
                    InputAdornmentProps={{ position: "start" }}
                    onChange={(date) => date && setStartDate(date)}
                    margin="normal"
                    fullWidth
                  />
                  <KeyboardDatePicker
                    autoOk
                    disableToolbar
                    variant="inline"
                    label="End date"
                    format="dd/MM/yyyy"
                    inputVariant="outlined"
                    value={endDate}
                    InputAdornmentProps={{ position: "start" }}
                    onChange={(date) => date && setEndDate(date)}
                    margin="normal"
                    fullWidth
                  />
                </FormControl>
              </Grid>
              <Grid item sm={6}>
                <FormControl>
                  <FormLabel>Hours</FormLabel>
                  <KeyboardTimePicker
                    label="Start time"
                    mask="__:__ _M"
                    inputVariant="outlined"
                    value={startTime}
                    InputAdornmentProps={{ position: "start" }}
                    minutesStep={30}
                    onChange={(date) => date && setStartTime(date)}
                    margin="normal"
                    fullWidth
                  />
                  <KeyboardTimePicker
                    label="End time"
                    mask="__:__ _M"
                    inputVariant="outlined"
                    value={endTime}
                    InputAdornmentProps={{ position: "start" }}
                    minutesStep={30}
                    onChange={(date) => date && setEndTime(date)}
                    margin="normal"
                    fullWidth
                  />
                  <FormHelperText>
                    Usage data is only available in 30 minute increments.
                  </FormHelperText>
                </FormControl>
              </Grid>
            </Grid>
            <Box marginTop={2}>
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
            </Box>
          </Paper>
        </Grid>
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h6" className={classes.heading}>
              <PowerIcon />
              Electricity usage
            </Typography>
            {isProcessing && <CircularProgress />}
            {!isProcessing && (
              <>
                {usageData && wfhUsage > 0 && (
                  <Box m={4} textAlign="center">
                    <Box fontSize={28} color="primary.main">
                      {Math.round(wfhUsage * 1000) / 1000} kWh
                    </Box>
                    <Box color="text.secondary">
                      / {wfhDays} work days = ~
                      {Math.round((wfhUsage / wfhDays) * 1000) / 1000} kWh per
                      work day
                    </Box>
                  </Box>
                )}
                {usageData && wfhUsage === 0 && (
                  <Box m={4} textAlign="center" color="text.secondary">
                    <Box fontSize={20}>No electricity usage</Box>
                    Check if your usage data and schedule are correct
                  </Box>
                )}
                {!usageData && (
                  <Box m={4} textAlign="center" color="text.secondary">
                    Select data to calculate usage
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h6" className={classes.heading}>
              <MonetizationOnIcon />
              Electricity cost
            </Typography>
            {isProcessing && <CircularProgress />}
            {!isProcessing && (
              <>
                {usageData && wfhUsage > 0 && (
                  <>
                    <Grid container spacing={1}>
                      <Grid item sm={6}>
                        <TextField
                          label="Cost per kWh"
                          variant="outlined"
                          margin="normal"
                          type="number"
                          value={costPerKwh}
                          onChange={(input) =>
                            setCostPerKwh(parseFloat(input.currentTarget.value))
                          }
                          fullWidth
                        />
                        <FormHelperText>
                          This tool only supports single-rate flat pricing.
                        </FormHelperText>
                      </Grid>
                      <Grid item sm={6}>
                        <TextField
                          label="Apportion of costs"
                          variant="outlined"
                          margin="normal"
                          type="number"
                          value={percentageUsage}
                          onChange={(input) =>
                            setPercentageUsage(
                              Math.min(parseInt(input.currentTarget.value), 100)
                            )
                          }
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">%</InputAdornment>
                            ),
                          }}
                          inputProps={{
                            max: 100,
                          }}
                          fullWidth
                        />
                        <FormHelperText>
                          Refer to{" "}
                          <a
                            href="https://www.ato.gov.au/individuals/income-and-deductions/deductions-you-can-claim/home-office-expenses/#:~:text=You%20must%20take%20into%20account%20other%20members%20of%20your%20household%20when%20you%20work%20out%20your%20expenses.%20If%20a%20member%20of%20your%20household%20is%20using%20the%20same%20area%20of%20the%20house%20or%20the%20same%20service%20when%20you're%20working,%20you%20must%20apportion%20your%20expenses%20accordingly."
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ATO guidance
                          </a>{" "}
                          on how to splits costs in a household.
                        </FormHelperText>
                      </Grid>
                    </Grid>

                    <Box m={4} textAlign="center">
                      <Box fontSize={28} color="primary.main">
                        $
                        {Math.round(
                          wfhUsage * costPerKwh * (percentageUsage / 100) * 100
                        ) / 100}
                      </Box>
                      <Box color="text.secondary">
                        / {wfhDays} work days = ~$
                        {Math.round(
                          ((wfhUsage * costPerKwh * (percentageUsage / 100)) /
                            wfhDays) *
                            1000
                        ) / 1000}{" "}
                        per work day
                      </Box>
                    </Box>
                  </>
                )}
                {usageData && wfhUsage === 0 && (
                  <Box m={4} textAlign="center" color="text.secondary">
                    <Box fontSize={20}>No electricity usage</Box>
                    Check if your usage data and schedule are correct
                  </Box>
                )}
                {!usageData && (
                  <Box m={4} textAlign="center" color="text.secondary">
                    Select data to calculate usage
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
