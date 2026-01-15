import { db } from '../db/schema.js';

export function removeGrinderBrewerFromRecipes() {
  console.log('🔧 Removing grinder and brewer references from recipes...');
  
  try {
    // Check if columns exist first
    const recipesColumns = db.prepare("PRAGMA table_info(recipes)").all() as any[];
    const hasGrinderId = recipesColumns.some((col: any) => col.name === 'grinder_id');
    const hasBrewerId = recipesColumns.some((col: any) => col.name === 'brewer_id');
    
    if (!hasGrinderId && !hasBrewerId) {
      console.log('✅ Grinder and brewer columns already removed from recipes');
      return;
    }
    
    // Create new recipes table without grinder_id and brewer_id
    db.exec(`
      PRAGMA foreign_keys=OFF;
      
      CREATE TABLE recipes_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        template_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guest_id) REFERENCES guest_users(guest_id),
        FOREIGN KEY (template_id) REFERENCES recipe_templates(id)
      );
      
      INSERT INTO recipes_new (
        id, guest_id, name, ratio, dose, photo, process, process_steps,
        grind_size, water, yield, temperature, brew_time, favorite, 
        template_id, created_at
      )
      SELECT 
        id, guest_id, name, ratio, dose, photo, process, process_steps,
        grind_size, water, yield, temperature, brew_time, favorite,
        template_id, created_at
      FROM recipes;
      
      DROP TABLE recipes;
      ALTER TABLE recipes_new RENAME TO recipes;
      
      PRAGMA foreign_keys=ON;
    `);
    
    console.log('✅ Successfully removed grinder and brewer columns from recipes');
    
  } catch (error) {
    console.error('❌ Error removing grinder/brewer columns:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  removeGrinderBrewerFromRecipes();
}