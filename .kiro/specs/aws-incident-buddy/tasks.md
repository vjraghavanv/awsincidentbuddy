# AWS Incident Buddy — Implementation Tasks

## Task 1: Project Scaffold
- [ ] Create root directory structure: `frontend/`, `backend/`, `infrastructure/`
- [ ] Initialise React + Vite app in `frontend/`
- [ ] Initialise Node.js package in `backend/`
- [ ] Add `.gitignore` at root

## Task 2: Backend Lambda
- [ ] `backend/src/handler.js` — main Lambda handler
- [ ] `backend/src/bedrockClient.js` — Bedrock InvokeModel wrapper
- [ ] `backend/src/prompt.js` — system prompt and user prompt builder
- [ ] `backend/src/validator.js` — input validation and sanitisation
- [ ] `backend/src/responseParser.js` — parse + validate Bedrock JSON output
- [ ] `backend/package.json` — dependencies (AWS SDK v3)

## Task 3: Frontend React App
- [ ] `frontend/src/App.jsx` — root component with state machine
- [ ] `frontend/src/components/ErrorInput.jsx` — textarea, example buttons, submit
- [ ] `frontend/src/components/LoadingState.jsx` — spinner
- [ ] `frontend/src/components/AnalysisResult.jsx` — full result display
- [ ] `frontend/src/components/SeverityBadge.jsx` — color-coded badge
- [ ] `frontend/src/components/SafetyWarning.jsx` — warning box
- [ ] `frontend/src/api/analyzeIncident.js` — fetch wrapper
- [ ] `frontend/src/constants/exampleErrors.js` — 3 example error strings
- [ ] Tailwind CSS setup

## Task 4: Infrastructure (SAM)
- [ ] `template.yaml` — SAM template (Lambda + API Gateway)
- [ ] `samconfig.toml` — deployment defaults

## Task 5: Tests
- [ ] `backend/tests/validator.test.js`
- [ ] `backend/tests/responseParser.test.js`
- [ ] `backend/tests/handler.test.js`
- [ ] `backend/tests/fixtures/sampleIncidents.json`

## Task 6: Samples and Docs
- [ ] `samples/lambda-s3-access-denied.json`
- [ ] `samples/cloudformation-create-failed.json`
- [ ] `samples/apigw-403.json`
- [ ] `README.md` — architecture, deployment, local dev, demo script, checklist
