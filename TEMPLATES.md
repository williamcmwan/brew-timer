# Recipe Templates System

The Coffee Brew Timer now includes a comprehensive recipe template system that allows administrators to manage recipe templates and users to easily create recipes from these templates.

## Overview

- **Recipe Templates**: Pre-defined brewing recipes managed by administrators
- **Guest Users**: Users can create recipes from templates without authentication
- **Admin Panel**: Secure interface for managing recipe templates
- **Migration**: Automatic migration from existing brew-journal.db

## Database Schema

### Recipe Templates
```sql
recipe_templates (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  ratio TEXT,
  dose REAL,
  photo TEXT,
  process TEXT,
  process_steps TEXT,
  grind_size REAL,
  water REAL,
  yield REAL,
  temperature REAL,
  brew_time TEXT,
  grinder_model TEXT,
  brewer_model TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

### User Recipes
```sql
recipes (
  id INTEGER PRIMARY KEY,
  guest_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ratio TEXT,
  dose REAL,
  photo TEXT,
  process TEXT,
  process_steps TEXT,
  grind_size REAL,
  water REAL,
  yield REAL,
  temperature REAL,
  brew_time TEXT,
  favorite INTEGER DEFAULT 0,
  template_id INTEGER,  -- Links to recipe_templates
  created_at TEXT
)
```

## API Endpoints

### Public Template Endpoints
- `GET /api/recipes/templates` - Get all recipe templates
- `POST /api/recipes/from-template/:templateId` - Create recipe from template

### Admin Template Endpoints (Requires Admin Key)
- `GET /api/admin/templates` - Get all templates (admin)
- `POST /api/admin/templates` - Create new template
- `PUT /api/admin/templates/:id` - Update template
- `DELETE /api/admin/templates/:id` - Delete template
- `GET /api/admin/stats` - Get admin dashboard stats

## Admin Authentication

Admin endpoints require an admin key passed via:
- Header: `X-Admin-Key: your-admin-key`
- Query parameter: `?key=your-admin-key`

Default admin key: `coffee-admin-2024` (configurable via `ADMIN_KEY` environment variable)

## Migration from Brew Journal

To migrate existing recipes from `brew-journal.db` to recipe templates:

```bash
# Run migration script
npm run migrate

# Copy recipe images
npm run copy-images

# Or run directly
cd server && npx tsx src/scripts/migrate-recipes.ts
cd server && npx tsx src/scripts/copy-template-images.ts
```

The migration process:
1. **Recipe Migration**: Reads all recipes from `brew-journal.db`, includes grinder and brewer model information, converts to recipe templates in `coffee-timer.db`
2. **Image Migration**: Copies recipe photos from `server/data/uploads/` to `server/data/template-images/`, updates photo paths in templates, serves images at `/template-images/[filename]`

## User Experience

### For Users
1. **Browse Templates**: See all available recipe templates
2. **Use Template**: Create a recipe directly from a template
3. **Copy & Customize**: Copy template data to create a custom recipe
4. **Local Storage**: All user recipes stored locally with API backup

### Template Selection Flow
1. User clicks "Add Recipe" 
2. Dialog shows "Use Recipe Template" option
3. Templates displayed with preview information
4. User can either:
   - **Use**: Creates recipe directly from template
   - **Copy**: Copies template data for customization

## Admin Panel

Access the admin panel at `/admin` or click "Admin Panel" on the dashboard.

### Features
- **Authentication**: Secure admin key authentication
- **Dashboard**: View statistics (templates, users, recipes)
- **Template Management**: Create, edit, delete recipe templates
- **Migration Tools**: Import recipes from existing databases

### Admin Panel URL
```
http://localhost:5173/admin?key=coffee-admin-2024
```

## Template Data Structure

Templates include comprehensive brewing information:

```typescript
interface RecipeTemplate {
  id: string;
  name: string;
  ratio: string;           // e.g., "1:16"
  dose: number;           // Coffee dose in grams
  photo?: string;         // Template photo URL
  process: string;        // Brewing method description
  processSteps?: RecipeStep[]; // Detailed brewing steps
  grindSize: number;      // Grind setting
  water: number;          // Total water in grams
  yield: number;          // Expected yield in grams
  temperature: number;    // Water temperature in Celsius
  brewTime: string;       // Total brew time (e.g., "4:00")
  grinderModel?: string;  // Recommended grinder
  brewerModel?: string;   // Recommended brewer
}
```

## Process Steps

Templates support detailed process steps with timing:

```typescript
interface RecipeStep {
  description: string;    // Step description
  waterAmount: number;    // Water to add (cumulative)
  duration: number;       // Elapsed time in seconds
}
```

## Environment Configuration

```bash
# .env
ADMIN_KEY=your-secure-admin-key

# client/.env
VITE_API_URL=http://localhost:3003
```

## Deployment Considerations

### Security
- Use a strong, unique admin key in production
- Consider IP restrictions for admin endpoints
- Use HTTPS in production

### Database
- SQLite database stores all templates and user recipes
- Automatic backup to localStorage for offline functionality
- Regular database backups recommended

### Scaling
- Templates are cached in client application
- Consider CDN for template photos
- Database can handle thousands of templates efficiently

## Example Templates

The system comes with migrated templates from professional brewing methods:

- **James Hoffmann V60**: Detailed pour-over technique
- **Scott Rao's V60**: Simplified V60 method
- **Tetsu Kasuya 4:6 Method**: Competition-winning technique
- **Hario Switch**: Immersion-percolation hybrid
- **Espresso**: Standard espresso parameters

## Benefits

1. **Consistency**: Standardized recipes across users
2. **Education**: Learn from professional brewing methods
3. **Customization**: Use templates as starting points
4. **Simplicity**: No complex setup required
5. **Offline Support**: Works without internet connection
6. **Admin Control**: Centralized template management

## Future Enhancements

- Template categories and tags
- User ratings and reviews
- Template sharing between instances
- Batch template import/export
- Template versioning
- Community template submissions