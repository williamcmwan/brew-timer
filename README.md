# Coffee Brew Timer

A simple, focused coffee brewing timer application that helps you brew perfect coffee every time.

## Documentation

- **[README.md](README.md)** - Project overview and features (you are here)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and fixes
- **[server/data/README.md](server/data/README.md)** - Data directory structure

## Features

- **Recipe Management**: Create and manage your favorite coffee brewing recipes
- **Recipe Templates**: Pre-defined brewing recipes for easy setup
- **Step-by-Step Timer**: Guided brewing with timed steps and audio cues
- **Local Storage**: All recipes stored locally in your browser - no login required
- **Mobile Friendly**: Optimized for mobile devices and touch interfaces
- **Audio Feedback**: Sound notifications for step transitions and countdown alerts
- **Admin Panel**: Manage recipe templates for all users (hidden, accessible via special URL)
- **Buy Me a Coffee**: Support button integrated on all pages
- **Cookie Notice**: GDPR-friendly cookie consent banner with privacy policy link
- **Contact Form**: EmailJS-powered contact form with reCAPTCHA spam protection
- **Privacy Policy**: Comprehensive privacy policy page explaining data practices

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

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

### Quick Deploy

```bash
# Build and deploy
./scripts/deploy.sh

# Start the application
./scripts/app.sh start

# Check status
./scripts/app.sh status
./scripts/check-images.sh
```

### Helper Scripts

```bash
./scripts/app.sh [start|stop|restart|status|logs]  # App management
./scripts/check-images.sh                          # Image diagnostics
./scripts/diagnose-photos.sh                       # Detailed photo check
./scripts/sync-images.sh [backup|upload|download]  # Image sync
./scripts/fix-photo-paths.sh                       # Fix database paths
```

**Important:** Recipe images are stored in `server/data/recipe-images/` and are NOT in git. When deploying to production, you may need to transfer images manually. See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

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

The admin panel is hidden from regular users and accessible via a special URL:

```
http://localhost:5173/secret-admin-panel-2024
```

Or with auto-authentication:
```
http://localhost:5173/secret-admin-panel-2024?key=your-admin-key
```

**Production URL:**
```
https://yourdomain.com/secret-admin-panel-2024?key=your-admin-key
```

Default admin key: `coffee-admin-2024` (change via `ADMIN_KEY` environment variable in server/.env)

**Security Notes:**
- The admin panel is not linked from any public page
- Requires admin key authentication
- Consider changing the URL path in production for additional security
- Use a strong admin key in production
- Consider IP restrictions for production deployments

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

All environment variables are configured in the root `.env` file.

### Root .env
```bash
# Admin key for template management
ADMIN_KEY=coffee-admin-2024

# API URL for the coffee timer backend
VITE_API_URL=http://localhost:3003

# Buy Me a Coffee username
VITE_BUYMEACOFFEE_USERNAME=yourusername

# EmailJS Configuration (for contact form)
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key

# Google reCAPTCHA v2 (for contact form)
VITE_RECAPTCHA_SITE_KEY=your_site_key

# Server port
PORT=3003

# Node environment
NODE_ENV=production
```

**Buy Me a Coffee Setup:**
1. Create an account at [buymeacoffee.com](https://www.buymeacoffee.com/)
2. Get your username from your profile URL (e.g., `buymeacoffee.com/yourusername`)
3. Set `VITE_BUYMEACOFFEE_USERNAME` in root `.env`
4. The button will appear on all pages with the official Buy Me a Coffee design

**Contact Form Setup:**

*EmailJS Configuration:*
1. Create account at [emailjs.com](https://www.emailjs.com/)
2. Add an email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{from_name}}` - Sender's name
   - `{{from_email}}` - Sender's email
   - `{{subject}}` - Message subject
   - `{{message}}` - Message content
4. Copy your Service ID, Template ID, and Public Key
5. Set the values in root `.env`:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

*reCAPTCHA Configuration:*
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register a new site with reCAPTCHA v2 "I'm not a robot" Checkbox
3. Add your domains (localhost for development)
4. Copy the Site Key
5. Set `VITE_RECAPTCHA_SITE_KEY` in root `.env`

The contact form is accessible at `/contact` and includes spam protection via reCAPTCHA.

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
