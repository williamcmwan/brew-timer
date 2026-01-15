import { db } from '../db/schema.js';

const DEFAULT_RECIPES = [
  {
    guest_id: 'default',
    name: 'V60 Pour Over',
    ratio: '1:16',
    dose: 22,
    process: 'Pour over method with V60',
    process_steps: JSON.stringify([
      { description: "Bloom", waterAmount: 44, duration: 30 },
      { description: "First pour", waterAmount: 132, duration: 60 },
      { description: "Second pour", waterAmount: 176, duration: 90 },
      { description: "Final pour", waterAmount: 176, duration: 120 }
    ]),
    grind_size: 20,
    water: 352,
    yield: 320,
    temperature: 93,
    brew_time: '4:00',
    favorite: 1
  },
  {
    guest_id: 'default',
    name: 'Chemex Classic',
    ratio: '1:15',
    dose: 30,
    process: 'Chemex pour over method',
    process_steps: JSON.stringify([
      { description: "Bloom", waterAmount: 60, duration: 45 },
      { description: "First pour", waterAmount: 150, duration: 90 },
      { description: "Second pour", waterAmount: 150, duration: 150 },
      { description: "Final pour", waterAmount: 90, duration: 210 }
    ]),
    grind_size: 25,
    water: 450,
    yield: 400,
    temperature: 94,
    brew_time: '5:30',
    favorite: 0
  },
  {
    guest_id: 'default',
    name: 'French Press',
    ratio: '1:12',
    dose: 30,
    process: 'Immersion brewing method',
    process_steps: JSON.stringify([
      { description: "Add all water", waterAmount: 360, duration: 0 },
      { description: "Steep", waterAmount: 0, duration: 240 }
    ]),
    grind_size: 35,
    water: 360,
    yield: 340,
    temperature: 95,
    brew_time: '4:00',
    favorite: 0
  }
];

export function seedDefaultRecipes() {
  try {
    // Create default guest user
    const guestStmt = db.prepare('INSERT OR IGNORE INTO guest_users (guest_id) VALUES (?)');
    guestStmt.run('default');

    // Insert default recipes
    const recipeStmt = db.prepare(`
      INSERT OR IGNORE INTO recipes (guest_id, name, ratio, dose, process, process_steps, 
                                   grind_size, water, yield, temperature, brew_time, favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const recipe of DEFAULT_RECIPES) {
      recipeStmt.run(
        recipe.guest_id,
        recipe.name,
        recipe.ratio,
        recipe.dose,
        recipe.process,
        recipe.process_steps,
        recipe.grind_size,
        recipe.water,
        recipe.yield,
        recipe.temperature,
        recipe.brew_time,
        recipe.favorite
      );
    }

    console.log('✅ Default recipes seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding default recipes:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDefaultRecipes();
}