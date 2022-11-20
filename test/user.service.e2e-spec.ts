import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from '../src/user/user.module';
import { MONGODB_URI } from '../src/common/enums/mongo.enum';
import { UserService } from '../src/user/user.service';
import { CreateUserDto } from '../src/user/dto/create-user.dto';
import { UserTypes } from '../src/user/enums/types.enum';
import { UpdateUserDto } from '../src/user/dto/update-user.dto';

let app: INestApplication;
let userService: UserService;

beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(MONGODB_URI),
      UserModule,
    ],
  }).compile();

  app = module.createNestApplication();
  await app.init();

  userService = module.get<UserService>(UserService);
});

afterAll(async () => await app.close());

describe('UserService', () => {
  it('getOneAsync - Should return null', async () => {
    const user = await userService.getOneAsync();
    expect(user).toBeFalsy();
  });

  it('getRoles - Should return an empty list', async () => {
    const roles = await userService.getRoles();
    expect(roles.length).toEqual(0);
  });

  it('count - Should return 0 documents', async () => {
    const counter = await userService.count();
    expect(counter).toBeFalsy();
  });

  it('createAsync - Should create a new user', async () => {
    const newCreateUser = new CreateUserDto();
    newCreateUser.email = 'test.user@example.com';
    newCreateUser.password = 'secret';
    newCreateUser.type = UserTypes.Organization;
    newCreateUser.firebaseToken = 'dummy-firebase-token';

    const createResult = await userService.createAsync(newCreateUser);

    const counter = await userService.count();
    expect(counter).toBeTruthy();

    await userService.deleteOneAsync({ _id: createResult._id });
  });

  it('updateOnePartialAsync - Should update a user', async () => {
    const newCreateUser = new CreateUserDto();
    newCreateUser.email = 'test.user@example.com';
    newCreateUser.password = 'secret';
    newCreateUser.type = UserTypes.Organization;
    newCreateUser.firebaseToken = 'dummy-firebase-token';

    const createResult = await userService.createAsync(newCreateUser);
    expect(createResult.verified).toBeFalsy();

    const newUpdateUser = new UpdateUserDto();
    newUpdateUser.verified = true;

    await userService.updateOnePartialAsync({
      _id: createResult._id
    }, newUpdateUser);

    const getResult = await userService.getOneAsync({ _id: createResult._id });
    expect(getResult.verified).toBeTruthy();

    await userService.deleteOneAsync({ _id: createResult._id });
  });

  it('deleteOneAsync - Should delete a user', async () => {
    const newCreateUser = new CreateUserDto();
    newCreateUser.email = 'test.user@example.com';
    newCreateUser.password = 'secret';
    newCreateUser.type = UserTypes.Organization;
    newCreateUser.firebaseToken = 'dummy-firebase-token';

    await userService.createAsync(newCreateUser);

    const counterBeforeDelete = await userService.count();
    expect(counterBeforeDelete).toBeTruthy();

    await userService.deleteOneAsync({ email: newCreateUser.email });
    
    const counterAfterDelete = await userService.count();
    expect(counterAfterDelete).toBeFalsy();
  });
});
