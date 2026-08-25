# Enterprise AI Agent Backend Architecture (Cheque Book First)

**Date:** 2026-07-31  
**Scope:** Backend `FT-OPEN-LAYER-BE` — Agent Library catalog + `ai_runtime` execution  
**Status:** Approved for implementation

## Verdict

The Master Agent Library (V1.0) + separate `app/ai_runtime/` package is the correct long-term architecture. Do not replace it. Build Cheque Book as the first Functional composition (3 agents), then add agents by composing the same Master / Task / Connector pools.

## Layers

| Layer | Responsibility | Location |
|-------|----------------|----------|
| Catalog (content) | Agent metadata CRUD | `app/modules/ai_agents/` + FE Agent Library |
| Workflow definition | Phases, subworkflows, canvas | `app/modules/automation/` + seed SQL + FE designer |
| Runtime execution | Run agents, tools, connectors | `app/ai_runtime/` |
| Control plane | AuthZ, policy, secrets, audit | `ai_runtime/foundation/security.py` + audit |

## Hierarchy

```
Enterprise Marketplace
├── Foundation (identity, security, knowledge, memory, audit)
├── Master Agents (~100 library capabilities)
├── Functional Agents (industry: banking cheque book, KYC, …)
├── Task Agents (atomic: validate, notify, call API)
└── Connectors & Tools (CBS, eKYC, OCR, PDF, email)
```

### Cheque Book mapping (3 Functional agents)

| Functional agent | Processes | Master capabilities used |
|------------------|-----------|--------------------------|
| Customer & Risk Agent | P01–P07 | Verification, Business Rules, Fraud, Approval/HITL, Exception |
| Cheque Fulfillment Agent | P08–P10 | Operations, Document/PDF, Dispatch |
| Delivery & Closure Agent | P11–P12 | Notification, Logistics, Workflow Completion, Audit |

Do **not** create one agent per process (12).

## Control-Plane (security-hardened)

Every execution path:

1. Resolve agent identity from catalog  
2. `SecurityService.validate_agent_execution` — active, org scope, allowlists  
3. Policy/guardrails before tool/connector calls  
4. Secrets via env/vault only (never in prompts)  
5. Audit every agent/tool/HITL/connector event  

LLM never directly debits CBS, prints cheques, or creates shipments. LLM proposes; Task/Connector executes allowlisted actions.

## Data flow

Shared payload: **ChequeBookCase**

- `case_id`, `workflow_id`, `org_id`, `customer_id`, `account_id`
- `auth_status`, `eligibility`, `fee`, `risk_score`, `exception_decision`
- `order_id`, `print_batch`, `awb`, `delivery_status`
- `audit[]`

Flow: Channel/Designer → FastAPI → `WorkflowOrchestrator` → Customer & Risk (P01–P07) → Cheque Fulfillment (P08–P10) → Delivery & Closure (P11–P12) → audit close.

## HITL / LLM modes

| Mode | When | Behavior |
|------|------|----------|
| Deterministic | Validation, fees, print, dispatch | Task + connector only |
| LLM-assisted | Fraud narrative, exception summary, message draft | `ProviderRouter`; Policy validates output |
| HITL | P07 exception / high risk | Pause → notify approver → resume/reject API → audit |

## Tools & connectors (day-1)

**Tools:** validation, email/notification, PDF, OCR  
**Connectors (stub→real):** CBS, eKYC, Risk Analytics, Payment Gateway, Card/Cheque Mgmt, Notification, Logistics  

## Workflow design process

1. Seed `WF-CHEQUE-BOOK` P01–P12 + `sub_workflows.ai_agents` names  
2. Catalog rows for the 3 Functional agents  
3. Runtime classes under `functional_agents/banking/` + graphs under `workflows/banking/cheque_book/`  
4. `ExecutionEngine.execute_workflow` walks phases and resolves agents  
5. Designer Test Run calls the same runtime API  

## Add-next-agent checklist

1. Insert/update `workflow_ai_agents` catalog row (content)  
2. Implement Master or Functional class under existing `ai_runtime` folders  
3. Register tools/connectors in registries  
4. Map on `sub_workflows.ai_agents`  
5. Optional: LangGraph under `workflows/<domain>/`  

## Deferred

- Temporal for multi-day print/courier waits  
- Full ~100 Master Agent implementations  
- CrewAI / AutoGen  
