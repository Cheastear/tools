import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';
import * as dotenv from 'dotenv';

const envFile =
  process.env.CI === 'true' || process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env';
dotenv.config({ path: envFile });

const configService = new ConfigService();
console.log(
  process.env.CI,
  process.env.NODE_ENV,
  configService.get('DB_PASSWORD'),
);

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST')!,
  port: configService.get<number>('DB_PORT')!,
  username: configService.get<string>('DB_USER')!,
  password: configService.get<string>('DB_PASSWORD')!,
  database: configService.get<string>('DB_NAME')!,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
