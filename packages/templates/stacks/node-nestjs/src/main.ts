import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import dotenv from 'dotenv';
import { AppModule } from './app.module.js';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableCors();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Server running at http://${host}:${port}`);
}

bootstrap();
