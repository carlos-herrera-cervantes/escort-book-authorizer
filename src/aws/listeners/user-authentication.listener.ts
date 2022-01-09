import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../../common/enums/events.enum';
import { AwsService } from '../aws.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as http from 'https';

@Injectable()
export class UserAuthenticationListener {

  @Inject(AwsService)
  private readonly awsService: AwsService;

  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;
  
  @OnEvent(Events.SignUp, { async: true })
  async handleUserSignUp(email: string, verificationToken: string): Promise<void> {
    const messageAttributes: AWS.SQS.MessageBodySystemAttributeMap = {
      event: {
        DataType: 'String',
        StringValue: Events.SignUp,
      },
    };

    const verificationUrl = `${verificationToken}`;

    try {
      const welcomeTemplate = await this.readTemplate('');

      const body = JSON.stringify({
        to: email,
        subject: '',
        body: welcomeTemplate.replace('{{placeholder}}', verificationUrl),
      });

      await this.awsService.sendMessageAsync(messageAttributes, body);
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