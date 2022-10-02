import { runEntityMigrations } from './migrateChainEntities';

// Fixes issue with having this method run in the file where function is
runEntityMigrations();
