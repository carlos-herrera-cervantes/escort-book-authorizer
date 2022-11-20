import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
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
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics } from '../common/enums/topics.enum';
import { EmailConfigDto } from './dto/email-config.dto';
import { APP_HOST } from '../common/enums/app.enum';
import {
  WELCOME_USER_TEMPLATE,
  WELCOME_USER_SUBJECT,
  WELCOME_CUSTOMER_TEMPLATE,
  WELCOME_CUSTOMER_SUBJECT,
} from '../common/enums/templates.enum';
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

  @Inject('EscortBook')
  private readonly kafkaClient: ClientKafka;

  async validateUserAsync(email: string, password: string) {
    const user = await this.userService.getOneAsync({ email });

    if (!user) throw new NotFoundException();

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
    const userBlocked = user?.block && (user?.type == UserTypes.Customer || user?.type == UserTypes.Escort);

    if (userBlocked) throw new ForbiddenException();

    const token = await this.jwtService.signAsync({
      email: user?.email,
      roles: user?.roles,
      id: user?._id,
      type: user?.type,
      firebaseToken: user?.firebaseToken ?? '',
    });

    this.eventEmitter.emit(Events.InvalidateSessions, user?.email);
    this.eventEmitter.emit(Events.UserLogin, {
      token,
      user: user?.email,
      userId: user?._id,
    });

    if (user?.deactivated || user?.delete) {
      await this.userService.updateOnePartialAsync({ _id: user?._id }, { deactivated: false, delete: false });
      this.kafkaClient.emit(KafkaTopics.USER_ACTIVE_ACCOUNT, JSON.stringify({ userId: user?._id }));
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
    const config = {
      user: created,
      verificationEndpoint: `${APP_HOST}/api/v1/authentication/verification/users`,
      templateUrl: WELCOME_USER_TEMPLATE,
      subject: WELCOME_USER_SUBJECT,
    };

    await this.emitEmailMessage(config);

    return { message: 'A verification email was sent to the employee' };
  }

  async signUpCustomerAsync(user: CreateUserDto, userType: UserTypes): Promise<MessageResponseDto> {
    const verificationToken = await this.jwtService.signAsync({
      user: user.email,
    });

    user.roles = [Role.Customer];
    user.verificationToken = verificationToken;
    user.type = userType;

    const created = await this.userService.createAsync(user);
    const config = {
      user: created,
      verificationEndpoint: `${APP_HOST}/api/v1/authentication/verification/customer`,
      templateUrl: WELCOME_CUSTOMER_TEMPLATE,
      subject: WELCOME_CUSTOMER_SUBJECT,
    };

    await this.emitEmailMessage(config);

    return { message: 'A verification email was sent to you' };
  }

  async verifyCustomerAsync(verificationToken: string): Promise<void> {
    const user = await this.userService.getOneAsync({ verificationToken });

    if (!user) {
      throw new ForbiddenException('Invalid customer');
    }

    if (user.verified) {
      throw new BadRequestException('Account is already verified');
    }

    this.jwtService.verifyAsync(verificationToken).catch(() => {
      throw new BadRequestException('The verification token is not valid');
    });

    const filter = { verificationToken };
    const changes = { verified: true };
    await this.userService.updateOnePartialAsync(filter, changes);

    this.kafkaClient.emit(KafkaTopics.PAYMENT_METHOD_CHANGES, JSON.stringify(user));
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
