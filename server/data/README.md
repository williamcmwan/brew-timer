# Data Directory Structure

This directory contains the application's data files.

## Directory Structure

```
data/
├── coffee-timer.db          # SQLite database (not in git)
├── template-images/         # Recipe template images (IN git)
│   └── *.jpg, *.png        # Template photos uploaded via admin panel
└── recipe-images/          # User recipe images (not in git)
    └── *.jpg, *.png        # Photos uploaded by users
```

## What's Tracked in Git

- ✅ `template-images/` - Template images are included in version control
- ❌ `coffee-timer.db` - Database is excluded (environment-specific)
- ❌ `recipe-images/` - User uploads are excluded (user-specific data)

## Production Deployment

### Option 1: Template Images in Git (Recommended)

Template images are automatically deployed with your code:

```bash
git add server/data/template-images/
git commit -m "Add recipe template images"
git push
```

On production server:
```bash
git pull
./scripts/deploy.sh
./scripts/app.sh start
```

### Option 2: Manual Copy

If you prefer not to track images in git, copy them manually:

```bash
# From local machine
scp -r server/data/template-images/ user@server:/path/to/app/server/data/

# On production server
./scripts/app.sh restart
```

## Adding New Template Images

1. Go to Admin panel (http://your-domain.com/admin)
2. Add/edit recipe templates with photos
3. Images are automatically saved to `server/data/template-images/`
4. Commit and push if using Option 1 above

## Backup

To backup your data:

```bash
# Backup database
cp server/data/coffee-timer.db server/data/coffee-timer.db.backup

# Backup all data
tar -czf data-backup.tar.gz server/data/
```
