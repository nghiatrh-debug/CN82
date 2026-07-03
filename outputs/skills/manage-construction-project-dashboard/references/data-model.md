# Project Control Data Model

## Core Entities

| Entity | Required fields |
|---|---|
| Project | code, name, timezone, client, consultant, contractor |
| Document | id, name, path/url, type, revision, report_date, modified_at, approval_status |
| ProgressSnapshot | cut_off, plan_percent, actual_percent, delay_days, source_id |
| WorkItem | wbs, zone, name, baseline_start, baseline_finish, actual_percent, owner |
| MeetingAction | id, description, owner, due_date, status, source_id, evidence |
| MonitoringReading | point, cycle, date, value, unit, approved_threshold, status, source_id |
| Submission | code, type, revision, submitted_at, status, review_round, aging_days |
| CostSnapshot | contract_value, certified, paid, variation, forecast, EAC, source_id |
| Verification | entity_id, field, state, confidence, checked_by, checked_at, note |

## Verification States

- `extracted`: parsed or OCR-derived; not yet relied upon.
- `checked`: compared with the source by an authorized reviewer.
- `approved`: matches an approved document or signed record.
- `missing`: required input is unavailable.
- `conflict`: sources disagree; show both and escalate.

## Snapshot Rules

- Store reporting cut-off and extraction time separately.
- Keep old snapshots when a file is revised.
- Identify duplicate content with file hash when possible.
- Keep the authoritative source path on every executive KPI.
- Use `null`, not zero, for missing values.
