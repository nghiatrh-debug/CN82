# Deployment and Automation

## Internal Demonstration

- Serve the static dashboard on a local or LAN web server.
- Bind to `0.0.0.0` only when LAN access is intended.
- Confirm firewall and corporate network policy.

## Production

Require:

- HTTPS and corporate domain;
- SSO or authenticated reverse proxy;
- role-based access;
- database snapshots and backups;
- audit logs;
- Drive/API credentials with least privilege;
- separate test and production environments.

Do not expose synchronized local Drive paths directly to public users.

## Recurring Updates

Create an app cron automation with:

- project workspace as `cwd`;
- local execution when synchronized Drive access is required;
- explicit timezone and weekly wall-clock schedule;
- prompt covering source scan, extraction, verification, dashboard update, validation, and concise change report.

Prefer updating an existing matching automation over creating a duplicate.

## Update Run Output

Report:

1. newly detected sources;
2. KPI changes;
3. overdue/milestone alerts;
4. dashboard files changed;
5. validation result;
6. missing or conflicting data.
