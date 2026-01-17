#!/bin/bash

# PM2 Management Script for Coffee Brew Timer

case "$1" in
  start)
    echo "🚀 Starting Coffee Timer with PM2..."
    pm2 start ecosystem.config.cjs
    pm2 save
    echo "✅ Application started!"
    ;;
    
  stop)
    echo "🛑 Stopping Coffee Timer..."
    pm2 stop coffee-timer-server
    echo "✅ Application stopped!"
    ;;
    
  restart)
    echo "🔄 Restarting Coffee Timer..."
    pm2 restart coffee-timer-server
    echo "✅ Application restarted!"
    ;;
    
  reload)
    echo "🔄 Reloading Coffee Timer (zero-downtime)..."
    pm2 reload coffee-timer-server
    echo "✅ Application reloaded!"
    ;;
    
  delete)
    echo "🗑️  Removing Coffee Timer from PM2..."
    pm2 delete coffee-timer-server
    pm2 save
    echo "✅ Application removed from PM2!"
    ;;
    
  logs)
    echo "📋 Showing logs (Ctrl+C to exit)..."
    pm2 logs coffee-timer-server
    ;;
    
  status)
    echo "📊 Application Status:"
    pm2 list
    ;;
    
  monit)
    echo "📊 Opening PM2 Monitor (Ctrl+C to exit)..."
    pm2 monit
    ;;
    
  info)
    echo "ℹ️  Application Info:"
    pm2 info coffee-timer-server
    ;;
    
  startup)
    echo "🔧 Setting up PM2 to start on system boot..."
    pm2 startup
    echo ""
    echo "⚠️  Run the command shown above, then run:"
    echo "   ./pm2.sh start"
    echo "   pm2 save"
    ;;
    
  *)
    echo "Coffee Brew Timer - PM2 Management"
    echo ""
    echo "Usage: ./pm2.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start    - Start the application"
    echo "  stop     - Stop the application"
    echo "  restart  - Restart the application"
    echo "  reload   - Reload with zero-downtime"
    echo "  delete   - Remove from PM2"
    echo "  logs     - View application logs"
    echo "  status   - Show application status"
    echo "  monit    - Open PM2 monitor"
    echo "  info     - Show detailed info"
    echo "  startup  - Configure PM2 to start on boot"
    echo ""
    echo "Examples:"
    echo "  ./pm2.sh start"
    echo "  ./pm2.sh logs"
    echo "  ./pm2.sh status"
    ;;
esac
