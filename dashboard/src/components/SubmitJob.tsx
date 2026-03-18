import { useState } from "react";
import { submitJob } from "../api";
import "./SubmitJob.css";

const JOB_TYPES = [
  "send_email",
  "generate_report",
  "resize_image",
  "send_notification",
];

interface Props {
  onSubmitted: () => void;
}

export default function SubmitJob({ onSubmitted }: Props) {
  const [type, setType] = useState("send_email");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const payload =
        type === "send_email" ? { to, subject, body } : { reportId: "q4-2026" };

      const delayMs = delay ? parseInt(delay) * 1000 : undefined;
      const res = await submitJob(type, payload, delayMs);
      setResult(`Job submitted — ID: ${res.jobId}`);
      onSubmitted();
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to submit job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Submit Job</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="field">
          <label>Job type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {type === "send_email" && (
          <>
            <div className="field">
              <label>To</label>
              <input
                type="email"
                placeholder="recipient@gmail.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Subject</label>
              <input
                type="text"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Body</label>
              <textarea
                placeholder="Email body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
            </div>
          </>
        )}

        <div className="field">
          <label>Delay (seconds) — optional</label>
          <input
            type="number"
            placeholder="0"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            min="0"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? "Submitting..." : "Submit Job"}
        </button>

        {result && <p className="msg-success">{result}</p>}
        {error && <p className="msg-error">{error}</p>}
      </form>
    </div>
  );
}
