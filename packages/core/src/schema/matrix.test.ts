import { describe, expect, it } from 'vitest';
import {
  getAllowedArchitectures,
  getAllowedDatabases,
  getAllowedFrameworks,
  getAllowedMessageQueues,
  getAllowedMigrations,
  getAllowedORMs,
  getDefaultPort,
} from './matrix.js';

describe('Ecosystem Matrix and Capability Resolution', () => {
  it('returns valid frameworks for Node.js', () => {
    const frameworks = getAllowedFrameworks('node');
    expect(frameworks).toContain('express');
    expect(frameworks).toContain('fastify');
    expect(frameworks).toContain('nestjs');
  });

  it('returns valid frameworks for .NET', () => {
    const frameworks = getAllowedFrameworks('dotnet');
    expect(frameworks).toContain('webapi');
    expect(frameworks).toContain('mvc');
    expect(frameworks).toContain('minimal-api');
    expect(frameworks).toContain('blazor');
    expect(frameworks).toContain('maui');
  });

  it('returns valid frameworks for Python', () => {
    const frameworks = getAllowedFrameworks('python');
    expect(frameworks).toContain('fastapi');
    expect(frameworks).toContain('flask');
    expect(frameworks).toContain('django');
  });

  it('resolves architecture constraints strictly per framework', () => {
    // Node Express
    expect(getAllowedArchitectures('node', 'express')).toContain('clean');
    expect(getAllowedArchitectures('node', 'express')).toContain('layered');
    expect(getAllowedArchitectures('node', 'express')).toContain('mvc');

    // .NET MVC
    expect(getAllowedArchitectures('dotnet', 'mvc')).toContain('mvc');

    // Flutter
    expect(getAllowedArchitectures('flutter', 'flutter')).toContain('mvvm');
    expect(getAllowedArchitectures('flutter', 'flutter')).toContain('feature-first');

    // React
    expect(getAllowedArchitectures('react', 'vite')).toContain('atomic');
    expect(getAllowedArchitectures('react', 'vite')).toContain('mvvm');
  });

  it('resolves allowed databases and ORMs', () => {
    expect(getAllowedDatabases('node')).toContain('postgres');
    expect(getAllowedDatabases('node')).toContain('mongodb');

    expect(getAllowedORMs('node', 'postgres')).toContain('prisma');
    expect(getAllowedORMs('node', 'postgres')).toContain('drizzle');
    expect(getAllowedORMs('node', 'mongodb')).toContain('mongoose');

    expect(getAllowedORMs('python', 'postgres')).toContain('sqlalchemy');
    expect(getAllowedORMs('python', 'mongodb')).toContain('motor');

    expect(getAllowedORMs('dotnet', 'mssql')).toContain('efcore');
    expect(getAllowedORMs('dotnet', 'mssql')).toContain('dapper');

    expect(getAllowedORMs('flutter', 'sqlite')).toContain('drift');
  });

  it('resolves allowed message queues and migrations', () => {
    expect(getAllowedMessageQueues('node')).toContain('rabbitmq');
    expect(getAllowedMessageQueues('node')).toContain('kafka');
    expect(getAllowedMessageQueues('node')).toContain('redis-queue');

    expect(getAllowedMessageQueues('dotnet')).toContain('masstransit');

    expect(getAllowedMigrations('node')).toContain('native');
    expect(getAllowedMigrations('node')).toContain('flyway');
  });

  it('returns correct default ports per database', () => {
    expect(getDefaultPort('postgres')).toBe(5432);
    expect(getDefaultPort('mysql')).toBe(3306);
    expect(getDefaultPort('mssql')).toBe(1433);
    expect(getDefaultPort('mongodb')).toBe(27017);
  });
});
