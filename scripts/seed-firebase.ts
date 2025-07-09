import { seedFirebase } from '../database/seed/firebase-seed.js';

// Run the seed
seedFirebase()
  .then(() => {
    console.log('Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  }); 