import { db } from '../db/schema.js';

/**
 * Seeds recipes from recipe_templates table for a guest user
 * This is now handled automatically when a new guest user is created
 * This script is kept for manual seeding if needed
 */
export function seedDefaultRecipes(guestId: string = 'default') {
  try {
    // Create guest user if doesn't exist
    const guestStmt = db.prepare('INSERT OR IGNORE INTO guest_users (guest_id) VALUES (?)');
    guestStmt.run(guestId);

    // Check if guest already has recipes
    const existingRecipes = db.prepare('SELECT COUNT(*) as count FROM recipes WHERE guest_id = ?').get(guestId) as { count: number };
    
    if (existingRecipes.count > 0) {
      console.log(`Guest ${guestId} already has ${existingRecipes.count} recipes, skipping seed`);
      return;
    }

    // Get all recipe templates from admin
    const templates = db.prepare('SELECT * FROM recipe_templates').all() as any[];
    
    if (templates.length === 0) {
      console.log('⚠️  No recipe templates found in database. Please add templates via admin panel first.');
      return;
    }

    // Copy each template to guest's recipes
    const recipeStmt = db.prepare(`
      INSERT INTO recipes (guest_id, name, ratio, dose, photo, process, process_steps, 
                          grind_size, water, yield, temperature, brew_time, favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const template of templates) {
      recipeStmt.run(
        guestId,
        template.name,
        template.ratio,
        template.dose,
        template.photo,
        template.process,
        template.process_steps,
        null, // grind_size - no longer used
        template.water,
        null, // yield - no longer used
        template.temperature,
        template.brew_time,
        0 // favorite - default to false
      );
    }

    console.log(`✅ Seeded ${templates.length} recipes from templates for guest ${guestId}`);
  } catch (error) {
    console.error('❌ Error seeding recipes from templates:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDefaultRecipes();
}