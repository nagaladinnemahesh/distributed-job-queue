import pandas as pd
import sys
import json 

#read data from node
data = json.loads(sys.argv[1])

if not data:
    print("No data received")
    sys.exit(0)

df = pd.DataFrame(data)

#convert time stamps
df["startedAt"] = pd.to_datetime(df["startedAt"])
df["completedAt"] = pd.to_datetime(df["completedAt"])

#create processing time column
df["processing_time_sec"] = (
    df["completedAt"] - df["startedAt"]
).dt.total_seconds()

#Aggregation
report = df.groupby("type").agg({
    "processing_time_sec": "mean",
    "id": "count"
}).rename(columns={"id": "total_jobs"})

# Round numeric
report["processing_time_sec"] = report["processing_time_sec"].round(2)

# Sort using numeric (correct way)
report = report.sort_values(by="processing_time_sec", ascending=False)

# Create readable column
report["processing_time"] = report["processing_time_sec"].astype(str) + " sec"

# Reset index
report = report.reset_index()

# Select clean columns
report = report[["type", "processing_time", "total_jobs"]]
report = report.sort_values(by="processing_time", ascending=False)
#save csv
file_path = "job_report.csv"
report.to_csv(file_path, index=False)

# print(file_path)
print(report.to_json(orient="records"))