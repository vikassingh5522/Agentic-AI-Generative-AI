Yes. Now I understand the architecture decision you are making.

You previously built **6 LC functional agents**, and the important principle is that those agents are intended to be **reusable business capabilities**, not agents hard-wired to only one workflow.

For the **Cheque Book Request & Issuance** workflow, we now want to build:

**Customer & Risk Agent — P01 to P07**

The PDF establishes those seven phases and associates them with the Customer & Risk Agent. 

I would therefore **not design this as a "Cheque Book Agent."** I would design it as a generic **Customer & Risk Decisioning Agent** whose cheque-book behavior comes from workflow context and bank policy.

## Customer & Risk Agent — reusable functionality

### Core functional capabilities

| #  | Functionality                                    | P01–P07 |
| -- | ------------------------------------------------ | ------- |
| 1  | **Request Intake & Normalization**               | P01     |
| 2  | **Customer Identity Validation**                 | P02     |
| 3  | **Customer–Account Relationship Validation**     | P02/P04 |
| 4  | **KYC Status Validation**                        | P03     |
| 5  | **Customer Data Consistency Check**              | P02/P03 |
| 6  | **Account Status Validation**                    | P04     |
| 7  | **Account Restriction / Hold Check**             | P04     |
| 8  | **Existing Request / Duplicate Detection**       | P04/P05 |
| 9  | **Product / Service Eligibility Evaluation**     | P05     |
| 10 | **Policy / Business Rule Evaluation**            | P05     |
| 11 | **Customer Risk Assessment**                     | P06     |
| 12 | **Risk Classification**                          | P06     |
| 13 | **Exception Detection**                          | P01–P06 |
| 14 | **Decision / Approval Evaluation**               | P07     |
| 15 | **HITL Determination**                           | P06/P07 |
| 16 | **Decision Reason / Reason Codes**               | P07     |
| 17 | **Evidence Collection**                          | P01–P07 |
| 18 | **Unknown / Pending Handling**                   | P01–P07 |
| 19 | **Idempotency / Duplicate Execution Protection** | P01–P07 |
| 20 | **Audit / Decision Trace**                       | P01–P07 |

That is the **functional boundary I would use**.

---

# 1. Request Intake & Normalization

This should be generic.

The agent receives something like:

```text
customer_id
account_id
request_id
request_type
channel
requested_product
requested_quantity
delivery/preference data
metadata
```

It should:

* validate schema
* validate required fields
* normalize identifiers
* normalize request type
* create/propagate correlation ID
* detect malformed input
* preserve original input
* create a normalized customer/request context

For cheque book, the request might contain account number, number of leaves and delivery point. Real banking implementations expose these kinds of inputs. ([Federal Bank][1])

But the agent should **not contain code like**:

```python
if request_type == "CHEQUE_BOOK":
```

as its fundamental architecture.

Instead:

```text
workflow context
       ↓
policy/configuration
       ↓
Customer & Risk Agent
```

That is what makes it reusable.

---

# 2. Customer Identity Validation

The agent should be capable of:

* customer existence validation
* customer ID validation
* name consistency check
* DOB/customer attribute consistency
* registered contact consistency
* customer status validation
* customer-account ownership validation
* customer type/segment validation
* joint-holder identification
* authorized-person/mandate validation where applicable

For example, a current HDFC cheque-book flow requires an active account and identity verification, and joint accounts may require other-holder approval. ([Xpress Forms][2])

This capability can later be reused for:

```text
Cheque Book
Account Service Request
Debit Card
Loan
FD
Address Change
Profile Change
Other banking workflows
```

---

# 3. Customer–Account Relationship Validation

This deserves its own capability.

The agent should answer:

```text
Does this customer actually have authority
to request this service for this account?
```

Check:

* primary holder
* joint holder
* authorized signatory
* mandate holder
* account ownership
* customer/account relationship
* authorization status

This is especially important because the workflow must not simply trust:

```text
customer_id + account_id
```

from the request.

---

# 4. KYC Validation

The reusable capability should support:

```text
KYC_STATUS
KYC_COMPLETENESS
KYC_VALIDITY
RE_KYC_STATUS
IDENTITY_MATCH
KYC_EXCEPTION
```

Possible result:

```text
PASS
FAIL
PENDING
UNKNOWN
```

RBI's KYC framework includes customer identification, customer due diligence and risk-based categorisation. ([Reserve Bank of India][3])

The important reusable-agent rule:

**The agent does not invent KYC.**

It consumes authoritative KYC information from the configured KYC/CBS system.

---

# 5. Customer Data Consistency Check

Compare information from multiple sources:

```text
CRM
   ↕
CBS
   ↕
KYC
   ↕
Request
```

Example:

```text
Request customer name
        vs
CBS customer name
        vs
KYC customer name
```

Result:

```text
MATCH
MISMATCH
PARTIAL_MATCH
UNKNOWN
```

This is highly reusable across banking workflows.

---

# 6. Account Status Validation

Generic capability:

```text
ACCOUNT_EXISTS
ACCOUNT_ACTIVE
ACCOUNT_CLOSED
ACCOUNT_DORMANT
ACCOUNT_FROZEN
ACCOUNT_BLOCKED
DEBIT_RESTRICTED
CREDIT_RESTRICTED
```

The agent should not decide from assumptions.

It should consume the CBS/account service result and apply configured rules.

---

# 7. Account Restriction / Hold Check

Check configurable restrictions such as:

* debit freeze
* legal hold
* lien
* account block
* fraud restriction
* compliance restriction
* operational restriction
* service restriction

Then classify:

```text
NO_RESTRICTION
RESTRICTION
UNKNOWN
```

This capability is reusable far beyond cheque books.

---

# 8. Duplicate / Existing Request Detection

This is extremely important for reusable banking agents.

The agent should be able to query a request/service system and determine:

```text
existing_request?
same_request?
active_request?
duplicate_request?
recent_request?
```

For cheque book:

```text
Customer already has active cheque-book request
             ↓
          BLOCK/HITL
```

But the generic function should simply be:

```text
duplicate_service_request_detection
```

The actual duplicate rule comes from workflow policy.

---

# 9. Product / Service Eligibility

This should be a **generic eligibility engine**.

Not:

```text
cheque_book_eligible()
```

Instead:

```text
evaluate_service_eligibility()
```

Input:

```text
customer_context
account_context
service_context
policy_context
risk_context
```

Output:

```text
ELIGIBLE
INELIGIBLE
PENDING
UNKNOWN
```

For the cheque-book workflow, the policy could determine:

```text
account type eligible?
account active?
existing request?
unused leaves?
requested leaves allowed?
service enabled?
```

The actual policy should be configurable.

---

# 10. Business Rule Engine

This is one of the **most important reusable components**.

The Customer & Risk Agent should have a deterministic rules layer:

```text
Input
 ↓
Rule Engine
 ↓
Rule Results
```

Example:

```text
RULE-001  customer_exists
RULE-002  account_active
RULE-003  customer_owns_account
RULE-004  kyc_valid
RULE-005  service_eligible
RULE-006  duplicate_request
RULE-007  risk_threshold
```

Then different workflows can configure different policies.

That is how you make the agent reusable.

---

# 11. Customer Risk Assessment

The agent should consume/derive risk using configured risk inputs:

```text
customer risk
account risk
KYC risk
channel risk
product/service risk
behavioral indicators
restriction indicators
external risk results
```

RBI guidance explicitly uses risk-based customer categorisation, including low/medium/high categories and factors such as identity, financial/social status, business activity, geography, products/services and delivery channels. ([Reserve Bank of India][4])

So the reusable capability should be:

```text
assess_customer_risk()
```

not:

```text
assess_cheque_book_risk()
```

---

# 12. Risk Classification

Standardize the result:

```text
LOW
MEDIUM
HIGH
UNKNOWN
```

Potentially:

```text
risk_score
risk_level
risk_factors
risk_source
risk_version
```

But **the scoring formula should be configurable**, not embedded permanently into the agent.

---

# 13. Exception Detection

The agent should detect:

```text
DATA_MISSING
DATA_MISMATCH
KYC_EXCEPTION
ACCOUNT_EXCEPTION
ELIGIBILITY_EXCEPTION
RISK_EXCEPTION
DUPLICATE_REQUEST
UPSTREAM_FAILURE
POLICY_EXCEPTION
```

This is where your previous LC architecture becomes useful.

You already learned that an agent should **not invent an exception**.

Same principle here:

```text
No actual discrepancy
        ↓
No invented exception
```

---

# 14. HITL Determination

The agent should determine:

```text
AUTO_PROCEED
AUTO_REJECT
HITL_REQUIRED
PENDING
UNKNOWN
```

Examples:

```text
Low risk + all validations pass
        ↓
AUTO_PROCEED
```

```text
High risk
        ↓
HITL_REQUIRED
```

```text
KYC service unavailable
        ↓
UNKNOWN/PENDING
```

```text
Account closed
        ↓
AUTO_REJECT
```

The LLM must **not override** these deterministic outcomes.

---

# 15. Approval / Decision Evaluation

P07 should consume everything from P01–P06:

```text
Request
Customer
Account
KYC
Eligibility
Risk
Exceptions
```

Then produce:

```text
FINAL_DECISION
```

For example:

```json
{
  "decision": "PROCEED",
  "risk_level": "LOW",
  "eligible": true,
  "hitl_required": false
}
```

or:

```json
{
  "decision": "HITL_REQUIRED",
  "risk_level": "HIGH",
  "eligible": true,
  "hitl_required": true
}
```

---

# 16. Reason Codes

Don't make the output only:

```text
REJECT
```

Instead:

```text
decision = REJECT

reason_codes:
  - ACCOUNT_INACTIVE
```

or:

```text
decision = HITL_REQUIRED

reason_codes:
  - HIGH_CUSTOMER_RISK
  - ADDITIONAL_REVIEW_REQUIRED
```

This makes the agent much easier to integrate into other workflows.

---

# 17. Evidence Collection

Every important decision should have evidence.

Example:

```text
CHECK: KYC
SOURCE: KYC_SERVICE
RESULT: PASS
REFERENCE: KYC-93829
TIMESTAMP: ...
```

For your architecture, this fits naturally because `sub_workflows` already contain source system/API configuration. 

---

# 18. Unknown / Pending Handling

This is essential.

Never:

```text
API timeout
   ↓
PASS
```

Instead:

```text
API timeout
   ↓
UNKNOWN
```

And:

```text
KYC processing
   ↓
PENDING
```

This should be a **standard capability across all reusable agents**, just as you've been implementing in the LC agents.

---

# 19. Idempotency

If the workflow calls the same agent twice:

```text
request_id = ABC123
```

the agent should recognize that it is the same business request.

This prevents:

```text
duplicate evaluation
duplicate approval
duplicate downstream action
```

---

# 20. Audit / Decision Trace

The agent should produce an execution trace:

```text
Agent
 ↓
Input
 ↓
Validation
 ↓
Customer check
 ↓
KYC check
 ↓
Account check
 ↓
Eligibility
 ↓
Risk
 ↓
Rules
 ↓
Exceptions
 ↓
Decision
```

This is particularly important for banking.

---

# What I would actually build

I would **not create 20 separate agents/functions exposed to the workflow**.

I would create **one reusable Customer & Risk Agent** with internal capabilities:

```text
Customer & Risk Agent
│
├── Input Validator
├── Customer Validator
├── Customer-Account Validator
├── KYC Validator
├── Data Consistency Checker
├── Account Validator
├── Restriction Checker
├── Duplicate Request Detector
├── Eligibility Engine
├── Policy Rule Engine
├── Risk Assessment Engine
├── Risk Classifier
├── Exception Detector
├── HITL Evaluator
├── Decision Engine
├── Reason Code Generator
├── Evidence Collector
├── Idempotency Handler
├── Audit/Trace Builder
└── LLM Explanation Layer
```

### And for Cheque Book P01–P07:

```text
P01 → Request Intake
P02 → Customer Validation
P03 → KYC Validation
P04 → Account Verification
P05 → Eligibility
P06 → Risk Assessment
P07 → Approval
```

The **workflow engine owns the 7-phase sequence**.

The **Customer & Risk Agent owns the business capabilities**.

That distinction is exactly what makes this reusable:

```text
                 CUSTOMER & RISK AGENT
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
     Cheque Book      Debit Card      Loan
      Workflow        Workflow       Workflow
          │              │              │
       Policy A        Policy B       Policy C
```

So the agent is **not a Cheque Book Agent**. It is a **reusable Customer & Risk capability**, and **Cheque Book is its first consumer**.

That is the architecture I would recommend before we start coding AI006.

[1]: https://federal.bank.in/feddy?utm_source=chatgpt.com "Feddy"
[2]: https://xpressforms.hdfc.bank.in/login/prerequisite?formId=cb01&utm_source=chatgpt.com "Xpress Forms"
[3]: https://website.rbi.org.in/documents/d/rbi/handbookg27022025d0f3f53f5d3c4310a6bb2f8ac2175d3a?utm_source=chatgpt.com "CONTENTS
PREFACE.................................."
[4]: https://www.rbi.org.in/commonman/Upload/English/Notification/PDFs/MD18KYCF6E92C82E1E1419D87323E3869BC9F13.pdf?utm_source=chatgpt.com "RBI/DBR/2015-16/18"












===============================================================================================


Yes. I would **not consider this agent complete yet**.

Your current `customer_risk_agent.py` is basically an **adapter/wrapper** around `run_customer_risk()`. That is okay as the outer agent class, but the real Customer & Risk functionality still needs to be implemented in `graph_customer_risk.py` and supporting reusable modules.

Your current structure:

```text
CustomerRiskAgent.execute()
        ↓
run_customer_risk(payload)
        ↓
LLM summary
        ↓
AgentResult
```

is a good starting skeleton, but for production-quality banking logic, I would strengthen it significantly.

## 1. What is good in your current code

This part is correct:

```python
payload = dict(input_data or {})
payload.setdefault("org_id", self.context.org_id)
payload.setdefault("workflow_id", self.context.workflow_id)
```

You are correctly passing workflow execution context into the functional graph.

This is also good:

```python
output = run_customer_risk(payload)
```

It keeps the agent wrapper thin and puts actual business execution into the graph.

And this is a good pattern:

```python
enriched, mode, mode_message, provider, llm_resp = self.enrich_with_llm_summary(
    output, label
)
```

The LLM is being used as an enrichment/summary layer rather than being directly responsible for the workflow execution.

---

# 2. But there are important problems

### Problem 1 — `completed` is currently the dangerous default

You have:

```python
status = output.get("status") or "completed"
```

This means:

```text
graph returns {}
        ↓
status = completed
```

That is dangerous.

For a banking agent:

```text
{}
None
missing result
invalid result
```

should **never automatically become `completed`**.

It should become something like:

```text
failed
```

or:

```text
unknown
```

depending on your contract.

---

# 3. Don't let input override execution context

You currently have:

```python
payload.setdefault("org_id", self.context.org_id)
payload.setdefault("workflow_id", self.context.workflow_id)
```

Suppose caller sends:

```json
{
  "org_id": 999,
  "workflow_id": 999
}
```

Then `setdefault()` will preserve those values.

For an execution framework, I would prefer:

```python
payload["org_id"] = self.context.org_id
payload["workflow_id"] = self.context.workflow_id
```

The execution context should be authoritative.

If you intentionally allow overrides for testing, then validate them rather than silently trusting them.

---

# 4. Your biggest architectural issue

The current class says:

```python
"""Customer & Risk Functional Agent — Cheque Book P01–P07."""
```

This is okay for the current workflow, but remember your requirement:

> **Customer & Risk Agent must be reusable for other workflows.**

So I don't want the actual implementation to become:

```python
if cheque_book:
    ...
elif debit_card:
    ...
elif loan:
    ...
```

That becomes a giant workflow-specific agent.

Instead:

```text
CustomerRiskAgent
        │
        ▼
CustomerRiskGraph
        │
        ├── Customer Validation
        ├── KYC Validation
        ├── Account Validation
        ├── Eligibility
        ├── Risk
        ├── Exception
        └── Decision
```

Then workflow-specific behavior comes through:

```text
workflow context
+
service/product context
+
policy configuration
+
system/API configuration
```

---

# 5. What I would build inside Customer & Risk Agent

Your real agent should have these internal capabilities:

```text
CustomerRiskAgent
│
├── Input Validation
│
├── Request Normalization
│
├── Customer Validation
│
├── Customer ↔ Account Validation
│
├── KYC Validation
│
├── Customer Data Consistency
│
├── Account Validation
│
├── Account Restriction Check
│
├── Duplicate Request Detection
│
├── Service Eligibility
│
├── Business Rule Evaluation
│
├── Customer Risk Assessment
│
├── Risk Classification
│
├── Exception Detection
│
├── HITL Evaluation
│
├── Final Decision
│
├── Reason Codes
│
├── Evidence Collection
│
├── Idempotency
│
└── Audit Trace
```

For Cheque Book:

```text
P01 Receive Request
       ↓
P02 Customer Validation
       ↓
P03 KYC Validation
       ↓
P04 Account Verification
       ↓
P05 Eligibility
       ↓
P06 Risk Assessment
       ↓
P07 Approval
```

The PDF confirms exactly these seven phases for the Customer & Risk portion. 

---

# 6. I would make `graph_customer_risk.py` the brain

Your current:

```python
output = run_customer_risk(payload)
```

is fine.

But `run_customer_risk()` should eventually execute something conceptually like:

```text
run_customer_risk()
        │
        ▼
validate_input
        │
        ▼
P01 request_normalization
        │
        ▼
P02 customer_validation
        │
        ▼
P03 kyc_validation
        │
        ▼
P04 account_verification
        │
        ▼
P05 eligibility
        │
        ▼
P06 risk_assessment
        │
        ▼
P07 approval_decision
        │
        ▼
final_result
```

That is where most of the work should go.

---

# 7. Don't make each phase blindly execute if previous phase failed

For example:

```text
P02 Customer Validation
       ↓
FAILED
       ↓
P03 KYC
```

You shouldn't necessarily continue.

Instead:

```text
P02
 │
 ├── PASS ──────→ P03
 │
 ├── FAIL ──────→ final decision
 │
 ├── PENDING ───→ HITL/PENDING
 │
 └── UNKNOWN ───→ UNKNOWN/HITL
```

This is extremely important.

---

# 8. You need standardized phase results

I would introduce a structure like:

```python
{
    "phase": "P03",
    "name": "KYC Validation",
    "status": "completed",
    "decision": "pass",
    "reason_codes": [],
    "evidence": [],
    "data": {}
}
```

For failure:

```python
{
    "phase": "P04",
    "name": "Account Verification",
    "status": "failed",
    "decision": "reject",
    "reason_codes": [
        "ACCOUNT_INACTIVE"
    ],
    "evidence": [],
    "data": {}
}
```

For unknown:

```python
{
    "phase": "P03",
    "name": "KYC Validation",
    "status": "unknown",
    "decision": "hitl",
    "reason_codes": [
        "KYC_SERVICE_UNAVAILABLE"
    ]
}
```

This makes the agent reusable.

---

# 9. Very important: don't use LLM to make the banking decision

Your current code:

```python
enriched, mode, mode_message, provider, llm_resp = self.enrich_with_llm_summary(
    output, label
)
```

is okay **only if `enrich_with_llm_summary()` cannot change the decision**.

For example:

```text
Deterministic result:

decision = HITL_REQUIRED
risk = HIGH
```

LLM says:

```text
"This appears low risk."
```

The final result must remain:

```text
HITL_REQUIRED
HIGH
```

The LLM can only produce:

```text
summary
explanation
human-readable reasoning
```

It must not change:

```text
status
decision
risk
eligibility
HITL
reason_codes
```

This is one of the areas where your previous LC-agent approach should carry over.

---

# 10. Your `rejected → failed` mapping needs improvement

You currently have:

```python
if status == "rejected":
    status = "failed"
```

I understand why you're doing it: your `AgentResult` supports:

```text
completed
hitl_wait
failed
```

But you're losing business meaning.

Example:

```text
Account closed
```

is not the same thing as:

```text
KYC API timeout
```

Both could become `failed`, but the output must preserve the business decision:

```json
{
  "status": "failed",
  "decision": "reject",
  "reason_codes": ["ACCOUNT_CLOSED"]
}
```

versus:

```json
{
  "status": "failed",
  "decision": "unknown",
  "reason_codes": ["KYC_SERVICE_TIMEOUT"]
}
```

So:

**technical execution status != business decision**

This distinction is important.

---

# 11. Don't use only `hitl_wait`

You currently check:

```python
if output.get("hitl_wait"):
    status = "hitl_wait"
```

I would make HITL much more structured:

```json
{
  "status": "hitl_wait",
  "decision": "HITL_REQUIRED",
  "hitl": {
    "required": true,
    "reason_codes": [
      "HIGH_CUSTOMER_RISK"
    ],
    "required_role": "RISK_OFFICER"
  }
}
```

That allows the workflow engine to understand **why** it is waiting.

---

# 12. Add explicit validation before calling the graph

I would add something like:

```python
if not isinstance(input_data, dict):
    return AgentResult(...)
```

Then validate required execution information.

For example:

```text
request_id
customer_id
account_id
service_type
```

But be careful: **don't assume all fields are mandatory for every future workflow**.

That's why the generic agent should have:

```text
base required fields
+
workflow/service-specific schema
```

---

# 13. Add a proper output contract

Your agent currently does:

```python
output_data=enriched
```

but we don't know what `output` is guaranteed to contain.

I would define a schema such as:

```python
CustomerRiskResult
```

with:

```text
execution_id
request_id
workflow_id
agent
overall_status
decision
risk_level
eligibility
hitl_required
phases
reason_codes
exceptions
evidence
audit
```

This becomes your contract with the orchestrator.

---

# 14. I would change your file architecture

Currently:

```text
functional_agents/
└── banking/
    ├── cheque_fulfillment_agent.py
    ├── customer_risk_agent.py
    └── delivery_closure_agent.py
```

This is okay for workflow adapters.

But the reusable business functionality should eventually look more like:

```text
ai_runtime/
│
├── functional_agents/
│   │
│   ├── banking/
│   │   └── customer_risk_agent.py
│   │
│   └── reusable/
│       └── customer_risk/
│           ├── constants.py
│           ├── schemas.py
│           ├── rules.py
│           ├── validators.py
│           ├── eligibility.py
│           ├── risk.py
│           ├── exceptions.py
│           ├── decision.py
│           └── service.py
│
└── workflows/
    └── banking/
        └── cheque_book/
            └── graph_customer_risk.py
```

The exact folders can follow your existing project conventions, but the architectural idea is important:

**Reusable business capability should not be trapped inside the Cheque Book workflow.**

---

# 15. What I would NOT add

Don't turn Customer & Risk Agent into:

```text
CustomerRiskAgent
├── cheque book logic
├── debit card logic
├── loan logic
├── account opening logic
├── credit card logic
└── FD logic
```

That will become impossible to maintain.

Instead:

```text
CustomerRiskAgent
       │
       ├── generic customer validation
       ├── generic KYC
       ├── generic account validation
       ├── generic eligibility
       ├── generic risk
       └── generic decision
                  ▲
                  │
            policy/config
```

---

# 16. Revised outer agent

Your outer class should remain relatively small.

Something along these lines:

```python
class CustomerRiskAgent(BaseAgent):

    def execute(self, input_data: dict) -> AgentResult:
        payload = dict(input_data or {})

        # Execution context is authoritative
        payload["org_id"] = self.context.org_id
        payload["workflow_id"] = self.context.workflow_id

        # Execute deterministic customer/risk graph
        output = run_customer_risk(payload)

        # Validate graph output
        if not isinstance(output, dict) or not output:
            return AgentResult(
                agent_id=self.identity.agent_id,
                agent_name=self.identity.agent_name or "Customer & Risk Agent",
                status="failed",
                output_data={
                    "decision": "unknown",
                    "reason_codes": ["INVALID_AGENT_OUTPUT"],
                },
                error_message="Customer & Risk graph returned no valid result",
                metadata={
                    "processes": ["P01", "P02", "P03", "P04", "P05", "P06", "P07"]
                },
            )

        status = self._map_execution_status(output)

        # LLM is explanation only.
        enriched, mode, mode_message, provider, llm_resp = (
            self.enrich_with_llm_summary(output, self.identity.agent_name or "Customer & Risk Agent")
        )

        # Re-apply authoritative decision after LLM enrichment
        enriched["decision"] = output.get("decision")
        enriched["risk_level"] = output.get("risk_level")
        enriched["hitl_required"] = output.get("hitl_required")
        enriched["reason_codes"] = output.get("reason_codes", [])

        return AgentResult(
            agent_id=self.identity.agent_id,
            agent_name=self.identity.agent_name or "Customer & Risk Agent",
            status=status,
            output_data=enriched,
            error_message=output.get("error_message"),
            llm_response=llm_resp,
            metadata={
                "processes": ["P01-P07"],
                "ai_mode": mode,
                "ai_mode_message": mode_message,
                "ai_provider": provider,
            },
        )
```

And then:

```python
def _map_execution_status(self, output: dict) -> str:
    if output.get("hitl_required"):
        return "hitl_wait"

    status = output.get("status")

    if status == "completed":
        return "completed"

    if status in {"failed", "rejected"}:
        return "failed"

    return "failed"
```

This is still only the **outer adapter**.

---

# 17. Where the real development work is

I would now focus development in this order:

```text
PHASE 1
Customer & Risk input/output schemas
        ↓
PHASE 2
P01 Request normalization
        ↓
PHASE 3
P02 Customer validation
        ↓
PHASE 4
P03 KYC validation
        ↓
PHASE 5
P04 Account verification
        ↓
PHASE 6
P05 Generic eligibility/rules
        ↓
PHASE 7
P06 Risk assessment
        ↓
PHASE 8
P07 Decision/approval
        ↓
PHASE 9
Exception + HITL
        ↓
PHASE 10
Evidence/audit/idempotency
        ↓
PHASE 11
LLM summary
        ↓
PHASE 12
End-to-end testing
```

### My senior-engineer verdict on your current code

**Current `customer_risk_agent.py`: ~30% of the agent implementation.**

The wrapper itself is mostly fine, but the **actual reusable Customer & Risk capability is still missing**.

The next thing I would inspect before writing more code is your:

```text
app/ai_runtime/workflows/banking/cheque_book/graph_customer_risk.py
```

because **that file determines whether your current Customer & Risk Agent is actually doing P01–P07 or is still just a stub**.

If you give me that file (and ideally the existing reusable modules from the 6 LC agents), I can review it against this architecture and tell you **exactly what to keep, what to remove, what to add, and what should be reused from the LC agents**.
