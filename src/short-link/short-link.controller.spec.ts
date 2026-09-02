import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { AppDataSource } from '../data.source';
import { ShortLinkModule } from './short-link.module';
import { ShortLink } from './entity/short-link.entity';

describe('ShortLinkController (e2e)', () => {
  let app: INestApplication;
  let repo: Repository<ShortLink>;

  const vanityCode = `vanity-${Date.now()}`;
  let createdCode: string;
  let createdDeleteToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(AppDataSource.options), ShortLinkModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    repo = moduleRef.get<Repository<ShortLink>>(getRepositoryToken(ShortLink));
  });

  afterAll(async () => {
    await repo.delete({ code: createdCode }).catch(() => undefined);
    await repo.delete({ code: vanityCode }).catch(() => undefined);
    await app.close();
  });

  it('creates a short link with a random code', async () => {
    const res = await request(app.getHttpServer())
      .post('/short-link')
      .send({ originalUrl: 'https://example.com/a' })
      .expect(201);
    const body = res.body as ShortLink;

    expect(body.code).toBeDefined();
    expect(body.originalUrl).toBe('https://example.com/a');
    expect(body.clicks).toBe(0);
    expect(body.deleteToken).toBeDefined();

    createdCode = body.code;
    createdDeleteToken = body.deleteToken;
  });

  it('creates a short link with a custom vanity code', async () => {
    const res = await request(app.getHttpServer())
      .post('/short-link')
      .send({ originalUrl: 'https://example.com/b', code: vanityCode })
      .expect(201);
    const body = res.body as ShortLink;

    expect(body.code).toBe(vanityCode);
  });

  it('rejects a duplicate vanity code with 409', async () => {
    await request(app.getHttpServer())
      .post('/short-link')
      .send({ originalUrl: 'https://example.com/c', code: vanityCode })
      .expect(409);
  });

  it('rejects an invalid originalUrl with 400', async () => {
    await request(app.getHttpServer())
      .post('/short-link')
      .send({ originalUrl: 'not-a-url' })
      .expect(400);
  });

  it('returns stats without exposing the delete token', async () => {
    const res = await request(app.getHttpServer())
      .get(`/short-link/${createdCode}/stats`)
      .expect(200);
    const body = res.body as Omit<ShortLink, 'deleteToken'>;

    expect(body.code).toBe(createdCode);
    expect((body as Partial<ShortLink>).deleteToken).toBeUndefined();
  });

  it('redirects to the original URL and increments clicks', async () => {
    await request(app.getHttpServer())
      .get(`/short-link/${createdCode}`)
      .expect(302)
      .expect('Location', 'https://example.com/a');

    const res = await request(app.getHttpServer())
      .get(`/short-link/${createdCode}/stats`)
      .expect(200);
    const body = res.body as Omit<ShortLink, 'deleteToken'>;

    expect(body.clicks).toBe(1);
  });

  it('returns 404 for an unknown code', async () => {
    await request(app.getHttpServer())
      .get('/short-link/does-not-exist')
      .expect(404);
  });

  it('rejects deletion with the wrong delete token', async () => {
    await request(app.getHttpServer())
      .delete(`/short-link/${createdCode}`)
      .set('x-delete-token', 'wrong-token')
      .expect(403);
  });

  it('deletes the link with the correct delete token', async () => {
    await request(app.getHttpServer())
      .delete(`/short-link/${createdCode}`)
      .set('x-delete-token', createdDeleteToken)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/short-link/${createdCode}/stats`)
      .expect(404);
  });
});
