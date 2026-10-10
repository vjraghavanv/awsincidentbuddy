# AWS Incident Buddy — Design

## Architecture Overview

```
User Browser
    │
    ▼
React SPA (S3 + CloudFront  OR  local dev server)
    │  POST /analyze  { "incident": "..." }
    ▼
Amazon API Gateway (HTTP API)
    │  proxy integration
    ▼
AWS Lambda  (Node.js 20.x)
    │  InvokeModel
    ▼
Amazon Bedrock  (amazon.nova-lite-v1:0)
```

All components run in a single AWS region. No VPC required.

---

## Component Breakdown

### 1. React Frontend

| Concern | Decision |
|---|---|
| Framework | React 18 (Vite) |
| Styling | Tailwind CSS |
| State | React useState / useReducer (no Redux) |
| HTTP | fetch() — no extra library |
| Build output | Static files served from S3+CloudFront or local dev |

**Key components:**

- `App.jsx` — root, holds application state
- `ErrorInput.jsx` — textarea + example buttons + submit button
- `LoadingState.jsx` — spinner + "Analyzing your incident..." message
- `AnalysisResult.jsx` — renders the full structured response
- `SeverityBadge.jsx` — color-coded severity pill
- `SafetyWarning.jsx` — always-visible warning box

**State machine (simple):**

```
IDLE → LOADING → RESULT
          └──────→ ERROR
RESULT/ERROR → IDLE  (via "Analyze another error")
```

### 2. Lambda Backend

| Concern | Decision |
|---|---|
| Runtime | Node.js 20.x |
| Handler | `handler.analyzeIncident` |
| Model | `amazon.nova-lite-v1:0` (Nova Lite — free tier eligible) |
| Input validation | Length check, non-empty check, basic sanitisation |
| Response | Always returns JSON with a consistent shape |

**Request flow:**

1. Parse and validate body (`incident` field, max 5,000 chars).
2. Build a structured system prompt and user prompt.
3. Call `bedrock-runtime:InvokeModel`.
4. Parse the JSON block from the model response.
5. Validate the parsed object has all required fields.
6. Return `200 OK` with the JSON analysis.
7. On any error, return `500` with `{ "error": "human-readable message" }`.

**System prompt strategy:**

The system prompt instructs the model to:
- Act as an AWS incident first responder.
- Always use inferential language for unconfirmed causes.
- Return ONLY a valid JSON object matching the specified schema.
- Never claim access to the user's AWS account.
- Add a safety warning for IAM or infrastructure changes.

### 3. API Gateway

- HTTP API (v2) — lower cost and latency than REST API.
- Single route: `POST /analyze`.
- Lambda proxy integration.
- CORS enabled for the frontend origin.
- Default throttling: 100 req/s burst, 50 req/s steady.

### 4. Infrastructure as Code

AWS SAM (`template.yaml`) is used for deployment because:
- Single file, minimal learning curve.
- Free to use.
- Supports local testing via `sam local`.

---

## Data Contracts

### API Request
```json
POST /analyze
Content-Type: application/json

{
  "incident": "<raw AWS error text, max 5000 chars>"
}
```

### API Response (success)
```json
HTTP 200
{
  "service": "AWS Lambda",
  "severity": "HIGH",
  "summary": "...",
  "likelyCause": "...",
  "confidence": "MEDIUM",
  "recommendedActions": ["...", "...", "..."],
  "checkNext": ["...", "..."],
  "safetyWarning": "..."
}
```

### API Response (error)
```json
HTTP 400 | 500
{
  "error": "Human-readable message"
}
```

---

## Bedrock Prompt Design

### System Prompt
```
You are AWS Incident Buddy, an expert AWS incident first responder.
Your job is to analyze AWS error messages and provide structured, advisory troubleshooting guidance.

RULES YOU MUST FOLLOW:
1. You do NOT have access to the user's AWS account. Never claim you do.
2. Always use inferential language for unconfirmed root causes: "may be", "likely", "could indicate".
3. Clearly distinguish between "likely cause" (inference) and "confirmed cause" (only if evidence proves it).
4. For IAM issues: explain the required permission and what to inspect before suggesting a policy change.
5. Never recommend automatic execution of destructive commands.
6. Always include a safety warning reminding the user to verify before applying changes.
7. Return ONLY a valid JSON object. No markdown, no explanation outside the JSON.

JSON SCHEMA:
{
  "service": "string — the primary AWS service involved",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "summary": "string — plain English explanation of the error",
  "likelyCause": "string — inferred root cause, using inferential language",
  "confidence": "LOW | MEDIUM | HIGH",
  "recommendedActions": ["string", "string", "string"],
  "checkNext": ["string", "string"],
  "safetyWarning": "string"
}
```

### User Prompt Template
```
Analyze this AWS error and respond with ONLY the JSON object described in your instructions:

<error>
{INCIDENT_TEXT}
</error>
```

---

## IAM Permissions (Least Privilege)

### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `BEDROCK_REGION` | AWS region for Bedrock | `us-east-1` |
| `BEDROCK_MODEL_ID` | Model ID | `amazon.nova-lite-v1:0` |
| `MAX_INPUT_LENGTH` | Max chars accepted | `5000` |
| `ALLOWED_ORIGIN` | CORS origin | `https://your-cloudfront.net` |

---

## Local Development

- Frontend: `npm run dev` inside `frontend/` (Vite dev server on port 5173).
- Backend: `sam local start-api` at the repo root (API on port 3000).
- Frontend proxies `/analyze` → `http://localhost:3000/analyze` via Vite proxy config.

---

## Deployment

1. `sam build`
2. `sam deploy --guided` (first time) — provisions Lambda + API Gateway.
3. Build frontend: `cd frontend && npm run build`.
4. Upload `frontend/dist` to S3 static website bucket.
5. (Optional) Point CloudFront distribution at the S3 bucket.
6. Set `VITE_API_URL` to the API Gateway invoke URL before building.

---

## Security Considerations

- CORS on API Gateway allows only the known frontend origin in production.
- Lambda does not log the raw `incident` text at INFO level — only metadata.
- No credentials appear in frontend bundle.
- Input is trimmed and length-capped before reaching Bedrock.
- SAM template uses `!Sub` for resource ARNs — no wildcard account IDs.
