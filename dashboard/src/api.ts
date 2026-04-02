import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
});

export async function submitJob(type: string, payload: object, delay?: number) {
  const res = await api.post("/jobs", { type, payload, delay });
  return res.data;
}

export async function listJobs(status?: string, type?: string) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (type) params.append("type", type);
  const res = await api.get(`/jobs?${params}`);
  return res.data;
}

export async function getJob(id: string) {
  const res = await api.get(`/jobs/${id}`);
  return res.data;
}

export async function retryJob(id: string) {
  const res = await api.post(`/jobs/${id}/retry`, {});
  return res.data;
}

export async function getMetrics() {
  const res = await api.get("/metrics");
  return res.data;
}

export async function getReports() {
  const res = await api.get("/reports");
  return res.data;
}
