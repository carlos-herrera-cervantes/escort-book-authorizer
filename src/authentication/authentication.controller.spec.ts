import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AccessTokenService } from '../access-token/access-token.service';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationController', () => {
  let authenticationService: AuthenticationService;
  let authenticationController: AuthenticationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthenticationService,
          useValue: {
            verifyCustomerAsync: jest.fn(),
            loginAsync: jest.fn(),
            logoutAsync: jest.fn(),
            signUpCustomerAsync: jest.fn(),
            signUpUserAsync: jest.fn(),
          },
        },
        {
          provide: AccessTokenService,
          useValue: {},
        },
      ],
      controllers: [AuthenticationController],
    }).compile();

    authenticationService = module.get<AuthenticationService>(AuthenticationService);
    authenticationController = module.get<AuthenticationController>(AuthenticationController);
  });

  it('Should be defined', () => expect(authenticationController).toBeDefined());

  it('verifyCustomerAsync - Should return html', async () => {
    const mockAuthenticationServiceVerifyCustomerAsync = jest
      .spyOn(authenticationService, 'verifyCustomerAsync')
      .mockImplementation(() => Promise.resolve());
    const response: Partial<Response> = {
      send: jest.fn().mockImplementation().mockReturnValue(''),
    };

    await authenticationController.verifyCustomerAsync(response as Response, 'dummy-jwt');

    expect(mockAuthenticationServiceVerifyCustomerAsync).toBeCalledTimes(1);
  });

  it('verifyUserAsync - Should return html', async () => {
    const mockAuthenticationServiceVerifyCustomerAsync = jest
      .spyOn(authenticationService, 'verifyCustomerAsync')
      .mockImplementation(() => Promise.resolve());
    const response: Partial<Response> = {
      send: jest.fn().mockImplementation().mockReturnValue(''),
    };

    await authenticationController.verifyUserAsync(response as Response, 'dummy-jwt');

    expect(mockAuthenticationServiceVerifyCustomerAsync).toBeCalledTimes(1);
  });

  it('loginAsync - Should return access token', async () => {
    const mockAuthenticationServiceLoginAsync = jest
      .spyOn(authenticationService, 'loginAsync')
      .mockImplementation(() => Promise.resolve('dummy-jwt'));

    const loginResult = await authenticationController.loginAsync({});

    expect(mockAuthenticationServiceLoginAsync).toBeCalledTimes(1);
    expect(loginResult.accessToken).toEqual('dummy-jwt');
  });

  it('logoutAsync - Should invoke logout async method', async () => {
    const mockAuthenticationServiceLogoutAsync = jest
      .spyOn(authenticationService, 'logoutAsync')
      .mockImplementation(() => Promise.resolve());

    await authenticationController.logoutAsync("bad@example.com");

    expect(mockAuthenticationServiceLogoutAsync).toBeCalledTimes(1);
  });

  it('registerCustomerAsync - Should return message response', async () => {
    const mockAuthenticationServiceSignUpCustomerAsync = jest
      .spyOn(authenticationService, 'signUpCustomerAsync')
      .mockImplementation(() => Promise.resolve({ message: 'ok' }));

    await authenticationController.registerCustomerAsync(new CreateUserDto());

    expect(mockAuthenticationServiceSignUpCustomerAsync).toBeCalledTimes(1);
  });

  it('registerUserAsync - Should return a message response', async () => {
    const mockAuthenticationServiceSignUpUserAsync = jest
      .spyOn(authenticationService, 'signUpUserAsync')
      .mockImplementation(() => Promise.resolve({ message: 'ok' }));

    await authenticationController.registerUserAsync(new CreateUserDto());

    expect(mockAuthenticationServiceSignUpUserAsync).toBeCalledTimes(1);
  });

  it('registerEscortAsync - Should return a message response', async () => {
    const mockAuthenticationServiceSignUpCustomerAsync = jest
      .spyOn(authenticationService, 'signUpCustomerAsync')
      .mockImplementation(() => Promise.resolve({ message: 'ok' }));

    await authenticationController.registerEscortAsync(new CreateUserDto());

    expect(mockAuthenticationServiceSignUpCustomerAsync).toBeCalledTimes(1);
  });
});
