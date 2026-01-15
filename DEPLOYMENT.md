# Deployment Guide - Coffee Brew Timer

This simplified coffee timer app is a static web application that can be deployed anywhere that serves static files.

## Build the Application

```bash
# Install dependencies
cd client
npm install

# Build for production
npm run build
```

The built files will be in `client/dist/` directory.

## Deployment Options

### 1. Static Hosting Services

**Netlify:**
1. Connect your GitHub repository
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/dist`
4. Deploy

**Vercel:**
1. Connect your GitHub repository
2. Set framework preset: "Vite"
3. Set root directory: `client`
4. Deploy

**GitHub Pages:**
1. Build the app locally: `cd client && npm run build`
2. Copy contents of `client/dist/` to your GitHub Pages repository
3. Push to deploy

### 2. Self-Hosted

**Simple HTTP Server:**
```bash
# After building
cd client/dist
python -m http.server 8000
# or
npx serve .
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/client/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache:**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/client/dist
    
    <Directory /path/to/client/dist>
        Options -Indexes
        AllowOverride All
        Require all granted
    </Directory>
    
    # Handle client-side routing
    FallbackResource /index.html
</VirtualHost>
```

### 3. Docker

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY client/package*.json ./
RUN npm ci --only=production

COPY client/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

And `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

Build and run:
```bash
docker build -t coffee-timer .
docker run -p 8080:80 coffee-timer
```

## Environment Configuration

The app works entirely in the browser with localStorage, so no environment variables are needed for basic functionality.

## Features After Deployment

- ✅ Recipe management (stored locally)
- ✅ Step-by-step brewing timer
- ✅ Audio notifications
- ✅ Mobile-responsive design
- ✅ Offline functionality (after first load)
- ✅ No server required
- ✅ No database needed

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 84+
- Safari 14+
- Mobile browsers with Web Audio API support

## Performance

The built app is typically:
- ~500KB gzipped
- Loads in <2 seconds on 3G
- Works offline after first visit
- No external API dependencies