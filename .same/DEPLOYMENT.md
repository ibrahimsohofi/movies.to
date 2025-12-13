# Movies.to - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Generate secure JWT_SECRET (32+ characters)
- [ ] Generate secure SESSION_SECRET (32+ characters)
- [ ] Set FRONTEND_URL to your production domain
- [ ] Set VITE_API_BASE_URL to your backend API URL
- [ ] Get TMDB API key from https://www.themoviedb.org
- [ ] Optional: Get Resend API key for email functionality

Generate secure secrets:
```bash
openssl rand -base64 32
```

### 2. Security Hardening
- [ ] Change default admin password
- [ ] Review and update CORS origins
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Increase BCRYPT_ROUNDS to 12
- [ ] Review rate limiting settings

### 3. Database
- [ ] Run database migrations
- [ ] Set up database backups
- [ ] For production scale, consider MySQL instead of SQLite
- [ ] Test database connections

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended)

**Pros:** Easy setup, includes all services, isolated environment
**Best for:** Small to medium deployments

```bash
# 1. Clone repository
git clone https://github.com/yourusername/movies.to.git
cd movies.to

# 2. Create production environment file
cp .env.production.template .env.production
# Edit .env.production with your values

# 3. Build and start services
docker-compose up -d

# 4. Initialize database
docker-compose exec backend bun run db:setup

# 5. Check logs
docker-compose logs -f
```

Access your app at http://localhost or your domain.

### Option 2: Separate Frontend/Backend Deployment

#### Frontend (Netlify/Vercel)

**Netlify:**
```bash
# 1. Build frontend
bun run build

# 2. Deploy
netlify deploy --prod --dir=dist

# Or use Netlify UI for continuous deployment
```

**Vercel:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod
```

**Environment Variables (Netlify/Vercel):**
- VITE_TMDB_API_KEY
- VITE_TMDB_BASE_URL
- VITE_TMDB_IMAGE_BASE_URL
- VITE_API_BASE_URL

#### Backend (Railway/Render/DigitalOcean)

**Railway:**
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

**Render:**
1. Connect your GitHub repository
2. Create new Web Service
3. Set build command: `cd backend && bun install`
4. Set start command: `cd backend && bun run start`
5. Add environment variables from .env.production.template

**DigitalOcean App Platform:**
1. Connect repository
2. Configure backend component:
   - Run Command: `cd backend && bun run start`
   - Build Command: `cd backend && bun install && bun run db:setup`
3. Add environment variables
4. Deploy

### Option 3: VPS Deployment (Ubuntu)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install dependencies
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://bun.sh/install | bash

# 3. Clone repository
git clone https://github.com/yourusername/movies.to.git
cd movies.to

# 4. Setup backend
cd backend
bun install
cp .env.example .env
# Edit .env with production values
bun run db:setup
bun run start &

# 5. Setup frontend
cd ..
bun install
bun run build

# 6. Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/movies-to
sudo ln -s /etc/nginx/sites-available/movies-to /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. Setup SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 8. Setup PM2 for process management
npm install -g pm2
cd backend
pm2 start src/server.js --name movies-backend
pm2 startup
pm2 save
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### Using Cloudflare (Free CDN + SSL)

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS (Full or Full Strict)
4. Enable Auto HTTPS Rewrites
5. Configure firewall rules

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com
```

### Database Backup

```bash
# Backup SQLite database
cp backend/database.sqlite backend/backups/database-$(date +%Y%m%d).sqlite

# Automated backup (cron)
0 2 * * * cd /path/to/movies.to/backend && cp database.sqlite backups/database-$(date +\%Y\%m\%d).sqlite
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2 logs
pm2 logs movies-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart (Docker)
docker-compose down
docker-compose up -d --build

# Or with PM2
cd backend
git pull
bun install
pm2 restart movies-backend
```

### Database Migrations

```bash
# Run migrations
cd backend
bun run migrate

# Or with Docker
docker-compose exec backend bun run migrate
```

## 🐛 Troubleshooting

### Backend won't start
- Check environment variables
- Verify database connection
- Check port availability: `sudo lsof -i :5000`
- Review logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Verify VITE_API_BASE_URL is correct
- Check CORS configuration
- Verify backend is running: `curl http://backend:5000/health`
- Check network connectivity

### Database errors
- Verify DB_PATH is correct
- Check file permissions
- Run database setup: `bun run db:setup`
- Check SQLite installation

### SSL/HTTPS issues
- Verify DNS points to your server
- Check firewall allows ports 80 and 443
- Review Nginx configuration
- Check certbot renewal: `sudo certbot renew --dry-run`

## 📈 Performance Optimization

### Frontend
- Enable gzip compression in Nginx
- Use CDN for static assets (Cloudflare)
- Optimize images
- Enable browser caching

### Backend
- Enable Redis for caching (optional)
- Optimize database queries
- Use connection pooling
- Enable response compression

### Nginx Configuration
```nginx
# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Enable caching
location /assets {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔐 Security Best Practices

1. **Keep secrets secure**
   - Never commit .env files
   - Use environment variables
   - Rotate secrets regularly

2. **Database security**
   - Regular backups
   - Limit database access
   - Use strong passwords

3. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Apply patches promptly

4. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor server resources
   - Set up alerts

5. **Access Control**
   - Use SSH keys instead of passwords
   - Implement 2FA where possible
   - Limit sudo access
   - Use firewall (ufw)

## 📞 Support

For issues or questions:
- Check logs first
- Review this deployment guide
- Check GitHub issues
- Contact support@movies.to
