# AWS Production Deployment Steps

## Step-by-Step Guide to Fix Recipe Photos in Production

### Prerequisites
- SSH access to your AWS server
- Git repository access
- Recipe images exist locally (if you want to transfer them)

---

## Part 1: Deploy Updated Code

### 1. On Your Local Machine

```bash
# Commit and push the fixes
git add .
git commit -m "Fix: Recipe photos not showing in production"
git push origin main
```

### 2. On AWS Production Server

```bash
# SSH into your server
ssh ec2-user@your-aws-server

# Navigate to your app directory
cd /path/to/coffee-brew-timer

# Pull latest changes
git pull origin main

# Run deployment script (builds everything)
./scripts/deploy.sh

# Restart the application
./scripts/app.sh restart

# Check if server is running
./scripts/app.sh status
```

---

## Part 2: Transfer Recipe Images (If Needed)

### Option A: Transfer Existing Images from Local

**On your local machine:**
```bash
# Create backup of recipe images
./scripts/sync-images.sh backup

# This creates: recipe-images-backup-YYYYMMDD-HHMMSS.tar.gz

# Upload to AWS server
scp recipe-images-backup-*.tar.gz ec2-user@your-aws-server:/home/ec2-user/coffee-brew-timer/
```

**On AWS server:**
```bash
# Extract images
cd /home/ec2-user/coffee-brew-timer
tar -xzf recipe-images-backup-*.tar.gz

# Fix permissions
chmod -R 755 server/data/recipe-images/

# Restart server
./scripts/app.sh restart

# Clean up backup file
rm recipe-images-backup-*.tar.gz
```

### Option B: Re-upload Through App UI

If you don't have many images or want a fresh start:
1. Open your production app in browser
2. Navigate to Recipes
3. Edit each recipe and re-upload the photo
4. Images will be stored correctly on the server

---

## Part 3: Verify Everything Works

### On AWS Server

```bash
# Run diagnostics
./scripts/check-images.sh

# Expected output:
# ✓ Recipe images directory exists
# ✓ Server is running on port 3005
# ✓ Recipe images endpoint responding
```

### Check Server Logs

```bash
# View recent logs
./scripts/app.sh logs | tail -30

# Look for these messages:
# 📸 Serving recipe images from: /path/to/server/data/recipe-images
# 📦 Serving client app from: /path/to/client/dist
# 🚀 Coffee Timer API server running on port 3005
```

### Test Endpoints

```bash
# Test API health
curl http://localhost:3005/api/health

# Test image endpoint
curl -I http://localhost:3005/recipe-images/

# Test root URL
curl -I http://localhost:3005/
```

### Test in Browser

1. Open your production URL: `https://your-domain.com`
2. Navigate to Recipes page
3. Recipe photos should now display correctly
4. Try uploading a new recipe with a photo
5. Verify the new photo displays

---

## Part 4: Set Up Backups (Recommended)

### Manual Backup

```bash
# Create backup
cd /home/ec2-user/coffee-brew-timer
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/

# Download to local machine
scp ec2-user@your-aws-server:/home/ec2-user/coffee-brew-timer/backup-*.tar.gz ./
```

### Automated Backup (Cron Job)

```bash
# On AWS server, edit crontab
crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * cd /home/ec2-user/coffee-brew-timer && tar -czf backups/backup-$(date +\%Y\%m\%d).tar.gz server/data/

# Create backups directory
mkdir -p /home/ec2-user/coffee-brew-timer/backups
```

---

## Troubleshooting

### Images Still Not Showing

```bash
# 1. Check directory exists and has files
ls -la server/data/recipe-images/

# 2. Check permissions
chmod -R 755 server/data/recipe-images/

# 3. Check server logs
./scripts/app.sh logs | grep -i "recipe images"

# 4. Test image endpoint
curl -I http://localhost:3005/recipe-images/

# 5. Restart server
./scripts/app.sh restart
```

### Server Not Starting

```bash
# Check if port is in use
lsof -i :3005

# Kill existing process
lsof -ti:3005 | xargs kill -9

# Start again
./scripts/app.sh start

# Check logs for errors
./scripts/app.sh logs
```

### "Cannot GET /" Error

```bash
# Rebuild everything
./scripts/deploy.sh

# Restart
./scripts/app.sh restart

# Verify client dist exists
ls -la client/dist/

# Check server logs
./scripts/app.sh logs | grep "Serving client app"
```

---

## Quick Command Reference

```bash
# Deploy
git pull && ./scripts/deploy.sh && ./scripts/app.sh restart

# Check status
./scripts/app.sh status && ./scripts/check-images.sh

# View logs
./scripts/app.sh logs | tail -50

# Backup
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/

# Test
curl http://localhost:3005/api/health
curl -I http://localhost:3005/recipe-images/
```

---

## Expected Results

After completing these steps:

✅ Server serves React app at root URL  
✅ API endpoints work correctly  
✅ Recipe images display in the app  
✅ New image uploads work  
✅ Template images display  
✅ Server logs show no errors  

---

## Next Steps (Optional)

For better production setup, consider:

1. **AWS S3 for Images**: More scalable than filesystem storage
2. **EBS Volume**: Mount persistent volume to `server/data/`
3. **CloudFront CDN**: Faster image delivery
4. **RDS Database**: Replace SQLite for multi-instance support
5. **Load Balancer**: For high availability

See `DEPLOYMENT.md` for more details on these options.

---

## Support

If you encounter issues:

1. Run diagnostics: `./scripts/check-images.sh`
2. Check logs: `./scripts/app.sh logs`
3. Review: `AWS-IMAGE-FIX.md`
4. See: `DEPLOYMENT.md` for detailed troubleshooting

---

## Summary

The fix involves:
1. ✅ Updated server code to serve static files correctly
2. ✅ Created helper scripts for diagnostics and image sync
3. ✅ Added comprehensive documentation
4. ✅ Set up proper directory structure

Recipe images are stored on the filesystem and not in git, so they need to be transferred manually when deploying to a new server.
