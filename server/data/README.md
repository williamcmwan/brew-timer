# Data Directory

This directory contains all user data for the Coffee Brew Timer application.

## Structure

```
data/
├── coffee-timer.db          # SQLite database (auto-created)
├── recipe-images/           # User-uploaded recipe photos
│   └── *.jpg, *.png
└── template-images/         # Admin template photos (in git)
    └── *.jpg, *.png
```

## Important Notes

### Recipe Images (`recipe-images/`)
- **NOT in git** (excluded via .gitignore)
- Contains user-uploaded photos
- Must be backed up separately
- When deploying to production, these files need to be transferred manually

### Template Images (`template-images/`)
- **IN git** (committed to repository)
- Contains admin-created template photos
- Automatically deployed with code

### Database (`coffee-timer.db`)
- **NOT in git** (excluded via .gitignore)
- Auto-created on first run
- Contains all recipes, equipment, and user data
- Must be backed up separately

## Deployment to AWS/Production

When deploying to a new server:

1. **First deployment:**
   ```bash
   # Directories are created automatically by deploy.sh
   ./scripts/deploy.sh
   ```

2. **Migrating existing data:**
   ```bash
   # On your local/source server
   tar -czf data-backup.tar.gz server/data/
   
   # Transfer to production
   scp data-backup.tar.gz user@production-server:/path/to/app/
   
   # On production server
   cd /path/to/app
   tar -xzf data-backup.tar.gz
   chmod -R 755 server/data/
   ```

3. **Verify images are accessible:**
   ```bash
   ./scripts/check-images.sh
   ```

## Backup Strategy

### Manual Backup
```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/

# Restore
tar -xzf backup-YYYYMMDD.tar.gz
```

### Automated Backup (Recommended)
Set up a cron job:
```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * cd /path/to/app && tar -czf backups/backup-$(date +\%Y\%m\%d).tar.gz server/data/
```

## AWS Considerations

### Option 1: EBS Volume (Simple)
- Mount an EBS volume to `server/data/`
- Provides persistence across instance restarts
- Easy to snapshot for backups

### Option 2: S3 Storage (Scalable)
- Modify upload endpoints to save directly to S3
- Store image URLs in database instead of local paths
- Provides durability and CDN capabilities
- Requires code changes to upload/serve from S3

### Option 3: Hybrid
- Keep database on EBS
- Store images in S3
- Best of both worlds for production

## Troubleshooting

**Images not showing:**
1. Check directory exists: `ls -la server/data/recipe-images/`
2. Check permissions: `chmod -R 755 server/data/`
3. Check server logs: `./scripts/app.sh logs | grep "Serving recipe images"`
4. Test endpoint: `curl -I http://localhost:3005/recipe-images/[filename]`

**Database issues:**
1. Check file exists: `ls -la server/data/coffee-timer.db`
2. Check permissions: `chmod 644 server/data/coffee-timer.db`
3. Reset database: Stop app, delete database file, restart

## Security

- Never commit `coffee-timer.db` to git (contains user data)
- Never commit `recipe-images/` to git (user-uploaded content)
- Keep `.env` file secure (contains admin keys)
- Regularly backup this directory
- Use appropriate file permissions (755 for directories, 644 for files)
