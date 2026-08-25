Yes. **Agent #5 — Exception Management** should be upgraded in the same way as Agents #1–#4.

Your current code is only a **stub**. It basically says:

```text
discrepancy exists
      ↓
assume HITL
      ↓
open exception
```

The biggest problem is this:

```python
discrepancies = payload.get("discrepancies") or ["document_discrepancy"]
```

If there are **no discrepancies**, it invents one.

Also, it doesn't validate the input, doesn't classify exceptions, doesn't generate reason codes, and doesn't have a deterministic decision engine.

## What Agent #5 should actually do

Keep the scope:

> **Exception Management Agent = receive an exception/discrepancy from the workflow → validate it → classify it → determine severity → route it → create/prepare HITL decision → LLM only summarizes.**

It should **not** perform Document Intelligence again, Trade Risk again, etc.

The workflow connects Agents #1–#4 to Agent #5.

```text
Agent #1 ──┐
Agent #2 ──┤
Agent #3 ──┼──→ Workflow ──→ Agent #5
Agent #4 ──┘
                         Exception Management
```

---

# 1. Create a package

Follow exactly the pattern you used for the previous agents:

```text
reusable/
└── exception_management/
    ├── __init__.py
    ├── constants.py
    ├── schemas.py
    └── rules.py
```

And keep:

```text
reusable/exception_management_agent.py
```

as the stable factory path.

---

# 2. `constants.py`

Define controlled vocabularies.

For example:

```text
Exception types:
- document_discrepancy
- compliance_exception
- trade_risk_exception
- lc_processing_exception
- operational_exception
- unknown

Severity:
- low
- medium
- high
- critical

Statuses:
- open
- pending
- resolved
- rejected
- unknown
```

And agent functions:

```text
Detect Exception
Classify Exception
Assess Exception Severity
Generate Exception Reason Codes
Exception Decision Routing
HITL Escalation
```

The exact names can be adjusted to your DB naming conventions, but keep them deterministic.

---

# 3. `schemas.py`

Create structured input/output just like Agent #1 and #4.

### Input

Something like:

```text
ExceptionManagementInput

customer_id
lc_request_id
exception_case_id
source_agent
source_process
exception_type
severity
discrepancies
reason_codes
```

The important point is:

**Don't require Agent #5 to call another agent to obtain this information.**

The workflow passes it in.

Example:

```json
{
  "customer_id": "CUST001",
  "lc_request_id": "LC001",
  "source_agent": "Document Intelligence Agent",
  "source_process": "P13",
  "exception_type": "document_discrepancy",
  "discrepancies": [
    "Invoice amount does not match LC amount"
  ]
}
```

---

# 4. `rules.py` — the most important part

Create:

```python
validate_input()
```

and:

```python
evaluate_exception()
```

The rules should determine the final result.

For example:

### Valid exception

```text
discrepancy exists
      ↓
exception detected
      ↓
classify
      ↓
severity
      ↓
HITL
```

Output:

```text
status = hitl_wait
recommendation = human_review
requires_human_approval = true
```

---

# 5. Don't invent discrepancies

This is the biggest change from your current code.

### Current

```python
discrepancies = payload.get("discrepancies") or ["document_discrepancy"]
```

❌ Remove this behavior.

If:

```json
{
  "discrepancies": []
}
```

then Agent #5 should **not manufacture**:

```text
document_discrepancy
```

Instead, depending on your locked contract:

```text
MISSING_EXCEPTION_DETAILS
```

or:

```text
NO_EXCEPTION
```

But you need one deterministic policy.

For an Exception Management agent, I recommend:

```text
missing exception details → failed
empty discrepancies        → failed
```

because Agent #5 should only run when an actual exception exists.

---

# 6. Exception classification

Agent #5 should identify where the exception came from.

Example:

```text
Agent #1
   ↓
AML_HIT
   ↓
Agent #5
   ↓
compliance_exception
```

Or:

```text
Agent #4
   ↓
DOCUMENT_VALUE_MISMATCH
   ↓
Agent #5
   ↓
document_discrepancy
```

Or:

```text
Agent #3
   ↓
SWIFT_NOT_READY
   ↓
Agent #5
   ↓
lc_processing_exception
```

Notice:

**Agent #5 does not re-run those checks.**

It only manages the exception.

---

# 7. Severity

You should add deterministic severity.

For example:

```text
SANCTIONS_HIT
      ↓
critical/high

AML_HIT
      ↓
high

DOCUMENT_VALUE_MISMATCH
      ↓
medium/high

DOCUMENT_PENDING
      ↓
medium

operational delay
      ↓
low/medium
```

The exact mapping should be defined in `constants.py`.

Don't let the LLM decide severity.

---

# 8. Reason codes

Agent #5 should preserve the original reason code.

For example:

```text
Agent #4
DOCUMENT_VALUE_MISMATCH
       ↓
Agent #5
       ↓
reason_codes:
[
    "DOCUMENT_VALUE_MISMATCH"
]
```

It can additionally add an exception-management reason code if needed.

Example:

```text
EXCEPTION_CREATED
DOCUMENT_VALUE_MISMATCH
```

This is useful for audit trails.

---

# 9. Decision contract

I recommend this structure:

| Condition                         | Status      | Recommendation |
| --------------------------------- | ----------- | -------------- |
| Valid exception                   | `hitl_wait` | `human_review` |
| High/Critical exception           | `hitl_wait` | `human_review` |
| Pending exception information     | `hitl_wait` | `human_review` |
| Missing required exception input  | `failed`    | `reject`       |
| No discrepancy/exception supplied | `failed`    | `reject`       |
| Invalid exception type            | `failed`    | `reject`       |

The important distinction:

```text
Exception exists
      ↓
HITL
```

but:

```text
Exception information missing
      ↓
FAILED
```

---

# 10. LLM protection

Same architecture as Agents #1–#4:

```text
Input
  ↓
Deterministic rules
  ↓
FINAL exception decision
  ↓
LLM summary
```

The LLM can say:

> "The invoice amount differs from the LC amount and requires human review."

But it cannot change:

```text
hitl_wait
```

to:

```text
completed
```

So after:

```python
enrich_with_llm_summary()
```

re-apply the deterministic fields.

---

# 11. `development_mock_payload()`

Mocks should be created **only in the orchestrator**, as you did with Agents #1–#4.

The agent itself should fail if you directly call:

```json
{}
```

Don't put:

```python
payload.setdefault(...)
```

inside the agent to hide missing data.

For Test Run, the orchestrator can generate:

```json
{
  "customer_id": "CUST001",
  "lc_request_id": "LC001",
  "source_agent": "Document Intelligence Agent",
  "source_process": "P13",
  "exception_type": "document_discrepancy",
  "discrepancies": [
    "Invoice amount does not match LC amount"
  ],
  "reason_codes": [
    "DOCUMENT_VALUE_MISMATCH"
  ]
}
```

Then Agent #5 evaluates that.

---

# 12. Tests you should have

At minimum:

```text
1. Valid document discrepancy
   → hitl_wait / human_review

2. Valid compliance exception
   → hitl_wait

3. Valid LC processing exception
   → hitl_wait

4. Missing discrepancies
   → failed / MISSING_*

5. Empty input
   → failed / MISSING_*

6. Invalid exception type
   → failed / INVALID_EXCEPTION_TYPE

7. High severity
   → hitl_wait

8. Critical severity
   → hitl_wait

9. Reason codes preserved
   → original reason codes remain

10. LLM cannot change HITL
    → still hitl_wait

11. No fake discrepancy generated
    → empty input does NOT become document_discrepancy

12. Agent runs independently
    → no Agent #1–#4 imports
```

---

# 13. End-to-end tests

You already tested:

```text
#1 → #2 → #3 → #4
```

Now add:

### Clear workflow

```text
#1
 ↓
#2
 ↓
#3
 ↓
#4
 ↓
No exception
 ↓
Agent #5 should NOT unnecessarily create an exception
```

### Exception workflow

```text
#1 → completed
       ↓
#2 → completed
       ↓
#3 → completed
       ↓
#4 → hitl_wait
       ↓
Exception generated
       ↓
#5
       ↓
hitl_wait / human_review
```

And also test an exception originating from another stage:

```text
Agent #3
SWIFT_NOT_READY
      ↓
Agent #5
      ↓
exception_type = lc_processing_exception
      ↓
hitl_wait
```

---

# 14. What your final Agent #5 architecture should look like

```text
                 Agent #5
            Exception Management
                     │
                     ▼
              Validate Input
                     │
                     ▼
           Detect/Read Exception
                     │
                     ▼
          Classify Exception
                     │
                     ▼
           Assess Severity
                     │
                     ▼
          Generate Reason Codes
                     │
                     ▼
             Decision Engine
                /          \
               /            \
         HITL_WAIT          FAILED
        human_review         reject
               \              /
                └──────┬──────┘
                       ▼
                 LLM Summary
               explanation only
                       ▼
                  AgentResult
```

## Most important difference from your current code

Your current Agent #5 is essentially:

```text
anything
  ↓
assume discrepancy
  ↓
HITL
```

You want:

```text
Validate
   ↓
Is there a real exception?
   ↓
Classify it
   ↓
Determine severity
   ↓
Generate reason codes
   ↓
Deterministic HITL / FAILED decision
   ↓
LLM explanation only
```

So **don't just modify the existing `execute()` method**. Build Agent #5 as a proper reusable package like Agents #1–#4:

```text
exception_management/
├── constants.py
├── schemas.py
├── rules.py
└── __init__.py

exception_management_agent.py
```

That will keep your **Agents #1–#5 architecture consistent, reusable, independently executable, and auditable**.
