import 'dotenv/config';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';
import { startCleanup } from './services/cleanup.service.js';

await connectDb();
startCleanup();

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
