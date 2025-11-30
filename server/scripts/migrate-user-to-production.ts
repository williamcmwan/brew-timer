/**
 * Migrate User Data to Production Script
 * 
 * This script exports all data for a specific user from the development database
 * and imports it to production, handling ID remapping for user and equipment.
 * 
 * Usage:
 *   cd server && npx tsx scripts/migrate-user-to-production.ts --dry-run
 *   cd server && npx tsx scripts/migrate-user-to-production.ts --export
 *   cd server && npx tsx scripts/migrate-user-to-production.ts --import --prod-db=/path/to/prod.db
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const SOURCE_EMAIL = 'admin@admin.com';
const EXPORT_FILE = 'data/user-export.json';
const PHOTOS_EXPORT_DIR = 'data/user-export-photos';

const devDbPath = path.join(process.cwd(), 'data/brew-journal.db');
const uploadsDir = path.join(process.cwd(), 'data/uploads');
const exportPath = path.join(process.cwd(), EXPORT_FILE);
const photosExportPath = path.join(process.cwd(), PHOTOS_EXPORT_DIR);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isExport = args.includes('--export');
const isImport = args.includes('--import');
const prodDbArg = args.find(a => a.startsWith('--prod-db='));
const prodDbPath = prodDbArg ? prodDbArg.split('=')[1] : null;
const prodUploadsArg = args.find(a => a.startsWith('--prod-uploads='));
const prodUploadsPath = prodUploadsArg ? prodUploadsArg.split('=')[1] : null;

interface ExportData {
  sourceEmail: string;
  exportedAt: string;
  grinders: any[];
  brewers: any[];
  coffeeServers: any[];
  coffeeBeans: any[];
  coffeeBatches: any[];
  recipes: any[];
  brews: any[];
  brewTemplates: any[];
  photos: string[]; // List of photo paths to copy
}

console.log('=== User Data Migration Script ===\n');
console.log(`Source email: ${SOURCE_EMAIL}`);

if (!isExport && !isImport && !isDryRun) {
  console.log('\nUsage:');
  console.log('  --dry-run    Preview what would be exported');
  console.log('  --export     Export user data to JSON file and photos');
  console.log('  --import     Import data to production (requires --prod-db and --prod-uploads)');
  console.log('\nExample:');
  console.log('  npx tsx scripts/migrate-user-to-production.ts --export');
  console.log('  npx tsx scripts/migrate-user-to-production.ts --import --prod-db=/path/to/prod.db --prod-uploads=/path/to/uploads');
  process.exit(0);
}


function exportUserData() {
  console.log(`\nMode: ${isDryRun ? 'DRY RUN' : 'EXPORT'}`);
  console.log(`Database: ${devDbPath}\n`);

  if (!fs.existsSync(devDbPath)) {
    console.error('Error: Development database not found');
    process.exit(1);
  }

  const db = new Database(devDbPath, { readonly: true });

  try {
    // Get user ID
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(SOURCE_EMAIL) as any;
    if (!user) {
      console.error(`Error: User ${SOURCE_EMAIL} not found`);
      process.exit(1);
    }
    console.log(`Found user: ${user.name} (ID: ${user.id})`);

    const userId = user.id;

    // Export equipment (no foreign key dependencies)
    const grinders = db.prepare('SELECT * FROM grinders WHERE user_id = ?').all(userId);
    console.log(`  Grinders: ${grinders.length}`);

    const brewers = db.prepare('SELECT * FROM brewers WHERE user_id = ?').all(userId);
    console.log(`  Brewers: ${brewers.length}`);

    const coffeeServers = db.prepare('SELECT * FROM coffee_servers WHERE user_id = ?').all(userId);
    console.log(`  Coffee Servers: ${coffeeServers.length}`);

    // Export coffee beans
    const coffeeBeans = db.prepare('SELECT * FROM coffee_beans WHERE user_id = ?').all(userId);
    console.log(`  Coffee Beans: ${coffeeBeans.length}`);

    // Export coffee batches (linked to coffee beans)
    const coffeeBeanIds = coffeeBeans.map((b: any) => b.id);
    let coffeeBatches: any[] = [];
    if (coffeeBeanIds.length > 0) {
      coffeeBatches = db.prepare(
        `SELECT * FROM coffee_batches WHERE coffee_bean_id IN (${coffeeBeanIds.join(',')})`
      ).all();
    }
    console.log(`  Coffee Batches: ${coffeeBatches.length}`);

    // Export recipes (linked to grinders, brewers)
    const recipes = db.prepare('SELECT * FROM recipes WHERE user_id = ?').all(userId);
    console.log(`  Recipes: ${recipes.length}`);

    // Export brews (linked to everything)
    const brews = db.prepare('SELECT * FROM brews WHERE user_id = ?').all(userId);
    console.log(`  Brews: ${brews.length}`);

    // Export brew templates
    const brewTemplates = db.prepare('SELECT * FROM brew_templates WHERE user_id = ?').all(userId);
    console.log(`  Brew Templates: ${brewTemplates.length}`);

    // Collect all photo paths
    const photos: string[] = [];
    const collectPhotos = (items: any[]) => {
      for (const item of items) {
        if (item.photo && typeof item.photo === 'string' && item.photo.startsWith('/uploads/')) {
          photos.push(item.photo);
        }
      }
    };
    collectPhotos(grinders);
    collectPhotos(brewers);
    collectPhotos(coffeeServers);
    collectPhotos(coffeeBeans);
    collectPhotos(recipes);
    collectPhotos(brews);
    console.log(`  Photos: ${photos.length}`);

    const exportData: ExportData = {
      sourceEmail: SOURCE_EMAIL,
      exportedAt: new Date().toISOString(),
      grinders,
      brewers,
      coffeeServers,
      coffeeBeans,
      coffeeBatches,
      recipes,
      brews,
      brewTemplates,
      photos,
    };

    if (!isDryRun) {
      // Write JSON export
      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      console.log(`\n✅ Exported JSON to: ${exportPath}`);

      // Copy photo files
      if (photos.length > 0) {
        if (fs.existsSync(photosExportPath)) {
          fs.rmSync(photosExportPath, { recursive: true });
        }
        fs.mkdirSync(photosExportPath, { recursive: true });

        let copiedCount = 0;
        let missingCount = 0;
        for (const photoPath of photos) {
          // photoPath is like /uploads/user_folder/filename.jpg
          const relativePath = photoPath.replace(/^\/uploads\//, '');
          const sourcePath = path.join(uploadsDir, relativePath);
          const destPath = path.join(photosExportPath, relativePath);

          if (fs.existsSync(sourcePath)) {
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(sourcePath, destPath);
            copiedCount++;
          } else {
            console.log(`  Warning: Photo not found: ${sourcePath}`);
            missingCount++;
          }
        }
        console.log(`✅ Copied ${copiedCount} photos to: ${photosExportPath}`);
        if (missingCount > 0) {
          console.log(`⚠ ${missingCount} photos were not found`);
        }
      }
    } else {
      console.log('\n⚠ DRY RUN - No files written');
    }
  } finally {
    db.close();
  }
}


function importUserData() {
  console.log(`\nMode: IMPORT`);
  
  if (!prodDbPath) {
    console.error('Error: --prod-db=path is required for import');
    process.exit(1);
  }

  if (!prodUploadsPath) {
    console.error('Error: --prod-uploads=path is required for import');
    process.exit(1);
  }

  if (!fs.existsSync(exportPath)) {
    console.error(`Error: Export file not found: ${exportPath}`);
    console.error('Run --export first');
    process.exit(1);
  }

  if (!fs.existsSync(prodDbPath)) {
    console.error(`Error: Production database not found: ${prodDbPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(prodUploadsPath)) {
    console.error(`Error: Production uploads directory not found: ${prodUploadsPath}`);
    process.exit(1);
  }

  console.log(`Export file: ${exportPath}`);
  console.log(`Photos export: ${photosExportPath}`);
  console.log(`Production DB: ${prodDbPath}`);
  console.log(`Production uploads: ${prodUploadsPath}\n`);

  const exportData: ExportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  console.log(`Importing data exported at: ${exportData.exportedAt}`);

  const db = new Database(prodDbPath);

  try {
    // Find or verify target user in production
    const prodUser = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(exportData.sourceEmail) as any;
    if (!prodUser) {
      console.error(`Error: User ${exportData.sourceEmail} not found in production database`);
      console.error('Please create the user account in production first');
      process.exit(1);
    }
    console.log(`Target user in production: ${prodUser.name} (ID: ${prodUser.id})`);

    const prodUserId = prodUser.id;

    // ID mapping tables
    const grinderIdMap = new Map<number, number>();
    const brewerIdMap = new Map<number, number>();
    const coffeeServerIdMap = new Map<number, number>();
    const coffeeBeanIdMap = new Map<number, number>();
    const coffeeBatchIdMap = new Map<number, number>();
    const recipeIdMap = new Map<number, number>();

    db.exec('BEGIN TRANSACTION');

    try {
      // Import grinders
      console.log('\nImporting grinders...');
      const insertGrinder = db.prepare(`
        INSERT INTO grinders (user_id, model, photo, burr_type, ideal_for, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const g of exportData.grinders) {
        const result = insertGrinder.run(prodUserId, g.model, g.photo, g.burr_type, g.ideal_for, g.created_at);
        grinderIdMap.set(g.id, result.lastInsertRowid as number);
        console.log(`  Grinder ${g.id} → ${result.lastInsertRowid}: ${g.model}`);
      }

      // Import brewers
      console.log('\nImporting brewers...');
      const insertBrewer = db.prepare(`
        INSERT INTO brewers (user_id, model, photo, type, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const b of exportData.brewers) {
        const result = insertBrewer.run(prodUserId, b.model, b.photo, b.type, b.created_at);
        brewerIdMap.set(b.id, result.lastInsertRowid as number);
        console.log(`  Brewer ${b.id} → ${result.lastInsertRowid}: ${b.model}`);
      }

      // Import coffee servers
      console.log('\nImporting coffee servers...');
      const insertServer = db.prepare(`
        INSERT INTO coffee_servers (user_id, model, photo, max_volume, empty_weight, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const s of exportData.coffeeServers) {
        const result = insertServer.run(prodUserId, s.model, s.photo, s.max_volume, s.empty_weight, s.created_at);
        coffeeServerIdMap.set(s.id, result.lastInsertRowid as number);
        console.log(`  Server ${s.id} → ${result.lastInsertRowid}: ${s.model}`);
      }

      // Import coffee beans
      console.log('\nImporting coffee beans...');
      const insertBean = db.prepare(`
        INSERT INTO coffee_beans (user_id, photo, name, roaster, country, region, altitude, varietal, 
          process, roast_level, roast_for, tasting_notes, url, favorite, low_stock_threshold, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const bean of exportData.coffeeBeans) {
        const result = insertBean.run(
          prodUserId, bean.photo, bean.name, bean.roaster, bean.country, bean.region,
          bean.altitude, bean.varietal, bean.process, bean.roast_level, bean.roast_for,
          bean.tasting_notes, bean.url, bean.favorite, bean.low_stock_threshold, bean.created_at
        );
        coffeeBeanIdMap.set(bean.id, result.lastInsertRowid as number);
        console.log(`  Bean ${bean.id} → ${result.lastInsertRowid}: ${bean.name}`);
      }

      // Import coffee batches
      console.log('\nImporting coffee batches...');
      const insertBatch = db.prepare(`
        INSERT INTO coffee_batches (coffee_bean_id, price, roast_date, weight, current_weight, 
          purchase_date, notes, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const batch of exportData.coffeeBatches) {
        const newBeanId = coffeeBeanIdMap.get(batch.coffee_bean_id);
        if (!newBeanId) {
          console.log(`  Warning: Skipping batch ${batch.id} - bean not found`);
          continue;
        }
        const result = insertBatch.run(
          newBeanId, batch.price, batch.roast_date, batch.weight, batch.current_weight,
          batch.purchase_date, batch.notes, batch.is_active, batch.created_at
        );
        coffeeBatchIdMap.set(batch.id, result.lastInsertRowid as number);
        console.log(`  Batch ${batch.id} → ${result.lastInsertRowid}`);
      }

      // Import recipes
      console.log('\nImporting recipes...');
      const insertRecipe = db.prepare(`
        INSERT INTO recipes (user_id, name, grinder_id, brewer_id, ratio, dose, photo, process, 
          process_steps, grind_size, water, yield, temperature, brew_time, favorite, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of exportData.recipes) {
        const newGrinderId = r.grinder_id ? grinderIdMap.get(r.grinder_id) : null;
        const newBrewerId = r.brewer_id ? brewerIdMap.get(r.brewer_id) : null;
        const result = insertRecipe.run(
          prodUserId, r.name, newGrinderId, newBrewerId, r.ratio, r.dose, r.photo, r.process,
          r.process_steps, r.grind_size, r.water, r.yield, r.temperature, r.brew_time, r.favorite, r.created_at
        );
        recipeIdMap.set(r.id, result.lastInsertRowid as number);
        console.log(`  Recipe ${r.id} → ${result.lastInsertRowid}: ${r.name}`);
      }

      // Import brews
      console.log('\nImporting brews...');
      const insertBrew = db.prepare(`
        INSERT INTO brews (user_id, date, coffee_bean_id, batch_id, grinder_id, brewer_id, recipe_id,
          coffee_server_id, dose, grind_size, water, yield, temperature, brew_time, tds, 
          extraction_yield, rating, comment, photo, favorite, template_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const brew of exportData.brews) {
        const newBeanId = brew.coffee_bean_id ? coffeeBeanIdMap.get(brew.coffee_bean_id) : null;
        const newBatchId = brew.batch_id ? coffeeBatchIdMap.get(brew.batch_id) : null;
        const newGrinderId = brew.grinder_id ? grinderIdMap.get(brew.grinder_id) : null;
        const newBrewerId = brew.brewer_id ? brewerIdMap.get(brew.brewer_id) : null;
        const newRecipeId = brew.recipe_id ? recipeIdMap.get(brew.recipe_id) : null;
        const newServerId = brew.coffee_server_id ? coffeeServerIdMap.get(brew.coffee_server_id) : null;
        
        const result = insertBrew.run(
          prodUserId, brew.date, newBeanId, newBatchId, newGrinderId, newBrewerId, newRecipeId,
          newServerId, brew.dose, brew.grind_size, brew.water, brew.yield, brew.temperature,
          brew.brew_time, brew.tds, brew.extraction_yield, brew.rating, brew.comment, brew.photo,
          brew.favorite, brew.template_notes, brew.created_at
        );
        console.log(`  Brew ${brew.id} → ${result.lastInsertRowid}: ${brew.date}`);
      }

      // Import brew templates
      console.log('\nImporting brew templates...');
      const insertTemplate = db.prepare(`
        INSERT INTO brew_templates (user_id, name, fields, created_at)
        VALUES (?, ?, ?, ?)
      `);
      for (const t of exportData.brewTemplates) {
        const result = insertTemplate.run(prodUserId, t.name, t.fields, t.created_at);
        console.log(`  Template ${t.id} → ${result.lastInsertRowid}: ${t.name}`);
      }

      db.exec('COMMIT');
      console.log('\n✅ Database import completed successfully!');

      // Copy photos to production
      if (exportData.photos && exportData.photos.length > 0 && fs.existsSync(photosExportPath)) {
        console.log('\nCopying photos to production...');
        let copiedCount = 0;
        let skippedCount = 0;
        
        for (const photoPath of exportData.photos) {
          const relativePath = photoPath.replace(/^\/uploads\//, '');
          const sourcePath = path.join(photosExportPath, relativePath);
          const destPath = path.join(prodUploadsPath!, relativePath);

          if (fs.existsSync(sourcePath)) {
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            
            // Skip if file already exists in production
            if (fs.existsSync(destPath)) {
              skippedCount++;
              continue;
            }
            
            fs.copyFileSync(sourcePath, destPath);
            copiedCount++;
          }
        }
        console.log(`✅ Copied ${copiedCount} photos to production`);
        if (skippedCount > 0) {
          console.log(`  (${skippedCount} already existed, skipped)`);
        }
      }

      // Summary
      console.log('\n=== Summary ===');
      console.log(`Grinders: ${exportData.grinders.length}`);
      console.log(`Brewers: ${exportData.brewers.length}`);
      console.log(`Coffee Servers: ${exportData.coffeeServers.length}`);
      console.log(`Coffee Beans: ${exportData.coffeeBeans.length}`);
      console.log(`Coffee Batches: ${exportData.coffeeBatches.length}`);
      console.log(`Recipes: ${exportData.recipes.length}`);
      console.log(`Brews: ${exportData.brews.length}`);
      console.log(`Brew Templates: ${exportData.brewTemplates.length}`);
      console.log(`Photos: ${exportData.photos?.length || 0}`);

    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  } finally {
    db.close();
  }
}

// Main execution
if (isExport || isDryRun) {
  exportUserData();
} else if (isImport) {
  importUserData();
}
