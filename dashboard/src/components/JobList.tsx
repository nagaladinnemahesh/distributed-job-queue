import { useEffect, useState } from "react";
import { listJobs, retryJob } from "../api";
import "./JobList.css";

const STATUS_FILTERS = [
  "ALL",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "DEAD",
  "SCHEDULED",
];

interface Job {
  jobId: string;
  type: string;
  status: string;
  attempts: number;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

interface Props {
  refresh: number;
}

export default function JobList({ refresh }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);

  async function load() {
    setLoading(true);
    try {
      const status = filter === "ALL" ? undefined : filter;
      const data = await listJobs(status);
      setJobs(data.jobs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [filter, refresh]);

  async function handleRetry(jobId: string) {
    await retryJob(jobId);
    load();
  }

  return (
    <div className="card job-card">
      <div className="list-header">
        <h2>Jobs {loading && <span className="loading-dot" />}</h2>
        <div className="filters">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {jobs.length === 0 && <p className="empty">No jobs found</p>}

      <div className="job-table job-list">
        {jobs.map((job) => (
          <div
            key={job.jobId}
            className={`job-row ${selected?.jobId === job.jobId ? "selected" : ""}`}
            onClick={() =>
              setSelected(selected?.jobId === job.jobId ? null : job)
            }
          >
            <div className="job-main">
              <span className="job-type">{job.type}</span>
              <span
                className={`status-badge status-${job.status.toLowerCase()}`}
              >
                {job.status}
              </span>
            </div>
            <div className="job-meta">
              <span className="job-id">{job.jobId.slice(0, 8)}...</span>
              <span className="job-time">
                {new Date(job.createdAt).toLocaleTimeString()}
              </span>
            </div>

            {selected?.jobId === job.jobId && (
              <div className="job-detail">
                <div className="detail-row">
                  <span>ID</span>
                  <span>{job.jobId}</span>
                </div>
                <div className="detail-row">
                  <span>Attempts</span>
                  <span>{job.attempts}</span>
                </div>
                {job.completedAt && (
                  <div className="detail-row">
                    <span>Completed</span>
                    <span>
                      {new Date(job.completedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {job.errorMessage && (
                  <div className="detail-row error">
                    <span>Error</span>
                    <span>{job.errorMessage}</span>
                  </div>
                )}
                {job.status === "DEAD" && (
                  <button
                    className="btn-retry"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(job.jobId);
                    }}
                  >
                    Retry Job
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
