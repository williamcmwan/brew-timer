# Troubleshooting Guide

Quick reference for common issues.

## Photos Not Showing in Production

**Symptoms:**
- Photos work locally but not in production
- Browser console shows 404 errors for images
- Images load from wrong URL (localhost instead of production domain)

**Diagnosis:**
```bash
./scripts/diagnose-photos.sh
```

**Common Fixes:**

### 1. Wrong Database Paths
If diagnostic shows "incorrect photo paths" (URLs contain `localhost`):
```bash
./scripts/fix-photo-paths.sh
./scripts/app.sh restart
```

### 2. Missing Image Files
If files don't exist on server:
```bash
# On local machine
./scripts/sync-images.sh backup
scp recipe-images-backup-*.tar.gz user@server:/path/to/app/

# On server
tar -xzf recipe-images-backup-*.tar.gz
chmod -R 755 server/data/recipe-images/
./scripts/app.sh restart
```

### 3. Permission Issues
```bash
chmod -R 755 server/data/template-images/
chmod -R 755 server/data/recipe-images/
./scripts/app.sh restart
```

## Server Won't Start

**Check if port is in use:**
```bash
lsof -i :3005
```

**Kill existing process:**
```bash
lsof -ti:3005 | xargs kill -9
./scripts/app.sh start
```

**Check logs:**
```bash
./scripts/app.sh logs
```

## "Cannot GET /" Error

**Rebuild and restart:**
```bash
./scripts/deploy.sh
./scripts/app.sh restart
```

**Verify client build exists:**
```bash
ls -la client/dist/
```

## Images Return 404

**Test endpoint:**
```bash
curl -I http://localhost:3005/template-images/
curl -I http://localhost:3005/recipe-images/
```

**Check server logs:**
```bash
./scripts/app.sh logs | grep "Serving.*images"
```

**Expected output:**
```
📸 Serving template images from: /path/to/server/data/template-images
📸 Serving recipe images from: /path/to/server/data/recipe-images
```

## Database Issues

**Check database exists:**
```bash
ls -la server/data/coffee-timer.db
```

**Reset database (WARNING: deletes all data):**
```bash
./scripts/app.sh stop
rm server/data/coffee-timer.db
./scripts/app.sh start
```

## Quick Commands

```bash
# Status check
./scripts/app.sh status
./scripts/check-images.sh

# View logs
./scripts/app.sh logs | tail -50

# Restart everything
./scripts/app.sh restart

# Full diagnostics
./scripts/diagnose-photos.sh

# Test API
curl http://localhost:3005/api/health

# Test images
curl -I http://localhost:3005/template-images/
```

## Getting Help

1. Run diagnostics: `./scripts/diagnose-photos.sh`
2. Check logs: `./scripts/app.sh logs`
3. Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
4. Check [server/data/README.md](server/data/README.md) for data directory info

## Common Patterns

| Issue | Quick Fix |
|-------|-----------|
| Photos show localhost URLs | `./scripts/fix-photo-paths.sh` |
| Photos missing | Transfer with `./scripts/sync-images.sh` |
| Server won't start | `lsof -ti:3005 \| xargs kill -9` |
| Cannot GET / | `./scripts/deploy.sh && ./scripts/app.sh restart` |
| 404 on images | Check permissions: `chmod -R 755 server/data/` |
