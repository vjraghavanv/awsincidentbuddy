# AWS Incident Buddy — Requirements

## Overview

AWS Incident Buddy is a web application that helps developers and AWS engineers diagnose AWS errors. A user pastes an error message and receives a structured, advisory analysis powered by Amazon Bedrock.

---

## Functional Requirements

### FR-1: Error Input
- The user can paste any AWS error message, exception, CloudWatch log, or deployment failure text into a large input area.
- The input accepts free-form text up to 5,000 characters.
- The UI provides 3 example errors the user can load with a single click:
  1. Lambda + S3 AccessDenied
  2. CloudFormation CREATE_FAILED
  3. API Gateway 403

### FR-2: Incident Analysis
- Clicking "Analyze Incident" sends the input to the backend API.
- The backend forwards the input to Amazon Bedrock (Nova model).
- Bedrock returns a structured JSON analysis containing:
  - `service` — the AWS service identified
  - `severity` — LOW | MEDIUM | HIGH | CRITICAL
  - `summary` — plain-language explanation
  - `likelyCause` — inferred root cause, clearly stated as an inference
  - `confidence` — LOW | MEDIUM | HIGH
  - `recommendedActions` — up to 3 troubleshooting steps
  - `checkNext` — AWS resources, permissions, or logs to inspect
  - `safetyWarning` — mandatory advisory about not blindly applying changes

### FR-3: Results Display
- The UI displays all fields from the structured response.
- Severity is shown as a color-coded badge (LOW=green, MEDIUM=yellow, HIGH=orange, CRITICAL=red).
- Confidence is displayed alongside the likely cause.
- Safety warning is prominently shown.
- A "likely cause vs confirmed cause" distinction is always visible.

### FR-4: Agent Behavior Constraints
- The agent MUST use inferential language for unconfirmed root causes (e.g., "may be", "likely", "could indicate").
- The agent MUST NOT claim to have access to the user's AWS account.
- The agent MUST NOT suggest automatic execution of destructive commands.
- For IAM-related issues, the agent MUST explain the required permission and what to inspect before suggesting a policy change.

### FR-5: Error Handling
- If the API call fails, the UI shows a user-friendly message: "We couldn't analyze this incident right now. Please try again."
- No technical stack traces are shown to the user.
- Empty input is rejected with an inline validation message before calling the API.

### FR-6: Reset Flow
- After viewing results, the user can click "Analyze another error" to reset the form and start over.

### FR-7: Disclaimer
- A static disclaimer is always visible: "This analysis is advisory. Verify changes before applying them to your AWS environment."

---

## Non-Functional Requirements

### NFR-1: Security
- AWS credentials are never exposed in frontend code.
- Backend uses environment variables/configuration for all secrets and settings.
- User input is validated and sanitized before being sent to Bedrock.
- Sensitive input is not logged unnecessarily.
- IAM permissions follow least-privilege principle.
- Only the backend calls Bedrock — never the frontend directly.

### NFR-2: Performance
- The UI shows a loading state ("Analyzing your incident...") immediately after submission.
- Target response time: under 15 seconds end-to-end for typical inputs.

### NFR-3: Reliability
- API Gateway and Lambda handle failures gracefully and return structured error responses.
- Frontend handles all non-2xx responses with a user-friendly fallback.

### NFR-4: Cost
- Architecture uses AWS Free Tier where possible.
- No always-on compute (Lambda is pay-per-use).
- No expensive services (DynamoDB, Cognito, ECS, App Runner, Step Functions, RAG, vector databases) are used.

### NFR-5: Maintainability
- Code is well-commented and follows consistent style.
- Environment-specific configuration is separated from logic.

---

## Out of Scope

- User authentication / accounts
- Conversation history / persistence
- RAG or vector database knowledge base
- Multi-agent orchestration
- AWS account integration (the agent does not connect to the user's AWS account)
- Automatic remediation commands
