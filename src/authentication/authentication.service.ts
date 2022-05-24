import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../hashing/hashing.service';
import { UserService } from '../user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from '../common/enums/events.enum';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { Role } from '../user/enums/roles.enum';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UserTypes } from '../user/enums/types.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthenticationService {

  @Inject(UserService)
  private readonly userService: UserService;

  @Inject(HashingService)
  private readonly hashingService: HashingService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  async validateUserAsync(email: string, password: string) {
    const user = await this.userService.getOneAsync({ email });
    const validPassword = await this.hashingService.compareAsync(password, user.password);

    if (validPassword) {
      const { password, ...args } = user;
      return args;
    }
    
    return null;
  }

  logoutAsync(email: string): void {
    this.eventEmitter.emit(Events.UserLogout, email);
  }

  async loginAsync(user: any): Promise<string> {
    const blockUser = user?.block &&
      (user?.type == UserTypes.Customer || user?.type == UserTypes.Escort);
    
    if (blockUser) throw new ForbiddenException();

    const payload = {
      email: user?.email,
      roles: user?.roles,
      id: user?._id,
      type: user?.type,
      firebaseToken: user?.firebaseToken ?? '',
    };
    const token = await this.jwtService.signAsync(payload);

    this.eventEmitter.emit(Events.InvalidateSessions, user?.email);
    this.eventEmitter.emit(Events.UserLogin, token, user?.email);

    return token;
  }

  async signUpUserAsync(user: CreateUserDto): Promise<MessageResponseDto> {
    const verificationToken = await this.jwtService.signAsync({ user: user.email });

    user.type = UserTypes.Organization;
    user.verificationToken = verificationToken;

    if (!user.roles) {
      user.roles = [Role.Employee];
    }

    const created = await this.userService.createAsync(user);
    const config = {
      user: created,
      verificationEndpoint: `${this.configService.get<string>('HOST')}/api/v1/authentication/verification/users`,
      templateUrl: this.configService.get<string>('WELCOME_USER_TEMPLATE'),
      subject: this.configService.get<string>('WELCOME_USER_SUBJECT'),
    };

    this.eventEmitter.emit(Events.SignUp, config);

    return { message: 'A varification email was sent to the employee' };
  }

  async signUpCustomerAsync(
    user: CreateUserDto,
    userType: UserTypes,
  ): Promise<MessageResponseDto> {
    const verificationToken = await this.jwtService.signAsync({ user: user.email });
    
    user.roles = [Role.Customer];
    user.verificationToken = verificationToken;
    user.type = userType;
    
    const created = await this.userService.createAsync(user);
    const config = {
      user: created,
      verificationEndpoint: `${this.configService.get<string>('HOST')}/api/v1/authentication/verification/customer`,
      templateUrl: this.configService.get<string>('WELCOME_CUSTOMER_TEMPLATE'),
      subject: this.configService.get<string>('WELCOME_CUSTOMER_SUBJECT'),
    };

    this.eventEmitter.emit(Events.SignUp, config);

    return { message: 'A varification email was sent to you' };
  }

  async verifyCustomerAsync(verificationToken: string): Promise<void> {
    const user = await this.userService.getOneAsync({ verificationToken });

    if (!user) {
      throw new ForbiddenException('Invalid customer');
    }

    this.jwtService.verifyAsync(verificationToken).catch(() => {
      throw new BadRequestException('The verification token is not valid');
    });

    await this.userService.updateOnePartialAsync({ verificationToken }, { verified: true })
  }

}
