import { db } from '../db/schema.js';

/**
 * Migration: Add share_to_community field to recipes table
 */
function addShareToCommunity() {
  try {
    console.log('🔄 Adding share_to_community field to recipes table...');
    
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(recipes)").all() as any[];
    const hasColumn = tableInfo.some(col => col.name === 'share_to_community');
    
    if (hasColumn) {
      console.log('✅ share_to_community column already exists');
      return;
    }
    
    // Add the column
    db.exec(`
      ALTER TABLE recipes ADD COLUMN share_to_community INTEGER DEFAULT 0;
    `);
    
    console.log('✅ Successfully added share_to_community field');
  } catch (error) {
    console.error('❌ Error adding share_to_community field:', error);
    throw error;
  }
}

// Run migration
addShareToCommunity();
