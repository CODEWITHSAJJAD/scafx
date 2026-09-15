import { describe, expect, it } from 'vitest';
import { generateDatabaseEnv } from './env-generator.js';

describe('Environment and Database Configuration Generator', () => {
  it('generates local native PostgreSQL configuration with parameters and Flyway config', () => {
    const result = generateDatabaseEnv(
      'postgres',
      {
        hosting: 'local-native',
        host: '127.0.0.1',
        port: 5433,
        databaseName: 'production_db',
        user: 'admin_user',
        password: 'secure_password',
      },
      'prisma',
      'my-app',
    );

    expect(result.envContent).toContain('DB_HOST=127.0.0.1');
    expect(result.envContent).toContain('DB_PORT=5433');
    expect(result.envContent).toContain('DB_NAME=production_db');
    expect(result.envContent).toContain('DB_USER=admin_user');
    expect(result.envContent).toContain('DB_PASSWORD=secure_password');
    expect(result.envContent).toContain('postgresql://admin_user:secure_password@127.0.0.1:5433/production_db?schema=public');

    expect(result.flywayConfig).toContain('flyway.url=jdbc:postgresql://127.0.0.1:5433/production_db');
    expect(result.flywayConfig).toContain('flyway.user=admin_user');
    expect(result.flywayConfig).toContain('flyway.password=secure_password');
  });

  it('generates Docker containerized MySQL configuration', () => {
    const result = generateDatabaseEnv(
      'mysql',
      {
        hosting: 'local-docker',
        host: 'localhost',
        port: 3306,
        databaseName: 'docker_db',
        user: 'root',
        password: 'rootpassword',
      },
      'drizzle',
      'shop-app',
    );

    expect(result.envContent).toContain('DB_PORT=3306');
    expect(result.envContent).toContain('mysql://root:rootpassword@localhost:3306/docker_db');
  });

  it('generates Cloud Supabase database configuration', () => {
    const result = generateDatabaseEnv(
      'postgres',
      {
        hosting: 'cloud-supabase',
        host: 'db.xyz.supabase.co',
        port: 5432,
        databaseName: 'postgres',
        user: 'postgres',
        password: 'password',
        connectionString: 'postgresql://postgres:secret@db.xyz.supabase.co:5432/postgres',
      },
      'prisma',
      'cloud-app',
    );

    expect(result.envContent).toContain('DATABASE_URL="postgresql://postgres:secret@db.xyz.supabase.co:5432/postgres"');
    expect(result.envExampleContent).toContain('DATABASE_URL');
  });
});
