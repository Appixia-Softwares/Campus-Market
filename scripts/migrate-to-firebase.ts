import { migrateToFirebase } from '../database/migrations/20240301_supabase_to_firebase.js';

// Run the migration
migrateToFirebase()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 