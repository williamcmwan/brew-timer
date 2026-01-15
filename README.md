# Coffee Brew Timer

A simple, focused coffee brewing timer application that helps you brew perfect coffee every time.

## Features

- **Recipe Management**: Create and manage your favorite coffee brewing recipes
- **Recipe Templates**: Pre-defined brewing recipes for easy setup
- **Step-by-Step Timer**: Guided brewing with timed steps and audio cues
- **Local Storage**: All recipes stored locally in your browser - no login required
- **Mobile Friendly**: Optimized for mobile devices and touch interfaces
- **Audio Feedback**: Sound notifications for step transitions and countdown alerts
- **Admin Panel**: Manage recipe templates for all users

## Quick Start

### For Users

1. **Browse Recipes**: View available recipes on the dashboard
2. **Start Brewing**: Select a recipe to start the guided timer
3. **Add Custom Recipes**: Create your own recipes or copy from templates
4. **Follow Steps**: The timer guides you through each brewing step with audio cues

### Default Recipes

The app comes with three pre-loaded recipes:
- **V60 Pour Over**: Classic pour-over method with bloom and multiple pours
- **Chemex Classic**: Chemex brewing with structured timing
- **French Press**: Simple immersion brewing method

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

This will start:
- Client (frontend) at http://localhost:5173
- Server (backend) at http://localhost:3003

### Client Only (Frontend)
```bash
cd client
npm install
npm run dev
```

### Server Only (Backend)
```bash
cd server
npm install
npm run dev
```

## Production Deployment

### Build the Application

```bash
# Build client
cd client
npm install
npm run build

# Build server
cd server
npm install
npm run build
```

### Deployment Scripts

```bash
# Full deployment (builds both client and server)
./scripts/deploy.sh

# Start the application
./scripts/app.sh start

# Stop the application
./scripts/app.sh stop

# Check status
./scripts/app.sh status

# View logs
./scripts/app.sh logs
```

### Deployment Options

#### 1. Static Hosting (Client Only)

**Netlify / Vercel:**
1. Connect your GitHub repository
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/dist`
4. Deploy

**GitHub Pages:**
```bash
cd client && npm run build
# Copy contents of client/dist/ to your GitHub Pages repository
```

#### 2. Self-Hosted with Server

**Using the deployment script:**
```bash
./scripts/deploy.sh
./scripts/app.sh start
```

**Manual deployment:**
```bash
# Build
cd client && npm run build
cd ../server && npm run build

# Start server (serves both API and static files)
cd server
node dist/index.js
```

#### 3. Docker

```dockerfile
FROM node:18-alpine as builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Build server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/client/dist ./public

EXPOSE 3003
CMD ["node", "dist/index.js"]
```

## Recipe Templates System

### For Users

**Using Templates:**
1. Click "Add Recipe" on the dashboard
2. Click "Copy from templates" to see available templates
3. Select a template to copy its settings
4. Customize as needed and save

**Creating Custom Recipes:**
- Name and brewing method
- Coffee dose and water ratio
- Water temperature
- Step-by-step process with timing
- Target yield

### For Administrators

**Access Admin Panel:**
```
http://localhost:5173/admin?key=your-admin-key
```

Default admin key: `coffee-admin-2024` (change via `ADMIN_KEY` environment variable)

**Admin Features:**
- View statistics (templates, users, recipes)
- Create, edit, delete recipe templates
- Manage template photos
- View user activity

**API Endpoints:**
- `GET /api/admin/templates` - Get all templates
- `POST /api/admin/templates` - Create template
- `PUT /api/admin/templates/:id` - Update template
- `DELETE /api/admin/templates/:id` - Delete template
- `GET /api/admin/stats` - Get statistics

All admin endpoints require `X-Admin-Key` header.

## Recipe Structure

### Recipe Template
```typescript
interface RecipeTemplate {
  id: string;
  name: string;
  ratio: string;           // e.g., "1:16"
  dose: number;           // Coffee dose in grams
  photo?: string;         // Template photo URL
  process: string;        // Brewing method description
  processSteps?: RecipeStep[]; // Detailed brewing steps
  water: number;          // Total water in grams
  temperature: number;    // Water temperature in Celsius
  brewTime: string;       // Total brew time (e.g., "4:00")
}
```

### Process Steps
```typescript
interface RecipeStep {
  description: string;    // Step description (e.g., "Bloom")
  waterAmount: number;    // Cumulative water in grams
  duration: number;       // Elapsed time in seconds
}
```

## Environment Configuration

### Server (.env)
```bash
PORT=3003
ADMIN_KEY=your-secure-admin-key
NODE_ENV=production
```

### Client (client/.env)
```bash
VITE_API_URL=http://localhost:3003
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Storage**: Browser localStorage + API backup
- **Audio**: Web Audio API for timer sounds

## Architecture

### Simplified Design
- No user authentication required for basic features
- Recipes stored locally in browser with API backup
- Admin panel for template management
- Offline functionality after first load
- Mobile-first responsive design

### Data Flow
1. **Templates**: Managed by admin, served via API
2. **User Recipes**: Created from templates or custom, stored locally
3. **Timer**: Runs entirely in browser with audio feedback
4. **Sync**: Optional API backup for user recipes

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 84+
- Safari 14+
- Mobile browsers with Web Audio API support

## Performance

- ~500KB gzipped bundle
- Loads in <2 seconds on 3G
- Works offline after first visit
- No external API dependencies for basic features

## Security

### Admin Panel
- Secure admin key authentication
- Consider IP restrictions in production
- Use HTTPS in production
- Change default admin key

### User Data
- Stored locally in browser
- Optional API backup
- No personal information required
- Guest ID for API sync

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or contributions, please visit the GitHub repository.

---

Perfect for coffee enthusiasts who want a simple, reliable brewing timer without the complexity of a full brew journal system.
