import { MikroORM } from '@mikro-orm/postgresql';

import config from './mikro-orm.config';

/**
 * Standalone migration runner used by the Docker entrypoint
 * (`node dist/migrate.js`) so production deploys auto-apply pending
 * migrations from the compiled JS before the server starts.
 */
async function runMigrations(): Promise<void> {
  const orm = await MikroORM.init(config);
  try {
    await orm.migrator.up();
  } finally {
    await orm.close(true);
  }
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
