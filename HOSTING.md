# Quick Hosting Guide

Two ways to run AWS Incident Buddy. Start with Option A for a live demo in minutes.

---

## Option A — Frontend only on Amplify (mock mode, NO backend)

The fastest path. The app runs with built-in client-side demo analysis, so there
is nothing else to deploy. A yellow "Demo mode" banner makes this explicit.

A pre-built, ready-to-upload archive is already in the repo root:

```
amplify-frontend.zip
```

### Deploy (drag and drop)
1. Open the **AWS Amplify** console → **Create new app** → **Deploy without Git**
   (also called "Host your web app" / manual deploy).
2. Give it an app and environment name (e.g. `incident-buddy`, `demo`).
3. **Drag `amplify-frontend.zip`** into the upload box (or browse to it).
4. Click **Save and deploy**. In under a minute you get a live
   `https://<env>.<app-id>.amplifyapp.com` URL.

That URL is your "Live application" link. Done.

> The zip already contains `index.html` at its root and a `_redirects` file
> (`/* /index.html 200`) so SPA routing and page refreshes work.

### Rebuild the zip yourself (optional)
```bash
cd frontend
npm install
VITE_USE_MOCK=true npm run build
cd dist && zip -r ../../amplify-frontend.zip . && cd ../..
```

### Connect Git instead of uploading a zip (optional)
Point Amplify Hosting at your repo. The included `amplify.yml` builds
`frontend/` and publishes `frontend/dist`. In the Amplify console set an
environment variable:
- `VITE_USE_MOCK = true`  → standalone demo, OR
- `VITE_API_URL = https://<api-id>.execute-api.<region>.amazonaws.com` → real backend.

---

## Option B — Real backend (Lambda + API Gateway + Bedrock)

Deploy the serverless backend, then point the frontend at it.

### 1. Deploy the backend (CloudFormation via SAM)
```bash
# One-time: enable Bedrock model access for amazon.nova-lite-v1:0 in the
# target region (Bedrock console -> Model access).

sam build
sam deploy --guided          # first time; accept defaults, confirm changeset
# note the AnalyzeEndpoint / ApiUrl output
```
> `template.yaml` is a CloudFormation template (SAM transform). It provisions the
> Lambda, the HTTP API, and a least-privilege IAM role scoped to
> `bedrock:InvokeModel` on the Nova model only. If you prefer raw CloudFormation:
> `aws cloudformation deploy --template-file template.yaml --stack-name aws-incident-buddy --capabilities CAPABILITY_IAM`.

### 2. Point the frontend at the API and rebuild
```bash
cd frontend
echo "VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com" > .env.production
# make sure VITE_USE_MOCK is NOT set to true
npm install
npm run build
cd dist && zip -r ../../amplify-frontend.zip . && cd ../..
```
Then upload the new `amplify-frontend.zip` to Amplify as in Option A.

### 3. Lock down CORS (recommended for prod)
Redeploy the backend with your real frontend origin instead of `*`:
```bash
sam deploy --parameter-overrides AllowedOrigin=https://<env>.<app-id>.amplifyapp.com
```

### 4. Test the deployed API
```bash
./samples/demo.sh https://<api-id>.execute-api.<region>.amazonaws.com
```

---

## Which should I use?

| Goal | Use |
|---|---|
| Live demo URL in minutes, no AWS backend cost | **Option A** (mock) |
| Real Amazon Bedrock analysis end-to-end | **Option B** (backend) |

Mock and real builds are identical except for the two env vars, so you can start
with Option A today and switch to Option B by rebuilding with `VITE_API_URL`.
