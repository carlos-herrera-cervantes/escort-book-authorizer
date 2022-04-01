import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../../common/enums/events.enum';
import { AwsService } from '../aws.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as http from 'https';
import { ClientKafka } from '@nestjs/microservices';
import { User } from '../../user/schemas/user.schema';
import { UserTypes } from '../../user/enums/types.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserAuthenticationListener {

  @Inject(AwsService)
  private readonly awsService: AwsService;

  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  @Inject(ConfigService)
  private readonly configService: ConfigService;

  @Inject('EscortBook')
  private readonly client: ClientKafka;
  
  @OnEvent(Events.SignUp, { async: true })
  async handleUserSignUp(user: User): Promise<void> {
    const messageAttributes: AWS.SQS.MessageBodySystemAttributeMap = {
      event: {
        DataType: 'String',
        StringValue: Events.SignUp,
      },
    };

    const { email, type, verificationToken } = user;

    try {
      const verificationEndpoint = this.configService.get<string>('VERIFICATION_ENDPOINT');
      const verificationUrl = `${verificationEndpoint}/${verificationToken}`;

      const welcomeTemplateUrl = this.configService.get<string>('WELCOME_TEMPLATE');
      const welcomeTemplate = await this.readTemplate(welcomeTemplateUrl);

      const body = JSON.stringify({
        to: email,
        subject: this.configService.get<string>('WELCOME_SUBJECT'),
        body: welcomeTemplate.replace('{{placeholder}}', verificationUrl),
      });

      await this.awsService.sendMessageAsync(messageAttributes, body);
      type == UserTypes.Customer ?
        this.client.emit('customer-created', JSON.stringify(user)) :
        this.client.emit('escort-created', JSON.stringify(user));
    }
    catch {
      this.eventEmitter.emit(Events.DeleteUser, { email });
    }
  }

  private async readTemplate(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = http.get(url, response => {
        let data: string = '';

        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });
  
      request.on('error', error => reject(error));
      request.end();
    });
  }

}