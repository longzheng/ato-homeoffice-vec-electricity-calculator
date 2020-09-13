import React from "react";
import CssBaseline from "@material-ui/core/CssBaseline";
import { Upload } from "./components/Calculator";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";

function App() {
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <React.Fragment>
        <CssBaseline />
        <Upload />
      </React.Fragment>
    </MuiPickersUtilsProvider>
  );
}

export default App;
