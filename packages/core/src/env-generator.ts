import { DatabaseConfig, Database, Orm } from './schema/answer.js';

export interface EnvGenerationResult {
  envContent: string;
  envExampleContent: string;
  connectionString: string;
  dockerComposeService?: string;
  flywayConfig?: string;
}

export function generateDatabaseEnv(
  database: Database,
  dbConfig: DatabaseConfig | undefined,
  orm: Orm,
  projectName: string,
): EnvGenerationResult {
  if (database === 'none') {
    return {
      envContent: `PORT=8000\nNODE_ENV=development\n`,
      envExampleContent: `PORT=8000\nNODE_ENV=development\n`,
      connectionString: '',
    };
  }

  const host = dbConfig?.host || 'localhost';
  const port = dbConfig?.port || getDefaultPort(database);
  const dbName = dbConfig?.databaseName || `${projectName.replace(/[^a-zA-Z0-9_]/g, '_')}_db`;
  const user = dbConfig?.user || getDefaultUser(database);
  const password = dbConfig?.password || getDefaultPassword(database);
  const hosting = dbConfig?.hosting || 'local-docker';

  let connectionString = '';
  const envLines: string[] = [`PORT=8000`, `NODE_ENV=development`];
  const envExampleLines: string[] = [`PORT=8000`, `NODE_ENV=development`];

  if (hosting === 'cloud-supabase') {
    connectionString =
      dbConfig?.connectionString ||
      dbConfig?.cloudUrl ||
      `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`;
    envLines.push(
      `DATABASE_URL="${connectionString}"`,
      `SUPABASE_URL="${dbConfig?.cloudUrl || 'https://xyzcompany.supabase.co'}"`,
      `SUPABASE_ANON_KEY="${dbConfig?.apiKey || 'eyJh...'}"`,
    );
    envExampleLines.push(
      `DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"`,
      `SUPABASE_URL="https://your-project.supabase.co"`,
      `SUPABASE_ANON_KEY="your-anon-key"`,
    );
  } else if (hosting === 'cloud-neon') {
    connectionString =
      dbConfig?.cloudUrl ||
      `postgresql://[USER]:[PASSWORD]@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`;
    envLines.push(`DATABASE_URL="${connectionString}"`);
    envExampleLines.push(
      `DATABASE_URL="postgresql://[USER]:[PASSWORD]@[ENDPOINT].neon.tech/neondb?sslmode=require"`,
    );
  } else if (hosting === 'cloud-atlas') {
    connectionString =
      dbConfig?.cloudUrl ||
      `mongodb+srv://${user}:${password}@cluster0.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    envLines.push(`MONGODB_URI="${connectionString}"`);
    envExampleLines.push(
      `MONGODB_URI="mongodb+srv://[USER]:[PASSWORD]@cluster0.mongodb.net/[DB_NAME]?retryWrites=true&w=majority"`,
    );
  } else if (hosting === 'cloud-firebase') {
    envLines.push(
      `FIREBASE_PROJECT_ID="${dbName}"`,
      `FIREBASE_CLIENT_EMAIL="${user}@${dbName}.iam.gserviceaccount.com"`,
      `FIREBASE_PRIVATE_KEY="${password}"`,
    );
    envExampleLines.push(
      `FIREBASE_PROJECT_ID="your-firebase-project-id"`,
      `FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"`,
      `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."`,
    );
  } else if (hosting === 'cloud-cloudflare') {
    envLines.push(
      `CLOUDFLARE_ACCOUNT_ID="${user}"`,
      `CLOUDFLARE_D1_DATABASE_ID="${dbName}"`,
      `CLOUDFLARE_API_TOKEN="${password}"`,
    );
    envExampleLines.push(
      `CLOUDFLARE_ACCOUNT_ID="your-account-id"`,
      `CLOUDFLARE_D1_DATABASE_ID="your-database-id"`,
      `CLOUDFLARE_API_TOKEN="your-api-token"`,
    );
  } else {
    // Local Native OS or Local Docker
    if (database === 'postgres') {
      connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}?schema=public`;
      envLines.push(
        `DB_HOST=${host}`,
        `DB_PORT=${port}`,
        `DB_NAME=${dbName}`,
        `DB_USER=${user}`,
        `DB_PASSWORD=${password}`,
        `DATABASE_URL="${connectionString}"`,
      );
      envExampleLines.push(
        `DB_HOST=localhost`,
        `DB_PORT=5432`,
        `DB_NAME=${dbName}`,
        `DB_USER=postgres`,
        `DB_PASSWORD=yourpassword`,
        `DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/${dbName}?schema=public"`,
      );
    } else if (database === 'mysql') {
      connectionString = `mysql://${user}:${password}@${host}:${port}/${dbName}`;
      envLines.push(
        `DB_HOST=${host}`,
        `DB_PORT=${port}`,
        `DB_NAME=${dbName}`,
        `DB_USER=${user}`,
        `DB_PASSWORD=${password}`,
        `DATABASE_URL="${connectionString}"`,
      );
      envExampleLines.push(
        `DB_HOST=localhost`,
        `DB_PORT=3306`,
        `DB_NAME=${dbName}`,
        `DB_USER=root`,
        `DB_PASSWORD=yourpassword`,
        `DATABASE_URL="mysql://root:yourpassword@localhost:3306/${dbName}"`,
      );
    } else if (database === 'mssql') {
      connectionString = `Server=${host},${port};Database=${dbName};User Id=${user};Password=${password};TrustServerCertificate=True;`;
      envLines.push(
        `DB_HOST=${host}`,
        `DB_PORT=${port}`,
        `DB_NAME=${dbName}`,
        `DB_USER=${user}`,
        `DB_PASSWORD=${password}`,
        `ConnectionStrings__DefaultConnection="${connectionString}"`,
      );
      envExampleLines.push(
        `DB_HOST=localhost`,
        `DB_PORT=1433`,
        `DB_NAME=${dbName}`,
        `DB_USER=sa`,
        `DB_PASSWORD=yourStrong(!)Password`,
        `ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=${dbName};User Id=sa;Password=yourStrong(!)Password;TrustServerCertificate=True;"`,
      );
    } else if (database === 'mongodb') {
      connectionString = `mongodb://${user}:${password}@${host}:${port}/${dbName}?authSource=admin`;
      envLines.push(`MONGODB_URI="${connectionString}"`, `DB_NAME="${dbName}"`);
      envExampleLines.push(
        `MONGODB_URI="mongodb://root:yourpassword@localhost:27017/${dbName}?authSource=admin"`,
        `DB_NAME="${dbName}"`,
      );
    } else if (database === 'sqlite') {
      connectionString = `file:./dev.db`;
      envLines.push(`DATABASE_URL="file:./dev.db"`);
      envExampleLines.push(`DATABASE_URL="file:./dev.db"`);
    }
  }

  // Flyway config if universal migrations
  let flywayConfig = '';
  if (database === 'postgres' || database === 'mysql' || database === 'mssql') {
    flywayConfig = `flyway.url=jdbc:${database === 'postgres' ? 'postgresql' : database === 'mysql' ? 'mysql' : 'sqlserver'}://${host}:${port}/${dbName}\nflyway.user=${user}\nflyway.password=${password}\nflyway.locations=filesystem:./migrations\n`;
  }

  return {
    envContent: envLines.join('\n') + '\n',
    envExampleContent: envExampleLines.join('\n') + '\n',
    connectionString,
    flywayConfig,
  };
}

function getDefaultPort(db: Database): number {
  switch (db) {
    case 'postgres':
      return 5432;
    case 'mysql':
      return 3306;
    case 'mssql':
      return 1433;
    case 'mongodb':
      return 27017;
    case 'sqlite':
      return 0;
    default:
      return 5432;
  }
}

function getDefaultUser(db: Database): string {
  switch (db) {
    case 'postgres':
      return 'postgres';
    case 'mysql':
      return 'root';
    case 'mssql':
      return 'sa';
    case 'mongodb':
      return 'admin';
    default:
      return 'root';
  }
}

function getDefaultPassword(db: Database): string {
  switch (db) {
    case 'postgres':
      return 'postgres';
    case 'mysql':
      return 'root';
    case 'mssql':
      return 'YourStrong(!)Password123';
    case 'mongodb':
      return 'admin';
    default:
      return 'secret';
  }
}
