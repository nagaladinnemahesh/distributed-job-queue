import { useState } from "react";
import SubmitJob from "./components/SubmitJob";
import JobList from "./components/JobList";
import Metrics from "./components/Metrics";
import "./App.css";

export default function App() {
  const [refresh, setRefresh] = useState(0);

  function onJobSubmitted() {
    setRefresh((r) => r + 1);
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Distributed Job Queue</h1>
        <p>Real-time job processing dashboard</p>
      </header>
      <main className="main">
        <div className="left">
          <SubmitJob onSubmitted={onJobSubmitted} />
          <Metrics refresh={refresh} />
        </div>
        <div className="right">
          <JobList refresh={refresh} />
        </div>
      </main>
    </div>
  );
}
