import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../../common/enums/events.enum';
import { AwsService } from '../aws.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientKafka } from '@nestjs/microservices';
import { UserTypes } from '../../user/enums/types.enum';
import { QueueMessageDTO } from '../dto/queue-message.dto';
import '../../common/extensions/string.extension';

@Injectable()
export class UserAuthenticationListener {
  @Inject(AwsService)
  private readonly awsService: AwsService;

  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  @Inject('EscortBook')
  private readonly client: ClientKafka;

  @OnEvent(Events.SignUp, { async: true })
  async handleUserSignUp(queueMessage: QueueMessageDTO): Promise<void> {
    const messageAttributes: AWS.SQS.MessageBodySystemAttributeMap = {
      event: {
        DataType: 'String',
        StringValue: Events.SignUp,
      },
    };

    const { user, verificationEndpoint, templateUrl, subject } = queueMessage;
    const { verificationToken, type, email } = user;

    try {
      const verificationUrl = `${verificationEndpoint}/${verificationToken}`;
      const welcomeTemplate = await templateUrl.readHtml();

      const body = JSON.stringify({
        to: email,
        subject,
        body: welcomeTemplate.replace('{{placeholder}}', verificationUrl),
      });

      await this.awsService.sendMessageAsync(messageAttributes, body);
      const topic =
        type == UserTypes.Customer
          ? 'customer-created'
          : type == UserTypes.Escort
          ? 'escort-created'
          : 'user-created';

      this.client.emit(topic, JSON.stringify(user));
    } catch {
      this.eventEmitter.emit(Events.DeleteUser, { email });
    }
  }
}
