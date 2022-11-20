import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MONGODB_URI } from '../src/common/enums/mongo.enum';
import { AccessTokenService } from '../src/access-token/access-token.service';
import { AccessTokenModule } from '../src/access-token/access-token.module';
import { CreateAccessTokenDto } from '../src/access-token/dto/create-access-token.dto';

let app: INestApplication;
let accessTokenService: AccessTokenService;

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(MONGODB_URI),
      AccessTokenModule,
    ],
  }).compile();

  app = module.createNestApplication();
  await app.init();

  accessTokenService = module.get<AccessTokenService>(AccessTokenService);
});

afterAll(async () => await app.close());

describe('AccessTokenService', () => {
  it('getOneAsync - Should return empty document', async () => {
    const token = await accessTokenService.getOneAsync();
    expect(token).toBeNull();
  });

  it('countAsync - Should return 0 documents', async () => {
    const counter = await accessTokenService.countAsync();
    expect(counter).toBeFalsy();
  });

  it('createAsync - Should create a new document', async () => {
    const newAccessToken = new CreateAccessTokenDto();
    newAccessToken.user = 'test.user@example.com';
    newAccessToken.token = 'dummy-jwt';
    newAccessToken.userId = '6379a4cd4914c2b5774b8dc4';

    const insertResult = await accessTokenService.createAsync(newAccessToken);
    expect(insertResult._id).not.toBeNull();

    await accessTokenService.deleteManyAsync();
  });

  it('deleteOneAsync - Should delete a document', async () => {
    const newAccessToken = new CreateAccessTokenDto();
    newAccessToken.user = 'test.user@example.com';
    newAccessToken.token = 'dummy-jwt';
    newAccessToken.userId = '6379a4cd4914c2b5774b8dc4';

    const insertResult = await accessTokenService.createAsync(newAccessToken);
    const counterBeforeDelete = await accessTokenService.countAsync({ _id: insertResult._id });
    expect(counterBeforeDelete).toBeTruthy();

    await accessTokenService.deleteOneAsync({ _id: insertResult._id });
    const counterAfterDelete = await accessTokenService.countAsync({ _id: insertResult._id });
    expect(counterAfterDelete).toBeFalsy();
  });

  it('deleteManyAsync - Should delete documents', async () => {
    const newAccessToken = new CreateAccessTokenDto();
    newAccessToken.user = 'test.user@example.com';
    newAccessToken.token = 'dummy-jwt';
    newAccessToken.userId = '6379a4cd4914c2b5774b8dc4';

    await accessTokenService.createAsync(newAccessToken);
    const counterBeforeDelete = await accessTokenService.countAsync();
    expect(counterBeforeDelete).toBeTruthy();

    await accessTokenService.deleteManyAsync();
    const counterAfterDelete = await accessTokenService.countAsync();
    expect(counterAfterDelete).toBeFalsy();
  });
});
