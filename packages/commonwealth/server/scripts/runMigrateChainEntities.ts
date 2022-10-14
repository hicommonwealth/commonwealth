import { runMigrations } from './migrateChainEntities';

// Fixes issue with having this method run in the file where function is
runMigrations();
