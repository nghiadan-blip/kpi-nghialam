import dotenv from 'dotenv';
import path from 'path';
import app from './app';
import db from './config/db';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    // Enable PRAGMA foreign_keys for SQLite
    await db.raw('PRAGMA foreign_keys = ON;');
    console.log('✅ SQLite database connection initialized (PRAGMA foreign_keys = ON).');

    app.listen(PORT, () => {
      console.log(`🚀 Express backend server listening on port ${PORT}`);
      console.log(`   Health check endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Error starting Express server:', err);
    process.exit(1);
  }
}

main();
