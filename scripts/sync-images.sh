#!/bin/bash

# Script to sync recipe images between local and production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

show_usage() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  backup              Create a backup of local recipe images"
    echo "  upload <server>     Upload recipe images to production server"
    echo "  download <server>   Download recipe images from production server"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 upload ec2-user@your-server.com:/path/to/app"
    echo "  $0 download ec2-user@your-server.com:/path/to/app"
    echo ""
}

backup_images() {
    echo "=== Creating backup of recipe images ==="
    
    if [ ! -d "$PROJECT_ROOT/server/data/recipe-images" ]; then
        echo "Error: Recipe images directory not found"
        exit 1
    fi
    
    BACKUP_FILE="recipe-images-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    cd "$PROJECT_ROOT"
    tar -czf "$BACKUP_FILE" server/data/recipe-images/
    
    echo "✓ Backup created: $BACKUP_FILE"
    echo ""
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    echo "Files backed up: $(tar -tzf "$BACKUP_FILE" | wc -l)"
    echo ""
    echo "To upload to production:"
    echo "  scp $BACKUP_FILE user@server:/path/to/app/"
    echo "  ssh user@server 'cd /path/to/app && tar -xzf $BACKUP_FILE && chmod -R 755 server/data/recipe-images'"
}

upload_images() {
    if [ -z "$1" ]; then
        echo "Error: Server path required"
        echo "Example: $0 upload ec2-user@server.com:/home/ec2-user/app"
        exit 1
    fi
    
    SERVER_PATH="$1"
    
    echo "=== Uploading recipe images to production ==="
    echo "Target: $SERVER_PATH"
    echo ""
    
    # Create backup first
    BACKUP_FILE="recipe-images-upload-$(date +%Y%m%d-%H%M%S).tar.gz"
    cd "$PROJECT_ROOT"
    tar -czf "$BACKUP_FILE" server/data/recipe-images/
    
    echo "✓ Created backup: $BACKUP_FILE"
    echo "Uploading..."
    
    # Upload backup file
    scp "$BACKUP_FILE" "$SERVER_PATH/"
    
    echo "✓ Upload complete"
    echo ""
    echo "Now run on the production server:"
    echo "  cd /path/to/app"
    echo "  tar -xzf $BACKUP_FILE"
    echo "  chmod -R 755 server/data/recipe-images/"
    echo "  ./scripts/app.sh restart"
    echo "  ./scripts/check-images.sh"
    echo ""
    echo "Or run this command to do it automatically:"
    SERVER_ONLY="${SERVER_PATH%:*}"
    SERVER_DIR="${SERVER_PATH#*:}"
    echo "  ssh $SERVER_ONLY 'cd $SERVER_DIR && tar -xzf $BACKUP_FILE && chmod -R 755 server/data/recipe-images/ && ./scripts/app.sh restart'"
}

download_images() {
    if [ -z "$1" ]; then
        echo "Error: Server path required"
        echo "Example: $0 download ec2-user@server.com:/home/ec2-user/app"
        exit 1
    fi
    
    SERVER_PATH="$1"
    
    echo "=== Downloading recipe images from production ==="
    echo "Source: $SERVER_PATH"
    echo ""
    
    BACKUP_FILE="recipe-images-download-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Create backup on remote server and download
    SERVER_ONLY="${SERVER_PATH%:*}"
    SERVER_DIR="${SERVER_PATH#*:}"
    
    echo "Creating backup on remote server..."
    ssh "$SERVER_ONLY" "cd $SERVER_DIR && tar -czf $BACKUP_FILE server/data/recipe-images/"
    
    echo "Downloading..."
    scp "$SERVER_PATH/$BACKUP_FILE" "$PROJECT_ROOT/"
    
    echo "Extracting..."
    cd "$PROJECT_ROOT"
    tar -xzf "$BACKUP_FILE"
    
    echo "Cleaning up remote backup..."
    ssh "$SERVER_ONLY" "rm $SERVER_DIR/$BACKUP_FILE"
    
    echo "✓ Download complete"
    echo "✓ Images extracted to: $PROJECT_ROOT/server/data/recipe-images/"
    echo ""
    echo "Local backup saved as: $BACKUP_FILE"
}

# Main script
case "$1" in
    backup)
        backup_images
        ;;
    upload)
        upload_images "$2"
        ;;
    download)
        download_images "$2"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
