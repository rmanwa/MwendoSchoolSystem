import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * TypeORM Data Source Configuration
 * ==================================
 * This file is used by TypeORM CLI for migrations.
 * It reads from .env file and configures the database connection.
 * 
 * Usage:
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:generate -- src/database/migrations/MigrationName
 */

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'mwendo_school',
  
  // Entity paths - adjust if your entities are elsewhere
  entities: [__dirname + '/../database/entities/*.entity{.ts,.js}'],
  
  // Migration paths
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  
  // Synchronize should be false in production - use migrations instead
  synchronize: false,
  
  // Logging
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  
  // SSL for production
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create and export the DataSource instance
const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;