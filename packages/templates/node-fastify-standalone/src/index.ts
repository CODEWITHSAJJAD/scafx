import dotenv from 'dotenv';
import { buildApp } from './app.js';

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || '0.0.0.0';

const app = await buildApp();

try {
  await app.listen({ port, host });
  console.log(`Server running at http://localhost:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
