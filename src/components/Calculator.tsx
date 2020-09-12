import { Button, Container, makeStyles, Typography } from "@material-ui/core";
import React from "react";
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
  const classes = useStyles();

  const onFilesAdded = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files?.length !== 1) {
      return;
    }

    const file = files.item(0);

    if (!file) {
      return;
    }

    try {
      const usageData = await parseCsv(file);

      // filter usage data by consumption
      const consumptionData = usageData.filter(
        (x) =>
          x.date >= new Date("2020/01/01") &&
          x.date <= new Date("2020/09/12") &&
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

      debugger;

      // clear file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {}
  };

  const upload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Container component="main" maxWidth="xs">
      <div className={classes.paper}>
        <Typography variant="h5" component="h1">
          ATO home office Victorian Energy Compare Data electricity calculator
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
      </div>
    </Container>
  );
};
