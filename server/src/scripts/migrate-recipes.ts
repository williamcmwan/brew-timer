import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface RecipeFromBrewJournal {
  id: number;
  name: string;
  ratio: string;
  dose: number;
  photo: string | null;
  process: string | null;
  process_steps: string | null;
  grind_size: number;
  water: number;
  yield: number;
  temperature: number;
  brew_time: string;
  grinder_model: string | null;
  brewer_model: string | null;
}

export function migrateRecipesFromBrewJournal() {
  const brewJournalDbPath = path.join(__dirname, '../../data/brew-journal.db');
  
  try {
    // Check if brew-journal.db exists
    const brewJournalDb = new Database(brewJournalDbPath, { readonly: true });
    
    console.log('📖 Reading recipes from brew-journal.db...');
    
    // Get all recipes with their related data
    const recipesQuery = `
      SELECT 
        r.id,
        r.name,
        r.ratio,
        r.dose,
        r.photo,
        r.process,
        r.process_steps,
        r.grind_size,
        r.water,
        r.yield,
        r.temperature,
        r.brew_time,
        g.model as grinder_model,
        b.model as brewer_model
      FROM recipes r
      LEFT JOIN grinders g ON r.grinder_id = g.id
      LEFT JOIN brewers b ON r.brewer_id = b.id
      ORDER BY r.created_at
    `;
    
    const recipes = brewJournalDb.prepare(recipesQuery).all() as RecipeFromBrewJournal[];
    console.log(`📋 Found ${recipes.length} recipes to migrate`);
    
    if (recipes.length === 0) {
      console.log('ℹ️  No recipes found in brew-journal.db');
      brewJournalDb.close();
      return;
    }
    
    // Insert recipes as templates into coffee-timer.db
    const insertTemplate = db.prepare(`
      INSERT OR REPLACE INTO recipe_templates 
      (name, ratio, dose, photo, process, process_steps, grind_size, water, yield, 
       temperature, brew_time, grinder_model, brewer_model)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let migratedCount = 0;
    
    for (const recipe of recipes) {
      try {
        insertTemplate.run(
          recipe.name,
          recipe.ratio,
          recipe.dose,
          recipe.photo,
          recipe.process,
          recipe.process_steps,
          recipe.grind_size,
          recipe.water,
          recipe.yield,
          recipe.temperature,
          recipe.brew_time,
          recipe.grinder_model || 'Unknown Grinder',
          recipe.brewer_model || 'Unknown Brewer'
        );
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating recipe "${recipe.name}":`, error);
      }
    }
    
    brewJournalDb.close();
    console.log(`✅ Successfully migrated ${migratedCount} recipes as templates`);
    
  } catch (error: any) {
    if (error.code === 'SQLITE_CANTOPEN') {
      console.log('ℹ️  brew-journal.db not found, skipping migration');
    } else {
      console.error('❌ Error during migration:', error);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRecipesFromBrewJournal();
}