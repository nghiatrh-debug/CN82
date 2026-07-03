# Schedule and Three-Week Lookahead

## Select the Baseline

1. Search contract/schedule and approved-submission folders.
2. Prefer the highest approved revision with an approval workflow or signed status.
3. Match approved PDF to MPP/XLSX by revision and schedule date.
4. Record approval date separately from schedule data date.
5. If multiple approved schedules conflict, stop and report the conflict.

## Extract Tasks

For the 21-day window, include tasks where:

```text
baseline_start <= window_end
and baseline_finish >= window_start
```

Also include unfinished predecessors whose baseline finish is before the cut-off.

Capture:

- WBS/ID and task name;
- zone/discipline;
- baseline start and finish;
- predecessors and milestones;
- actual status from latest daily/weekly reports;
- responsible contractor;
- required submissions, materials, inspections, or access.

## Weekly Targets

- Week 1: remove constraints and restore sequence.
- Week 2: close mandatory milestones and handoffs.
- Week 3: stabilize production and protect the next critical milestone.

Targets must be measurable: percent, quantity, elevation, accepted inspection, approved submission, delivered material, or signed handover.

## Delay Assessment

Do not infer a new contractual completion date from daily percentages alone. State:

- baseline date;
- actual status and cut-off;
- immediate risk;
- recovery requirement;
- evidence needed to close the issue.
