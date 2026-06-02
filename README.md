# Chaoyunda

Redith Seedance Console is a lightweight Node.js + Express web app for video generation workflows. It serves the frontend files directly and proxies requests to TkHub, MuAPI, and S3-compatible object storage.

## Features

- Static web console served by Express
- Video generation API proxy for TkHub
- Text-to-video and image-to-video API proxy for MuAPI
- Upload endpoint for image/video/audio assets backed by S3-compatible storage
- Download proxy for generated videos
- Docker Compose deployment support

## Requirements

- Node.js 20 or newer
- npm
- Docker and Docker Compose for server deployment

## Environment Variables

Copy the example file and fill in your real credentials:

```bash
cp .env.example .env
```

Available variables:

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server port | `4173` |
| `TKHUB_API_BASE_URL` | TkHub API base URL | `https://api.tkhub.ai` |
| `TKHUB_API_KEY` | TkHub API key | Required |
| `MUAPI_BASE_URL` | MuAPI API base URL | `https://api.muapi.ai/api/v1` |
| `MUAPI_API_KEY` | MuAPI API key | Required |
| `S3_ENDPOINT` | S3-compatible endpoint | Required |
| `S3_BUCKET` | Bucket for uploaded image/video/audio assets | `redith-assets` |
| `S3_REGION` | S3 signing region | `us-east-1` |
| `S3_ACCESS_KEY_ID` | S3 access key ID | Required |
| `S3_SECRET_ACCESS_KEY` | S3 secret access key | Required |
| `S3_SIGNED_URL_EXPIRES_SECONDS` | Expiration for generated material URLs, max 7 days | `604800` |
| `MAX_UPLOAD_MB` | Max upload size in MB | `200` |

Do not commit `.env`. It is ignored by git.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Open:

```text
http://localhost:4173
```

If you set a different `PORT` in `.env`, use that port instead.

## Docker Compose Deployment

On the Linux server:

```bash
git clone git@github.com:huawuhen/chaoyunda.git
cd chaoyunda
cp .env.example .env
```

Edit `.env` and fill in the API keys, then start the service:

```bash
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f app
```

Restart:

```bash
docker compose restart app
```

Stop:

```bash
docker compose down
```

Update after pulling new code:

```bash
git pull
docker compose up -d --build
```

## Reverse Proxy

For production, it is recommended to put Nginx or Caddy in front of the app and proxy traffic to `127.0.0.1:4173`.

Example Nginx location block:

```nginx
location / {
    proxy_pass http://127.0.0.1:4173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Notes

- The server only exposes `/`, `/app.js`, `/styles.css`, and `/assets` as static resources.
- API keys stay on the server and are not sent to the frontend.
- The Docker image uses `node:20-alpine`.
