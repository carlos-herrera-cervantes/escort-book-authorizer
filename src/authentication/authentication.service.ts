import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../hashing/hashing.service';
import { UserService } from '../user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from '../common/enums/events.enum';
import { User } from '../user/schemas/user.schema';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { Role } from '../user/enums/roles.enum';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import * as http from 'https';
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

  logoutAsync(token: string): void {
    this.eventEmitter.emit(Events.UserLogout, token);
  }

  async loginAsync(user: any): Promise<string> {
    const payload = {
      email: user?.email,
      roles: user?.roles,
      id: user?._id,
      type: user?.type,
      firebaseToken: user?.firebaseToken,
    };
    const token = await this.jwtService.signAsync(payload);

    this.eventEmitter.emit(Events.InvalidateSessions, user?.email);
    this.eventEmitter.emit(Events.UserLogin, token, user?.email);

    return token;
  }

  async signUpUserAsync(user: CreateUserDto): Promise<User> {
    user.verified = true;
    user.type = UserTypes.Organization;
    return this.userService.createAsync(user);
  }

  async signUpCustomerAsync(
    user: CreateUserDto,
    userType: UserTypes,
  ): Promise<MessageResponseDto> {
    const verificationToken = await this.jwtService.signAsync({ user: user.email });
    
    user.roles = [Role.Customer];
    user.verificationToken = verificationToken
    user.type = userType;
    
    const created = await this.userService.createAsync(user);
    this.eventEmitter.emit(Events.SignUp, created);

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

  async getSuccessTemplateAsync(): Promise<string> {
    const successTemplateUrl = this.configService.get<string>('VERIFICATION_TEMPLATE');

    return new Promise((resolve, reject) => {
      const request = http.get(successTemplateUrl, response => {
        let data: string = '';

        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });
  
      request.on('error', error => reject(error));
      request.end();
    });
  }

}
