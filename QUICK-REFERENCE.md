# Quick Reference Guide

## Common Commands

### Application Management
```bash
./scripts/app.sh start      # Start the server
./scripts/app.sh stop       # Stop the server
./scripts/app.sh restart    # Restart the server
./scripts/app.sh status     # Check if running
./scripts/app.sh logs       # View logs
```

### Deployment
```bash
./scripts/deploy.sh         # Build and deploy
./scripts/check-images.sh   # Check image status
```

### Image Management
```bash
./scripts/sync-images.sh backup                    # Backup images
./scripts/sync-images.sh upload user@server:/path  # Upload to prod
./scripts/sync-images.sh download user@server:/path # Download from prod
```

## Troubleshooting

### "Cannot GET /" Error
```bash
# Check if server is running
./scripts/app.sh status

# Check logs
./scripts/app.sh logs

# Rebuild and restart
./scripts/deploy.sh
./scripts/app.sh restart
```

### Recipe Photos Not Showing
```bash
# 1. Check status
./scripts/check-images.sh

# 2. If images missing, transfer from local
./scripts/sync-images.sh upload user@server:/path/to/app

# 3. On production server
ssh user@server
cd /path/to/app
tar -xzf recipe-images-upload-*.tar.gz
chmod -R 755 server/data/recipe-images/
./scripts/app.sh restart
```

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3005

# Kill existing process
lsof -ti:3005 | xargs kill -9

# Start again
./scripts/app.sh start
```

### Check Everything
```bash
# Server status
./scripts/app.sh status

# Image status
./scripts/check-images.sh

# View logs
./scripts/app.sh logs | tail -20

# Test API
curl http://localhost:3005/api/health

# Test images
curl -I http://localhost:3005/recipe-images/
```

## File Locations

### Important Directories
```
server/data/
├── coffee-timer.db          # Database (not in git)
├── recipe-images/           # User uploads (not in git)
└── template-images/         # Admin templates (in git)
```

### Configuration
```
.env                         # Environment variables (not in git)
.env.example                 # Template for .env
```

### Scripts
```
scripts/
├── app.sh                   # App management
├── deploy.sh                # Deployment
├── check-images.sh          # Image diagnostics
└── sync-images.sh           # Image sync
```

## URLs

### Local Development
- Frontend: http://localhost:5173
- Backend: http://localhost:3005
- API Health: http://localhost:3005/api/health
- Admin Panel: http://localhost:5173/secret-admin-panel-2024

### Production
- App: https://your-domain.com
- API Health: https://your-domain.com/api/health
- Admin Panel: https://your-domain.com/secret-admin-panel-2024?key=your-key

## Environment Variables

### Required
```bash
ADMIN_KEY=your-secure-key
```

### Optional
```bash
PORT=3005
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
VITE_BUYMEACOFFEE_USERNAME=yourusername
```

## Quick Fixes

| Problem | Solution |
|---------|----------|
| Cannot GET / | `./scripts/deploy.sh && ./scripts/app.sh restart` |
| Images not showing | `./scripts/check-images.sh` then sync if needed |
| Port in use | `lsof -ti:3005 \| xargs kill -9` |
| Server won't start | Check logs: `./scripts/app.sh logs` |
| Need to backup | `./scripts/sync-images.sh backup` |

## Documentation

- **AWS-IMAGE-FIX.md** - Fix production image issues
- **DEPLOYMENT.md** - Complete deployment guide
- **FIXES-SUMMARY.md** - Summary of recent fixes
- **server/data/README.md** - Data directory info
- **README.md** - Project overview

## Support

1. Check logs: `./scripts/app.sh logs`
2. Run diagnostics: `./scripts/check-images.sh`
3. Review documentation in DEPLOYMENT.md
4. Check AWS-IMAGE-FIX.md for production issues
