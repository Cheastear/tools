import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import 'dotenv/config';

const configService = new ConfigService({
  envFilePath: process.env.CI === 'true' ? '.env.test' : '.env',
});

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
