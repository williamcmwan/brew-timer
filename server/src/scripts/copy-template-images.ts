import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function copyTemplateImages() {
  const dataDir = path.join(__dirname, '../../data');
  const oldUploadsDir = path.join(dataDir, 'uploads');
  const newUploadsDir = path.join(dataDir, 'template-images');
  
  console.log('📸 Copying template images...');
  console.log('From:', oldUploadsDir);
  console.log('To:', newUploadsDir);
  
  // Create new uploads directory if it doesn't exist
  if (!fs.existsSync(newUploadsDir)) {
    fs.mkdirSync(newUploadsDir, { recursive: true });
    console.log('✅ Created template-images directory');
  }
  
  try {
    // Get all templates with photos
    const stmt = db.prepare(`
      SELECT id, name, photo 
      FROM recipe_templates 
      WHERE photo IS NOT NULL AND photo != ''
    `);
    
    const templatesWithPhotos = stmt.all() as any[];
    console.log(`📋 Found ${templatesWithPhotos.length} templates with photos`);
    
    let copiedCount = 0;
    let errorCount = 0;
    
    for (const template of templatesWithPhotos) {
      try {
        // Extract filename from photo path (e.g., "/uploads/admin_at_admin.com/1764459928784-5kf4yr.jpg")
        const photoPath = template.photo;
        const filename = path.basename(photoPath);
        const oldFilePath = path.join(dataDir, photoPath.replace('/uploads/', 'uploads/'));
        const newFilePath = path.join(newUploadsDir, filename);
        
        console.log(`📷 Processing: ${template.name}`);
        console.log(`   From: ${oldFilePath}`);
        console.log(`   To: ${newFilePath}`);
        
        // Check if source file exists
        if (!fs.existsSync(oldFilePath)) {
          console.log(`   ⚠️  Source file not found: ${oldFilePath}`);
          errorCount++;
          continue;
        }
        
        // Copy the file
        fs.copyFileSync(oldFilePath, newFilePath);
        
        // Update the template photo path in database
        const updateStmt = db.prepare(`
          UPDATE recipe_templates 
          SET photo = ? 
          WHERE id = ?
        `);
        
        const newPhotoPath = `/template-images/${filename}`;
        updateStmt.run(newPhotoPath, template.id);
        
        console.log(`   ✅ Copied and updated path to: ${newPhotoPath}`);
        copiedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${template.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully copied: ${copiedCount} images`);
    console.log(`   ❌ Errors: ${errorCount} images`);
    
    if (copiedCount > 0) {
      console.log(`\n🎉 Template images copied successfully!`);
      console.log(`📁 Images are now available at: ${newUploadsDir}`);
      console.log(`🌐 They will be served at: /template-images/[filename]`);
    }
    
  } catch (error) {
    console.error('❌ Error during image copying:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  copyTemplateImages();
}