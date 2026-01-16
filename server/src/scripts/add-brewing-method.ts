import { db } from '../db/schema.js';

/**
 * Migration: Add brewing_method field to recipes and recipe_templates tables
 */
function addBrewingMethod() {
  try {
    console.log('🔄 Adding brewing_method field to recipes and recipe_templates tables...');
    
    // Check if column already exists in recipes
    const recipesTableInfo = db.prepare("PRAGMA table_info(recipes)").all() as any[];
    const recipesHasColumn = recipesTableInfo.some(col => col.name === 'brewing_method');
    
    if (!recipesHasColumn) {
      db.exec(`ALTER TABLE recipes ADD COLUMN brewing_method TEXT;`);
      console.log('✅ Added brewing_method to recipes table');
    } else {
      console.log('✅ brewing_method column already exists in recipes table');
    }
    
    // Check if column already exists in recipe_templates
    const templatesTableInfo = db.prepare("PRAGMA table_info(recipe_templates)").all() as any[];
    const templatesHasColumn = templatesTableInfo.some(col => col.name === 'brewing_method');
    
    if (!templatesHasColumn) {
      db.exec(`ALTER TABLE recipe_templates ADD COLUMN brewing_method TEXT;`);
      console.log('✅ Added brewing_method to recipe_templates table');
    } else {
      console.log('✅ brewing_method column already exists in recipe_templates table');
    }
    
    console.log('✅ Successfully added brewing_method fields');
  } catch (error) {
    console.error('❌ Error adding brewing_method fields:', error);
    throw error;
  }
}

// Run migration
addBrewingMethod();
