import { useEffect, useState } from "react";
import { getMetrics } from "../api";
import "./Metrics.css";

interface Props {
  refresh: number;
}

export default function Metrics({ refresh }: Props) {
  const [metrics, setMetrics] = useState<any>(null);

  async function load() {
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!metrics) return null;

  return (
    <div className="card">
      <h2>Metrics</h2>
      <div className="metrics-grid">
        <div className="metric">
          <span className="metric-value">
            {metrics.database.totalCompleted}
          </span>
          <span className="metric-label">Completed</span>
        </div>
        <div className="metric">
          <span className="metric-value">{metrics.database.totalDead}</span>
          <span className="metric-label">Dead</span>
        </div>
        <div className="metric">
          <span className="metric-value">{metrics.database.successRate}</span>
          <span className="metric-label">Success rate</span>
        </div>
        <div className="metric">
          <span className="metric-value">
            {metrics.database.avgProcessingMs}ms
          </span>
          <span className="metric-label">Avg time</span>
        </div>
        <div className="metric">
          <span className="metric-value">{metrics.queue.waiting}</span>
          <span className="metric-label">Waiting</span>
        </div>
        <div className="metric">
          <span className="metric-value">{metrics.queue.active}</span>
          <span className="metric-label">Active</span>
        </div>
      </div>
    </div>
  );
}
