# Deployment Guide

## Production Deployment

### Prerequisites

- Node.js 18+ installed on production server
- Git access to your repository
- Port 3005 available (or configure different port)

### Initial Deployment

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd coffee-brew-timer
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your production values
   ```

   Important variables:
   - `ADMIN_KEY` - Set a secure admin password
   - `ALLOWED_ORIGINS` - Add your production domain
   - `VITE_API_URL` - Not needed in production (uses relative URLs)

3. **Run deployment script**
   ```bash
   ./scripts/deploy.sh
   ```

   This will:
   - Install dependencies for both client and server
   - Build the client (React app)
   - Build the server (TypeScript to JavaScript)
   - Create the data directory structure

4. **Start the application**
   ```bash
   ./scripts/app.sh start
   ```

   The app will be available at `http://localhost:3005`

### Template Images

Template images are **included in git** and will be automatically deployed with your code.

Location: `server/data/template-images/`

When you add new templates via the admin panel, commit them:
```bash
git add server/data/template-images/
git commit -m "Add new recipe templates"
git push
```

### Updating Production

```bash
# Pull latest changes
git pull

# Rebuild
./scripts/deploy.sh

# Restart
./scripts/app.sh restart
```

### Application Management

```bash
# Start the app
./scripts/app.sh start

# Stop the app
./scripts/app.sh stop

# Restart the app
./scripts/app.sh restart

# Check status
./scripts/app.sh status

# View logs
./scripts/app.sh logs
```

### File Structure in Production

```
coffee-brew-timer/
├── server/
│   ├── data/
│   │   ├── coffee-timer.db          # Created automatically
│   │   ├── template-images/         # From git
│   │   │   └── *.jpg, *.png
│   │   └── recipe-images/           # User uploads
│   │       └── *.jpg, *.png
│   ├── dist/                        # Built server code
│   └── node_modules/
├── client/
│   ├── dist/                        # Built React app
│   └── node_modules/
└── .env                             # Your environment config
```

### Reverse Proxy Setup (Optional)

If using nginx to serve on port 80/443:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Troubleshooting

**Quick Diagnostics:**
```bash
# Run the image serving diagnostic script
./scripts/check-images.sh
```

This will check:
- If image directories exist and contain files
- If the server is running
- If image endpoints are responding
- File permissions

**Recipe photos not showing in production:**

This happens when images uploaded locally aren't transferred to production. Here's how to fix it:

1. **Check if images directory exists on production:**
   ```bash
   ls -la server/data/recipe-images/
   ```

2. **If directory is empty, images need to be uploaded again:**
   - Option A: Re-upload images through the app UI in production
   - Option B: Transfer images from local to production:
     ```bash
     # On your local machine, create a backup
     tar -czf recipe-images-backup.tar.gz server/data/recipe-images/
     
     # Transfer to production server
     scp recipe-images-backup.tar.gz user@your-server:/path/to/coffee-brew-timer/
     
     # On production server, extract
     cd /path/to/coffee-brew-timer
     tar -xzf recipe-images-backup.tar.gz
     ```

3. **Verify images are being served:**
   ```bash
   # Check server logs for image serving message
   ./scripts/app.sh logs | grep "Serving recipe images"
   
   # Test image access directly
   curl -I http://localhost:3005/recipe-images/[filename].jpg
   ```

4. **Check file permissions:**
   ```bash
   # Ensure the server can read the images
   chmod -R 755 server/data/recipe-images/
   ```

**Important Notes:**
- Recipe images are stored in `server/data/recipe-images/` on the filesystem
- These images are NOT in git (they're in .gitignore)
- When deploying to a new server, you need to transfer existing images manually
- Consider using cloud storage (S3, Cloudinary) for production if you need persistence across deployments

**"Cannot GET /" error:**
- This means the server isn't serving the React app
- Make sure you ran `./scripts/deploy.sh` to build both client and server
- Check server logs: `./scripts/app.sh logs`
- Look for "📦 Serving client app from:" message in logs
- If missing, rebuild: `npm run build --prefix client && npm run build --prefix server`
- Then restart: `./scripts/app.sh restart`

**Images not showing:**
- Check `server/data/template-images/` exists and has images
- Check server logs: `./scripts/app.sh logs`
- Verify images are served: `curl http://localhost:3005/template-images/[filename]`

**Port already in use:**
```bash
# Find and kill process on port 3005
lsof -ti:3005 | xargs kill -9
./scripts/app.sh start
```

**Database issues:**
- Database is created automatically on first run
- Location: `server/data/coffee-timer.db`
- To reset: stop app, delete database, restart

### Backup

```bash
# Backup database and images
tar -czf backup-$(date +%Y%m%d).tar.gz server/data/

# Restore
tar -xzf backup-YYYYMMDD.tar.gz
```

### AWS/Cloud Deployment Considerations

**Persistent Storage:**
- The `server/data/` directory contains user-uploaded images and the database
- On AWS EC2: This directory persists across app restarts but NOT across instance replacements
- For production, consider:
  - Using an EBS volume mounted to `server/data/`
  - Or migrating to cloud storage (S3) for images
  - Using RDS or managed database for the SQLite database

**Image Storage Options:**

1. **Current Setup (Filesystem):**
   - Images stored in `server/data/recipe-images/`
   - Simple but not scalable for multiple servers
   - Requires manual backup/transfer

2. **AWS S3 (Recommended for production):**
   - Modify upload endpoints to save to S3
   - Update image URLs to use S3 URLs
   - Provides durability and CDN capabilities
   - See AWS S3 documentation for implementation

**Environment Variables for Production:**
```bash
# Add to your .env file on production
NODE_ENV=production
PORT=3005
ADMIN_KEY=your-secure-admin-key
ALLOWED_ORIGINS=https://your-domain.com
```

### Security Checklist

- [ ] Change `ADMIN_KEY` from default
- [ ] Set `ALLOWED_ORIGINS` to your domain only
- [ ] Use HTTPS in production (via reverse proxy)
- [ ] Keep `.env` file secure (never commit to git)
- [ ] Regularly backup `server/data/`
