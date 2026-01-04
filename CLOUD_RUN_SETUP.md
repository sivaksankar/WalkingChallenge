# Cloud Run + Firebase Hosting Deployment Guide

This app now deploys **Next.js to Cloud Run** with **Firebase Hosting** as the CDN/frontend.

## Prerequisites

```bash
# Install Google Cloud CLI
# macOS: brew install google-cloud-cli
# Or download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login
gcloud config set project walking-challenge-cd6dd
```

## Deployment Steps

### 1. Build and Deploy to Cloud Run

```bash
# From project root
npm run deploy:cloudrun
```

This will:
- Build Docker image
- Push to Google Container Registry
- Deploy to Cloud Run as `nextjs-app`
- Deploy Firebase Hosting (rewrites to Cloud Run)

### 2. (One-time) Enable Cloud Run API

If you see "Cloud Run API not enabled", run:
```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### 3. Manual Steps (if needed)

```bash
# Build image locally
docker build -t gcr.io/walking-challenge-cd6dd/nextjs-app .

# Push to registry
gcloud auth configure-docker
docker push gcr.io/walking-challenge-cd6dd/nextjs-app

# Deploy to Cloud Run
gcloud run deploy nextjs-app \
  --image gcr.io/walking-challenge-cd6dd/nextjs-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NEXTAUTH_URL=https://walking-challenge-cd6dd.web.app,NEXTAUTH_SECRET=s+/QNtGjKw4NJFenZcUbFrtM3iwdlj/+83FaFRxo9YY=

# Deploy Firebase Hosting
firebase deploy --only hosting
```

## How It Works

1. **Firebase Hosting** serves your domain (walking-challenge-cd6dd.web.app)
2. **Hosting rewrites** all requests to the **Cloud Run service** (nextjs-app)
3. **Cloud Run** runs the Next.js app in a container with full SSR support
4. **NextAuth** works correctly with proper NEXTAUTH_URL (public domain)
5. **Firebase Admin SDK** has unrestricted networking for Firestore access

## Troubleshooting

### Cloud Run logs
```bash
gcloud run logs read nextjs-app --region us-central1 --limit 50
```

### Set Cloud Run environment variables
```bash
gcloud run deploy nextjs-app \
  --update-env-vars KEY=VALUE \
  --region us-central1
```

### Test locally
```bash
docker build -t nextjs-app .
docker run -p 3000:3000 -e NEXTAUTH_URL=http://localhost:3000 nextjs-app
# Visit http://localhost:3000
```

## Cleanup (if needed)

```bash
# Delete Cloud Run service
gcloud run services delete nextjs-app --region us-central1

# Delete container images
gcloud container images delete gcr.io/walking-challenge-cd6dd/nextjs-app
```

## Environment Variables in Cloud Run

Add via console or CLI:
- `NEXTAUTH_SECRET` (already set)
- `NEXTAUTH_URL=https://walking-challenge-cd6dd.web.app`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_PROJECT_ID`
- `ADMIN_CLIENT_EMAIL`
- `ADMIN_PRIVATE_KEY_B64`
