import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import 'dotenv/config';

void ConfigModule.forRoot({
  isGlobal: false,
  envFilePath:
    process.env.CI === 'true' || process.env.NODE_ENV === 'test'
      ? '.env.test'
      : '.env',
});

const configService = new ConfigService();

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
