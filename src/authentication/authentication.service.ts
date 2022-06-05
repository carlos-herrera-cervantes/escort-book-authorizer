import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
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
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics } from '../common/enums/topics.enum';
import { EmailConfigDto } from './dto/email-config.dto';
import '../common/extensions/string.extension';

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

  @Inject('EscortBook')
  private readonly kafkaClient: ClientKafka;

  async validateUserAsync(email: string, password: string) {
    const user = await this.userService.getOneAsync({ email });
    const validPassword = await this.hashingService.compareAsync(
      password,
      user.password,
    );

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
    const blockUser =
      user?.block &&
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

    if (user?.deactivated || user?.delete) {
      await this.userService.updateOnePartialAsync(
        { _id: user?._id },
        { deactivated: false, delete: false },
      );
      const message = { userId: user?._id };
      this.kafkaClient.emit(
        KafkaTopics.USER_ACTIVE_ACCOUNT,
        JSON.stringify(message),
      );
    }

    return token;
  }

  async signUpUserAsync(user: CreateUserDto): Promise<MessageResponseDto> {
    const verificationToken = await this.jwtService.signAsync({
      user: user.email,
    });

    user.type = UserTypes.Organization;
    user.verificationToken = verificationToken;

    if (!user.roles) {
      user.roles = [Role.Employee];
    }

    const created = await this.userService.createAsync(user);
    const host = this.configService.get<string>('HOST');
    const config = {
      user: created,
      verificationEndpoint: `${host}/api/v1/authentication/verification/users`,
      templateUrl: this.configService.get<string>('WELCOME_USER_TEMPLATE'),
      subject: this.configService.get<string>('WELCOME_USER_SUBJECT'),
    };

    await this.emitEmailMessage(config);

    return { message: 'A verification email was sent to the employee' };
  }

  async signUpCustomerAsync(
    user: CreateUserDto,
    userType: UserTypes,
  ): Promise<MessageResponseDto> {
    const verificationToken = await this.jwtService.signAsync({
      user: user.email,
    });

    user.roles = [Role.Customer];
    user.verificationToken = verificationToken;
    user.type = userType;

    const created = await this.userService.createAsync(user);
    const host = this.configService.get<string>('HOST');
    const config = {
      user: created,
      verificationEndpoint: `${host}/api/v1/authentication/verification/customer`,
      templateUrl: this.configService.get<string>('WELCOME_CUSTOMER_TEMPLATE'),
      subject: this.configService.get<string>('WELCOME_CUSTOMER_SUBJECT'),
    };

    await this.emitEmailMessage(config);

    return { message: 'A verification email was sent to you' };
  }

  async verifyCustomerAsync(verificationToken: string): Promise<void> {
    const user = await this.userService.getOneAsync({ verificationToken });

    if (!user) {
      throw new ForbiddenException('Invalid customer');
    }

    this.jwtService.verifyAsync(verificationToken).catch(() => {
      throw new BadRequestException('The verification token is not valid');
    });

    const filter = { verificationToken };
    const changes = { verified: true };
    await this.userService.updateOnePartialAsync(filter, changes);
  }

  private async emitEmailMessage(emailConfig: EmailConfigDto) {
    const { user, verificationEndpoint, templateUrl, subject } = emailConfig;
    const { verificationToken, type, email } = user;
    const verificationUrl = `${verificationEndpoint}/${verificationToken}`;

    try {
      const welcomeTemplate = await templateUrl.readHtml();
      const emailMessage = JSON.stringify({
        to: email,
        subject,
        body: welcomeTemplate.replace('{{placeholder}}', verificationUrl),
      });
      const topic =
        type == UserTypes.Customer
          ? KafkaTopics.CUSTOMER_CREATED
          : type == UserTypes.Escort
          ? KafkaTopics.ESCORT_CREATED
          : KafkaTopics.USER_CREATED;

      this.kafkaClient.emit(topic, JSON.stringify(user));
      this.kafkaClient.emit(KafkaTopics.SEND_EMAIL, emailMessage);
    } catch {
      this.eventEmitter.emit(Events.DeleteUser, { email });
    }
  }
}
