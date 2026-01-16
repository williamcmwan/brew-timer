# Fix: Recipe Photos Not Showing in AWS Production

## Problem
Recipe photos that work locally don't show up when deployed to AWS production.

## Root Cause
Recipe images are stored in `server/data/recipe-images/` on the local filesystem. This directory is **not in git** (it's in .gitignore), so when you deploy to AWS, the images don't get transferred.

## Solution

### Option 1: Transfer Existing Images (Quick Fix)

If you have existing recipe images on your local machine that you want to see in production:

```bash
# 1. On your LOCAL machine, create a backup of images
cd /path/to/coffee-brew-timer
tar -czf recipe-images-backup.tar.gz server/data/recipe-images/

# 2. Transfer to AWS production server
scp recipe-images-backup.tar.gz ec2-user@your-aws-server:/home/ec2-user/coffee-brew-timer/

# 3. On AWS server, extract the images
ssh ec2-user@your-aws-server
cd /home/ec2-user/coffee-brew-timer
tar -xzf recipe-images-backup.tar.gz

# 4. Fix permissions
chmod -R 755 server/data/recipe-images/

# 5. Restart the app
./scripts/app.sh restart

# 6. Verify images are working
./scripts/check-images.sh
```

### Option 2: Re-upload Images (Clean Start)

If you don't have many images or want a fresh start:

1. Simply re-upload the recipe photos through the app UI in production
2. The images will be stored correctly in the production server's filesystem

### Option 3: Verify Setup (If images should already be there)

```bash
# On AWS server, run diagnostics
./scripts/check-images.sh

# Check if server is serving images
curl -I http://localhost:3005/recipe-images/

# Check server logs
./scripts/app.sh logs | grep "recipe images"

# You should see:
# 📸 Serving recipe images from: /path/to/server/data/recipe-images
```

## Verification Steps

After applying the fix:

1. **Check directory exists and has files:**
   ```bash
   ls -la server/data/recipe-images/
   ```

2. **Check server logs:**
   ```bash
   ./scripts/app.sh logs | tail -20
   ```
   Look for: `📸 Serving recipe images from: ...`

3. **Test image endpoint:**
   ```bash
   # List an actual image file
   ls server/data/recipe-images/
   
   # Test accessing it
   curl -I http://localhost:3005/recipe-images/[actual-filename].jpg
   ```
   Should return `HTTP/1.1 200 OK`

4. **Test in browser:**
   - Open your app in production
   - Navigate to Recipes page
   - Recipe photos should now display

## Prevention: Future Deployments

### For Development/Staging
When deploying updates, remember that `server/data/` is not in git:
- Database (`coffee-timer.db`) stays on the server
- Recipe images stay on the server
- Only code changes are deployed via git

### For Production (Recommended)
Consider migrating to cloud storage for better scalability:

1. **AWS S3 for Images:**
   - Modify upload endpoints to save to S3
   - Update image URLs to use S3 URLs
   - Provides durability and CDN

2. **EBS Volume for Data:**
   - Mount EBS volume to `server/data/`
   - Provides persistence across instance replacements
   - Easy to snapshot for backups

## Backup Strategy

Set up regular backups of the data directory:

```bash
# Manual backup
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/

# Automated backup (add to crontab)
0 2 * * * cd /path/to/app && tar -czf backups/backup-$(date +\%Y\%m\%d).tar.gz server/data/
```

## Quick Reference

| Issue | Command |
|-------|---------|
| Check image status | `./scripts/check-images.sh` |
| View server logs | `./scripts/app.sh logs` |
| Restart server | `./scripts/app.sh restart` |
| Test image endpoint | `curl -I http://localhost:3005/recipe-images/` |
| Fix permissions | `chmod -R 755 server/data/` |
| Backup data | `tar -czf backup.tar.gz server/data/` |

## Need Help?

1. Run diagnostics: `./scripts/check-images.sh`
2. Check server logs: `./scripts/app.sh logs`
3. Verify the app is running: `./scripts/app.sh status`
4. See DEPLOYMENT.md for more troubleshooting steps
