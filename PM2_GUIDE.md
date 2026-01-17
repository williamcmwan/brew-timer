# PM2 Management Guide

This guide explains how to use PM2 to manage your Coffee Brew Timer application.

## Quick Start

### 1. Build the Application
```bash
npm run build
```

### 2. Start with PM2
```bash
./pm2.sh start
```

### 3. Check Status
```bash
./pm2.sh status
```

## PM2 Commands

### Using the Helper Script

The `pm2.sh` script provides easy commands:

```bash
./pm2.sh start      # Start the application
./pm2.sh stop       # Stop the application
./pm2.sh restart    # Restart the application
./pm2.sh reload     # Reload with zero-downtime
./pm2.sh logs       # View logs in real-time
./pm2.sh status     # Show application status
./pm2.sh monit      # Open PM2 monitor dashboard
./pm2.sh info       # Show detailed information
./pm2.sh delete     # Remove from PM2
./pm2.sh startup    # Configure auto-start on boot
```

### Direct PM2 Commands

You can also use PM2 directly:

```bash
# Start
pm2 start ecosystem.config.cjs

# Stop
pm2 stop coffee-timer-server

# Restart
pm2 restart coffee-timer-server

# View logs
pm2 logs coffee-timer-server

# Monitor
pm2 monit

# List all processes
pm2 list

# Show detailed info
pm2 info coffee-timer-server

# Delete from PM2
pm2 delete coffee-timer-server
```

## Auto-Start on System Boot

To make your application start automatically when the system boots:

```bash
# 1. Generate startup script
./pm2.sh startup

# 2. Run the command shown (it will look like this):
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-username --hp /home/your-username

# 3. Start your application
./pm2.sh start

# 4. Save the PM2 process list
pm2 save
```

Now your application will automatically start when the system reboots.

## Deployment Workflow

### Initial Deployment
```bash
# 1. Build the application
npm run build

# 2. Start with PM2
./pm2.sh start

# 3. Save PM2 configuration
pm2 save
```

### Update Deployment
```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies (if needed)
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Rebuild
npm run build

# 4. Reload with zero-downtime
./pm2.sh reload
```

## Monitoring

### View Logs
```bash
# Real-time logs
./pm2.sh logs

# Last 100 lines
pm2 logs coffee-timer-server --lines 100

# Error logs only
pm2 logs coffee-timer-server --err

# Output logs only
pm2 logs coffee-timer-server --out
```

### Monitor Resources
```bash
# Terminal dashboard
./pm2.sh monit

# Web dashboard (optional)
pm2 plus
```

### Check Status
```bash
# List all processes
./pm2.sh status

# Detailed info
./pm2.sh info
```

## Log Files

PM2 logs are stored in:
- Error logs: `logs/error.log`
- Output logs: `logs/out.log`

Application logs are also in:
- `server/app.log`

## Configuration

The PM2 configuration is in `ecosystem.config.cjs`:

```javascript
{
  name: 'coffee-timer-server',
  script: 'dist/index.js',
  instances: 1,
  max_memory_restart: '500M',
  env: {
    NODE_ENV: 'production',
    PORT: 3005
  }
}
```

### Customization Options

Edit `ecosystem.config.cjs` to customize:

- **instances**: Number of instances (use `'max'` for cluster mode)
- **max_memory_restart**: Restart if memory exceeds this limit
- **env**: Environment variables
- **watch**: Enable file watching (not recommended for production)
- **cron_restart**: Schedule automatic restarts

Example for cluster mode:
```javascript
instances: 'max',
exec_mode: 'cluster'
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
./pm2.sh logs

# Check if port is in use
lsof -i :3005

# Verify build exists
ls -la server/dist/
```

### High Memory Usage
```bash
# Check memory
./pm2.sh monit

# Restart to clear memory
./pm2.sh restart
```

### Application Keeps Restarting
```bash
# View error logs
pm2 logs coffee-timer-server --err --lines 50

# Check application logs
tail -f server/app.log
```

### Remove and Restart Fresh
```bash
./pm2.sh delete
npm run build
./pm2.sh start
```

## Best Practices

1. **Always build before starting**: Run `npm run build` before starting with PM2
2. **Use reload for updates**: Use `./pm2.sh reload` for zero-downtime updates
3. **Monitor regularly**: Check `./pm2.sh status` and logs periodically
4. **Save after changes**: Run `pm2 save` after starting/stopping processes
5. **Set up auto-start**: Configure startup script for production servers
6. **Check logs**: Review logs regularly for errors or issues

## Environment Variables

Set environment variables in `ecosystem.config.cjs` or use a `.env` file:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3005,
  // Add more variables as needed
}
```

The server will also load variables from `server/.env` file.

## Additional Resources

- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 Cluster Mode: https://pm2.keymetrics.io/docs/usage/cluster-mode/
- PM2 Plus (Monitoring): https://pm2.io/
