import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let userService: UserService;
  let userController: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UserService,
          useValue: {
            getRoles: jest.fn(),
            updateOnePartialAsync: jest.fn(),
          }
        },
      ],
      controllers: [UserController],
    }).compile();

    userService = module.get<UserService>(UserService);
    userController = module.get<UserController>(UserController);
  });

  it('getRoles - Should return an empty list', async () => {
    const mockUserServiceGetRoles = jest
      .spyOn(userService, 'getRoles')
      .mockImplementation(() => Promise.resolve([]));

    const rolesResult = await userController.getRoles();

    expect(rolesResult.length).toEqual(0);
    expect(mockUserServiceGetRoles).toBeCalledTimes(1);
  });

  it('setFirebaseToken - Should return message response', async () => {
    const mockUserServiceUpdateOnePartialAsync = jest
      .spyOn(userService, 'updateOnePartialAsync')
      .mockImplementation(() => Promise.resolve(new User()));

    const firebaseTokenResult = await userController.setFirebaseToken("bad@example.com", new UpdateUserDto());
    
    expect(firebaseTokenResult.message).toEqual('OK');
    expect(mockUserServiceUpdateOnePartialAsync).toBeCalledTimes(1);
  });
});
