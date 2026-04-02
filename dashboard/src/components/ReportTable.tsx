import { useEffect, useState } from "react";
import { getReports } from "../api";
import "./ReportTable.css";

export default function ReportTable() {
  const [reports, setReports] = useState<any[]>([]);

  async function load() {
    const data = await getReports();
    console.log("REPORT DATA:", data);
    setReports(data);
  }

  useEffect(() => {
    load();

    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, []);

  const latestReports = Object.values(
    reports.reduce((acc: any, curr: any) => {
      if (!acc[curr.type]) {
        acc[curr.type] = curr; // keep first (latest)
      }
      return acc;
    }, {}),
  );

  function convertToCSV(data: any[]) {
    const headers = ["type", "processingTime", "totalJobs"];

    const rows = data.map((row) =>
      [row.type, row.processingTime, row.totalJobs].join(","),
    );

    return [headers.join(","), ...rows].join("\n");
  }

  function downloadCSV() {
    const csv = convertToCSV(latestReports);

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics_report.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  function copyJSON() {
    navigator.clipboard.writeText(JSON.stringify(latestReports, null, 2));
    console.log("Copied JSON!");
  }

  function copyCSV() {
    const csv = convertToCSV(latestReports);
    navigator.clipboard.writeText(csv);
  }

  return (
    <div className="card">
      <h2>Analytics Report</h2>

      {latestReports.length === 0 && <p>No reports yet</p>}

      <div className="report-table">
        {latestReports.map((r: any, i) => (
          <div key={i} className="report-row">
            <span className="type">{r.type}</span>
            <span className="time">{r.processingTime}</span>
            <span className="jobs">{r.totalJobs}</span>
          </div>
        ))}
      </div>

      <div className="report-actions">
        <button onClick={downloadCSV}>Download CSV</button>
        <button onClick={copyJSON}>Copy JSON</button>
        <button onClick={copyCSV}>Copy CSV</button>
      </div>
    </div>
  );
}
