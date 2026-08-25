# Cheque Book & Additional Workflows — Change Log

**Date:** 2026-07-30  
**Scope:** Seed Cheque Book + enable all previously commented workflows for frontend (org 14).

---

## Org 14 workflows now in DB (14 total)

| Code | Name | Phases / Subs |
|------|------|---------------|
| WF-LOAN-CREDIT | Loan Origination & Credit Approval | 21 / 21 |
| WF-CHEQUE-BOOK | Cheque Book Request & Issuance | 12 / 12 |
| WF-CARD-DISPATCH | Card Issuance & Dispatch Process | 6 / 6 |
| WF-DIG-CUST-ONB | Digital Customer Onboarding & KYC | 22 / 22 |
| WF-CUST-ONB | Customer Onboarding Workflow | 7 / 7 |
| WF-CIF-CRE | CIF Creation Workflow | 3 / 3 |
| WF-EKYC-001 | eKYC Verification Workflow | 5 / 5 |
| WF-SAV-OPEN | Savings Account Opening | 5 / 5 |
| WF-CUR-OPEN | Current Account Opening | 5 / 5 |
| WF-UPI-REG | UPI Registration | 5 / 5 |
| WF-FT-PROC | Fund Transfer Processing | 5 / 5 |
| WF-LOAN-ORG | Loan Origination Workflow | 6 / 6 |
| WF-CC-ISS | Credit Card Issuance | 7 / 7 |
| WF-AML-MON | AML Transaction Monitoring | 5 / 5 |

---

## Key files

| File | Change |
|------|--------|
| `workflow/additional_workflows_seed.sql` | **Created** — enables all previously commented workflows/phases/subs (org 14, idempotent) |
| `workflow/cheque_book_workflow.sql` | Cheque Book incremental seed |
| `workflow/automation_workflows.sql` | Workflows active with `organization_id = 14` (comments removed) |
| `workflow/workflow_phases .sql` | Loan + Cheque Book phases; others via additional seed |
| `workflow/sub_workflows.sql` | Cheque Book + Loan first row; rest via additional seed |
| `app/db/seed.py` | `INCREMENTAL_SQL_FILES` includes cheque book + additional workflows |
| `automation/models.py` | `human_role` → VARCHAR(255) |
| FE `CreateWorkFlow.jsx` | Removed static Cheque Book preset |

---

## How to see on frontend

1. Backend reloads / seed runs on startup.
2. Open **Workflow Config** for organization **14** (Ujjivan).
3. API: `GET /workflows/workflow/14` → 14 workflows with processes.
