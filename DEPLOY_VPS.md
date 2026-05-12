# Deploy StockPilot Back on a Fresh VPS (Dockerized)

This guide configures a fresh Linux VPS (Ubuntu recommended) for automatic deployment via GitHub Actions.

## 1) Prepare the VPS (one time)

Run as root (or with sudo):

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git ufw

# Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker
```

Optional firewall:

```bash
ufw allow OpenSSH
ufw allow 4000/tcp
ufw --force enable
```

## 2) Create deploy user

```bash
adduser deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chown -R deploy:deploy /home/deploy/.ssh
```

## 3) Add GitHub Actions SSH public key

On your local machine, create a dedicated key pair:

```bash
ssh-keygen -t ed25519 -C "github-actions-stockpilot" -f stockpilot_actions
```

Then append `stockpilot_actions.pub` content to VPS:

```bash
nano /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
```

## 4) Clone project on VPS

```bash
su - deploy
mkdir -p /home/deploy/apps
cd /home/deploy/apps
git clone https://github.com/jordanefossitalla-hash/StockPilot-back.git
cd StockPilot-back/app
cp .env.production.example .env
nano .env
```

Update all sensitive values in `.env`.

## 5) First manual start test on VPS

```bash
cd /home/deploy/apps/StockPilot-back
docker compose -f app/docker-compose.prod.yml up -d --build
docker compose -f app/docker-compose.prod.yml exec -T api npx prisma migrate deploy
```

Health check:

```bash
curl http://localhost:4000/api/v1/health
```

## 6) Configure GitHub repository secrets

Go to: Repository > Settings > Secrets and variables > Actions > New repository secret

Create these secrets:

- `VPS_HOST`: VPS public IP or domain
- `VPS_USER`: deploy
- `VPS_PORT`: 22
- `VPS_PASSWORD`: SSH password for VPS_USER (temporary option)
- `VPS_APP_DIR`: /home/deploy/apps/StockPilot-back

Temporary fast-start option:
- `VPS_USER`: root
- `VPS_APP_DIR`: /root/apps/StockPilot-back

Security recommendation:
- Move to SSH key auth with non-root deploy user as soon as possible.

## 7) Trigger deployment

Push to `main` branch or run workflow manually:

- Actions > CD to VPS > Run workflow

The CD workflow does:
- git reset to origin/main
- docker compose up -d --build
- prisma migrate deploy

## 8) Operate in production

Useful commands on VPS:

```bash
cd /home/deploy/apps/StockPilot-back
docker compose -f app/docker-compose.prod.yml ps
docker compose -f app/docker-compose.prod.yml logs -f api
docker compose -f app/docker-compose.prod.yml restart api
```

## 9) Recommended next hardening

- Put Nginx/Caddy in front with HTTPS (Let's Encrypt)
- Restrict DB port (already internal in prod compose)
- Rotate JWT secrets regularly
- Set backup policy for PostgreSQL volume
