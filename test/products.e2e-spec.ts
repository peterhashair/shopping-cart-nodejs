import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { TestModule } from './test.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  // Clean the database before each test
  beforeEach(async () => {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
    }
  });

  describe('/products (POST)', () => {
    it('should create a new product', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Test Product',
          description: 'A product for testing',
          priceCents: 100,
          stock: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(res.body.name).toBe('Test Product');
        });
    });

    it('should fail if the name is duplicated', async () => {
      // First, create a product
      await request(app.getHttpServer()).post('/products').send({
        name: 'Unique Product',
        description: 'A product for testing',
        priceCents: 100,
        stock: 10,
      });

      // Then, try to create it again
      return request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Unique Product',
          description: 'Another description',
          priceCents: 200,
          stock: 20,
        })
        .expect(409); // Conflict
    });

    it('should fail with validation errors for invalid data', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Incomplete' })
        .expect(400);
    });
  });

  describe('/products (GET)', () => {
    it('should return an empty array when no products exist', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect([]);
    });

    it('should return an array of products when products exist', async () => {
      // Create a product to ensure the list is not empty
      await request(app.getHttpServer()).post('/products').send({
        name: 'Test Product',
        description: 'A product for testing',
        priceCents: 100,
        stock: 10,
      });

      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          expect(res.body[0].name).toBe('Test Product');
        });
    });
  });
});
