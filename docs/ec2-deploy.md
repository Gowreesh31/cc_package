# EC2 Deployment Runbook (Docker Compose Build-On-EC2)

## 1. EC2 prerequisites

- Ubuntu 22.04+ (or Amazon Linux 2023)
- Security Group inbound:
  - `80` from `0.0.0.0/0`
  - `443` from `0.0.0.0/0` (for HTTPS)
  - `22` from your IP only

## 2. Install Docker and Compose plugin

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Pull project code

```bash
git clone <your-repo-url>
cd cc_pack
```

If code already exists:

```bash
git pull
```

## 4. Configure environment

```bash
cp .env.example .env
```

Set at minimum:
- `GEMINI_API_KEY`
- `SESSION_SECRET` (long random value)
- `APP_URL=http://<EC2_PUBLIC_IP>`
- `POSTGRES_*` values (or keep defaults for class project)

## 5. Build and run

```bash
docker compose up -d --build
```

## 6. Validate deployment

```bash
docker compose ps
curl http://localhost/api/health
curl http://<EC2_PUBLIC_IP>/api/health
```

Expected services:
- `sc_nginx`
- `sc_api`
- `sc_redis`
- `sc_postgres`

## 7. Update workflow for new code

Each time code changes:

```bash
git pull
docker compose up -d --build
```

## 8. HTTPS + Domain setup (recommended: ALB TLS termination)

For production-style TLS on AWS:

1. Create an ACM certificate for your domain (for example `app.example.com`).
2. Put an Application Load Balancer in front of EC2:
   - Listener `443` with ACM cert
   - Target group to EC2 on port `80`
3. Point your domain DNS (Route53) to ALB.
4. Keep docker stack on EC2 as-is (nginx on `80`).
5. Update `.env` and redeploy:
   - `APP_URL=https://app.example.com`
   - `docker compose up -d --build`

## 9. CI/CD auto-deploy from GitHub Actions

Workflow file: `.github/workflows/deploy-ec2.yml`

Set GitHub repository secrets:
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_PRIVATE_KEY`
- `EC2_APP_PATH`

Every push to `main`:
1. Runs `npm ci`, `npm run prisma:generate`, `npm run lint`, `npm run build`
2. SSH into EC2
3. Runs `git pull` and `docker compose up -d --build`

## 10. Useful troubleshooting

```bash
docker compose logs api --tail=200
docker compose logs nginx --tail=200
docker compose logs postgres --tail=200
docker compose logs redis --tail=200
```

If DB schema errors appear:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```
