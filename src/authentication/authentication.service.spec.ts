import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { HashingService } from '../hashing/hashing.service';
import { UserService } from '../user/user.service';
import { AuthenticationService } from './authentication.service';
import { User } from '../user/schemas/user.schema';
import { UserTypes } from '../user/enums/types.enum';
import { CreateUserDto } from '../user/dto/create-user.dto';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userService: UserService;
  let hashingService: HashingService;
  let eventEmitter: EventEmitter2;
  let jwtService: JwtService;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        {
          provide: UserService,
          useValue: {
            getOneAsync: jest.fn(),
            updateOnePartialAsync: jest.fn(),
            createAsync: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            compareAsync: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: 'EscortBook',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    userService = module.get<UserService>(UserService);
    hashingService = module.get<HashingService>(HashingService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    jwtService = module.get<JwtService>(JwtService);
    kafkaClient = module.get<ClientKafka>('EscortBook');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('validateUserAsync - Should throw not found exception', async () => {
    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(null));

    expect(async () => {
      await service.validateUserAsync('test.user@example.com', 'secret');
      expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
    })
    .rejects
    .toThrow(NotFoundException);
  });

  it('validateUserAsync - Should return null when passwords do not match', async () => {
    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(new User()));
    const mockHashingServiceCompareAsync = jest
      .spyOn(hashingService, 'compareAsync')
      .mockImplementation(() => Promise.resolve(false));

    const validationResult = await service.validateUserAsync('test.user@example.com', 'secret');

    expect(validationResult).toBeFalsy();
    expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
    expect(mockHashingServiceCompareAsync).toBeCalledTimes(1);
  });

  it('validateUserAsync - Should return user properties', async () => {
    const user = new User();
    user.email = 'test.user@example.com';
    user.password = 'secret';

    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(user));
    const mockHashingServiceCompareAsync = jest
      .spyOn(hashingService, 'compareAsync')
      .mockImplementation(() => Promise.resolve(true));

    const validationResult = await service.validateUserAsync('test.user@example.com', 'secret');

    expect(validationResult).toBeTruthy();
    expect(validationResult.email).toEqual('test.user@example.com');
    expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
    expect(mockHashingServiceCompareAsync).toBeCalledTimes(1);
  });

  it('logoutAsync - Should emit an event', async () => {
    const mockEventEmitterEmit = jest.spyOn(eventEmitter, 'emit').mockImplementation(() => true);
    await service.logoutAsync('test.user@example.com');

    expect(mockEventEmitterEmit).toBeCalledTimes(1);
  });

  it('loginAsync - Should throw forbidden exception', async () => {
    expect(async () => {
      const user = { block: true, type: UserTypes.Customer };
      await service.loginAsync(user);
    })
    .rejects
    .toThrow(ForbiddenException);
  });

  it('loginAsync - Should return the JWT', async () => {
    const mockJwtServiceSignAsync = jest
      .spyOn(jwtService, 'signAsync')
      .mockImplementation(() => Promise.resolve('dummy-jwt'));
    const mockUserServiceUpdateOnePartialAsync = jest
      .spyOn(userService, 'updateOnePartialAsync')
      .mockImplementation(() => Promise.resolve(new User()));
    const mockEventEmitterEmit = jest
      .spyOn(eventEmitter, 'emit')
      .mockImplementation(() => true);
    const mockKafkaClientEmit = jest
      .spyOn(kafkaClient, 'emit')
      .mockImplementation(() => new Observable<any>());
    const user = {
      _id: '6379bf4679ee05f8acd8d1bb',
      email: 'test.customer@example.com',
      roles: ['Customer'],
      block: false,
      type: UserTypes.Customer,
      deactivated: true,
      delete: false,
    };

    const loginResult = await service.loginAsync(user);

    expect(loginResult).toEqual('dummy-jwt');
    expect(mockJwtServiceSignAsync).toBeCalledTimes(1);
    expect(mockEventEmitterEmit).toBeCalledTimes(2);
    expect(mockUserServiceUpdateOnePartialAsync).toBeCalledTimes(1);
    expect(mockKafkaClientEmit).toBeCalledTimes(1);
  });

  it('signUpUserAsync - Should return a message response', async () => {
    const user = new User();
    user.email = 'test.user@example.com';
    user.type = UserTypes.Organization;
    user.verificationToken = 'dummy-verification-jwt';

    const mockJwtServiceSignAsync = jest
      .spyOn(jwtService, 'signAsync')
      .mockImplementation(() => Promise.resolve('dummy-jwt'));
    const mockUserServiceCreateAsync = jest
      .spyOn(userService, 'createAsync')
      .mockImplementation(() => Promise.resolve(user));
    const mockKafkaClientEmit = jest
      .spyOn(kafkaClient, 'emit')
      .mockImplementation(() => new Observable<any>());

    const newCreateUserDto = new CreateUserDto();
    newCreateUserDto.email = 'test.user@example.com';

    const singUpResult = await service.signUpUserAsync(newCreateUserDto);

    expect(singUpResult.message).toEqual('A verification email was sent to the employee');
    expect(mockJwtServiceSignAsync).toBeCalledTimes(1);
    expect(mockUserServiceCreateAsync).toBeCalledTimes(1);
    expect(mockKafkaClientEmit).toBeCalledTimes(2);
  });

  it('signUpCustomerAsync - Should return a message response', async () => {
    const user = new User();
    user.email = 'test.customer@example.com';
    user.type = UserTypes.Customer;
    user.verificationToken = 'dummy-verification-jwt';

    const mockJwtServiceSignAsync = jest
      .spyOn(jwtService, 'signAsync')
      .mockImplementation(() => Promise.resolve('dummy-jwt'));
    const mockUserServiceCreateAsync = jest
      .spyOn(userService, 'createAsync')
      .mockImplementation(() => Promise.resolve(user));
    const mockKafkaClientEmit = jest
      .spyOn(kafkaClient, 'emit')
      .mockImplementation(() => new Observable<any>());

    const newCreateUserDto = new CreateUserDto();
    newCreateUserDto.email = 'test.customer@example.com';

    const singUpResult = await service.signUpCustomerAsync(newCreateUserDto, UserTypes.Customer);

    expect(singUpResult.message).toEqual('A verification email was sent to you');
    expect(mockJwtServiceSignAsync).toBeCalledTimes(1);
    expect(mockUserServiceCreateAsync).toBeCalledTimes(1);
    expect(mockKafkaClientEmit).toBeCalledTimes(2);
  });

  it('verifyCustomerAsync - Should throw forbidden exception', async () => {
    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(null));

    expect(async () => {
      await service.verifyCustomerAsync('dummy-verification-jwt');
      expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
    })
    .rejects
    .toThrow(ForbiddenException);
  });

  it('verifyCustomerAsync - Should throw bad request exception when account is already verified', async () => {
    const user = new User();
    user.verified = true;

    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(user));

    expect(async () => {
      await service.verifyCustomerAsync('dummy-verification-jwt');
      expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
    })
    .rejects
    .toThrow(BadRequestException);
  });

  it('verifyCustomerAsync - Should throw a bad request exception when the jwt is not valid', async () => {
    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(new User()));
    const mockJwtServiceSignAsync = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockImplementation(() => { throw new BadRequestException() });
    
    expect(async () => {
      await service.verifyCustomerAsync('dummy-verification-jwt');
      expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
      expect(mockJwtServiceSignAsync).toBeCalledTimes(1);
    })
    .rejects
    .toThrow(BadRequestException);
  });

  it('verifyCustomerAsync - Should verify the customer', async () => {
    const mockUserServiceGetOneAsync = jest
      .spyOn(userService, 'getOneAsync')
      .mockImplementation(() => Promise.resolve(new User()));
    const mockJwtServiceSignAsync = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockImplementation(() => Promise.resolve(new Object()));
    const mockUserServiceUpdateOnePartialAsync = jest
      .spyOn(userService, 'updateOnePartialAsync')
      .mockImplementation(() => Promise.resolve(new User()));
    const mockKafkaClientEmit = jest
      .spyOn(kafkaClient, 'emit')
      .mockImplementation(() => new Observable<any>());

    await service.verifyCustomerAsync('dummy-verification-jwt');

    expect(mockUserServiceGetOneAsync).toBeCalledTimes(1);
    expect(mockJwtServiceSignAsync).toBeCalledTimes(1);
    expect(mockUserServiceUpdateOnePartialAsync).toBeCalledTimes(1);
    expect(mockKafkaClientEmit).toBeCalledTimes(1);
  });
});
