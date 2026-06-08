# Chaoyunda

Redith Seedance Console is a lightweight Node.js + Express web app for video generation workflows. It serves the frontend files directly and proxies requests to TkHub, MuAPI, and S3-compatible object storage.

## Features

- Static web console served by Express
- Video generation API proxy for TkHub
- Text-to-video and image-to-video API proxy for MuAPI Seedance and Gemini Omni models
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
| `UPSTREAM_CONNECT_TIMEOUT_MS` | TkHub/MuAPI connect timeout in milliseconds | `30000` |
| `UPSTREAM_REQUEST_TIMEOUT_MS` | TkHub/MuAPI total request timeout in milliseconds | `60000` |
| `UPSTREAM_FETCH_RETRIES` | Retry count for transient upstream network failures | `1` |
| `UPSTREAM_LOG_VERBOSE` | Print full upstream network error stacks when set to `1` | `0` |
| `S3_ENDPOINT` | S3-compatible endpoint | Required |
| `S3_BUCKET` | Bucket for uploaded image/video/audio assets | `redith-assets` |
| `S3_REGION` | S3 signing region | `us-east-1` |
| `S3_FORCE_PATH_STYLE` | Use path-style S3 URLs when set to `true` | `true` |
| `S3_ACCESS_KEY_ID` | S3 access key ID | Required |
| `S3_SECRET_ACCESS_KEY` | S3 secret access key | Required |
| `S3_SIGNED_URL_EXPIRES_SECONDS` | Expiration for generated material URLs, max 7 days | `604800` |
| `MAX_UPLOAD_MB` | Max upload size in MB | `200` |

Do not commit `.env`. It is ignored by git.

Provider-specific overrides are also supported: `TKHUB_CONNECT_TIMEOUT_MS`, `TKHUB_REQUEST_TIMEOUT_MS`, `TKHUB_FETCH_RETRIES`, `MUAPI_CONNECT_TIMEOUT_MS`, `MUAPI_REQUEST_TIMEOUT_MS`, and `MUAPI_FETCH_RETRIES`.

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

## MuAPI Model Notes

The console currently supports these MuAPI providers from the interface selector:

| UI provider | MuAPI endpoint | Required media field | Notes |
| --- | --- | --- | --- |
| `MuAPI| Seedance2 I2V` | `/api/v1/seedance-v1.5-pro-i2v` | `image_url` | Supports optional last frame, `generate_audio`, and `camera_fixed`. |
| `MuAPI| Seedance2 T2V` | `/api/v1/seedance-v1.5-pro-t2v` | None | Text-to-video through the same async prediction flow. |
| `MuAPI| Gemini Omni I2V` | `/api/v1/gemini-omni-image-to-video` | `image_urls` | Image-to-video, requires prompt and 1-5 images, duration must be `4`, `6`, `8`, or `10`, resolution is `720p`, `1080p`, or `4k`, and aspect ratio is `16:9` or `9:16`. Optional `audio_ids`, `character_ids`, and `seed` are supported. |

All MuAPI submissions return a `request_id`; the app polls `/api/v1/predictions/{request_id}/result` through its local proxy.

## Docker Compose Deployment

下面是一套完整的 Linux 云服务器部署流程，适合 Ubuntu/Debian/CentOS 等常见发行版。示例默认应用端口为 `4173`，生产环境建议再用 Nginx 或 Caddy 做 HTTPS 反向代理。

### 1. Prepare the Server

Install Git, Docker, and Docker Compose on the server first.

Ubuntu/Debian example:

```bash
sudo apt update
sudo apt install -y git ca-certificates curl

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and log back in after adding the user to the `docker` group, then verify:

```bash
docker --version
docker compose version
```

### 2. Clone the Project

```bash
git clone git@github.com:huawuhen/chaoyunda.git
cd chaoyunda
```

If the server has no GitHub SSH key configured, use the HTTPS URL instead:

```bash
git clone https://github.com/huawuhen/chaoyunda.git
cd chaoyunda
```

### 3. Configure Environment Variables

Create `.env` from the example file:

```bash
cp .env.example .env
```

Edit `.env` and fill in real values:

```bash
nano .env
```

Required production values:

```env
PORT=4173
TKHUB_API_KEY=your-real-tkhub-api-key
MUAPI_API_KEY=your-real-muapi-api-key
S3_ENDPOINT=https://your-s3-endpoint
S3_BUCKET=redith-assets
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
S3_ACCESS_KEY_ID=your-real-s3-access-key-id
S3_SECRET_ACCESS_KEY=your-real-s3-secret-access-key
```

Keep `.env` only on the server. Do not commit it to git.

### 4. Start with Docker Compose

```bash
docker compose up -d --build
```

Check whether the container is running:

```bash
docker compose ps
```

Check logs if the service does not start:

```bash
docker compose logs -f app
```

Open the service directly:

```text
http://your-server-ip:4173
```

If you access the app directly by IP and port, make sure the cloud server security group/firewall allows inbound TCP `4173`.

### 5. Reverse Proxy and HTTPS

For production, it is recommended to expose only ports `80` and `443`, then proxy traffic to `127.0.0.1:4173`.

Example Nginx server block:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 200m;

    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

After configuring DNS and Nginx, use Certbot or another ACME client to enable HTTPS.

### 6. Common Operations

Restart the app:

```bash
docker compose restart app
```

Stop the app:

```bash
docker compose down
```

Update to the latest version:

```bash
git pull
docker compose up -d --build
```

View recent logs:

```bash
docker compose logs --tail=100 app
```

Rebuild from scratch:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 7. Troubleshooting

If the app reports missing environment variables, check `.env`:

```bash
docker compose config
```

If uploads fail, verify S3 endpoint, bucket, access key, secret key, and whether `S3_FORCE_PATH_STYLE` matches your object storage provider.

If video generation requests time out, increase these values in `.env`:

```env
UPSTREAM_CONNECT_TIMEOUT_MS=30000
UPSTREAM_REQUEST_TIMEOUT_MS=90000
UPSTREAM_FETCH_RETRIES=2
```

## Notes

- The server only exposes `/`, `/app.js`, `/styles.css`, and `/assets` as static resources.
- API keys stay on the server and are not sent to the frontend.
- The Docker image uses `node:20-alpine`.
