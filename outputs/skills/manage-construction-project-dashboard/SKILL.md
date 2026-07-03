---
name: manage-construction-project-dashboard
description: Build, update, validate, and operationalize owner-side construction project management dashboards from Google Drive or synchronized project folders. Use when Codex must inspect daily/weekly/monthly reports, meeting minutes, approved schedules or MPP/PDF baselines, monitoring reports, submissions, HSE/quality records, and payment data; extract traceable KPIs; create a three-week lookahead; assess schedule, quality, safety, cost, and document risks; deploy a management website; or configure recurring dashboard updates for another construction project.
---

# Construction Project Dashboard

Create an owner-side project control system from live project documents. Keep every KPI traceable to a source file, separate extracted values from approved values, and never invent missing data.

## Core Workflow

1. Establish project context.
   - Identify project code, source root, client, consultant, main contractor, timezone, dashboard output, and reporting cut-off.
   - Copy `assets/project-config.example.json` and fill it for the project.
2. Inventory the source.
   - Run `scripts/inventory_project.py`.
   - Classify reports, meeting minutes, approved schedules, monitoring, submissions, quality/HSE, and commercial records.
3. Confirm authoritative sources.
   - Prefer files explicitly marked approved, SPM-approved, consultant-checked, baseline, contract schedule, or latest approved revision.
   - Use approved PDF as the approval record. Use matching MPP/XLSX for structured schedule extraction when available.
4. Extract and verify.
   - Use PDF, spreadsheet, and presentation/document skills for their file types.
   - Use `scripts/extract_schedule_tasks.py` for text-based approved schedule PDFs.
   - Render scanned PDFs and inspect pages. Do not treat OCR as approved data.
5. Build the management model.
   - Read `references/data-model.md`.
   - Populate progress, zones, actions, monitoring, documents, cost, and three-week lookahead.
   - Mark each record as extracted, checked, approved, or missing.
6. Create or update the dashboard.
   - Run `scripts/scaffold_dashboard.py` for a new project.
   - Adapt `assets/dashboard-template/`; remove all sample-project values and narratives.
   - Keep the first screen operational: health, schedule variance, urgent decisions, monitoring, actions, and three-week milestones.
7. Validate.
   - Run `scripts/validate_dashboard.py`.
   - Start the server and test HTTP responses.
   - Use the browser skill for desktop/mobile visual QA when local navigation is permitted.
8. Operationalize.
   - Read `references/deployment-and-automation.md`.
   - Use app automations for scheduled document review and dashboard updates.
   - For executive access, require HTTPS, authentication, role-based access, backups, and audit logs.

## Source Rules

- Use the newest document by reporting date, not only file modification time.
- Record exact source path, revision, approval status, reporting date, and extraction date.
- Do not silently replace historical snapshots.
- Do not classify a monitoring value as safe or unsafe without the approved threshold.
- Do not publish cost forecasts without contract, payment, variation, and forecast inputs.
- Compare actual reports with the approved baseline; do not rewrite the baseline to hide delay.

## Three-Week Lookahead

Use the reporting cut-off as day zero. Include tasks intersecting the next 21 calendar days:

- tasks already late but required to unlock the period;
- tasks starting or finishing in the period;
- mandatory milestones and handoffs;
- enabling documents, materials, inspections, access, and temporary works;
- targets by week, zone, responsible party, predecessor, and evidence of completion.

Read `references/schedule-and-lookahead.md` before extracting or interpreting schedule tasks.

## Dashboard Requirements

- Prefer restrained, information-dense operational UI.
- Provide views for overview, progress, meeting actions, monitoring, and three-week lookahead.
- Add cost/quality/HSE views only when source data supports them.
- Each alert must state issue, impact, owner, deadline, source, and recommended management action.
- Each KPI must show cut-off date and source status.
- Keep drill-down paths to source documents.

## Resources

- `scripts/inventory_project.py`: inventory and candidate-source discovery.
- `scripts/extract_schedule_tasks.py`: date-window extraction from text-based schedule PDFs.
- `scripts/scaffold_dashboard.py`: copy and parameterize the dashboard template.
- `scripts/validate_dashboard.py`: validate files, placeholders, JavaScript syntax, and HTTP assets.
- `references/data-model.md`: reusable project-control schema and verification states.
- `references/construction-kpis.md`: KPI definitions and owner-side interpretation.
- `references/schedule-and-lookahead.md`: baseline selection and 21-day lookahead method.
- `references/deployment-and-automation.md`: internal deployment, production security, and recurring updates.
- `assets/dashboard-template/`: functional reference implementation; customize all sample content.
- `assets/project-config.example.json`: project configuration example.
