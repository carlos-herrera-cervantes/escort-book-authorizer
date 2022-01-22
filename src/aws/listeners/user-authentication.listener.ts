import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../../common/enums/events.enum';
import { AwsService } from '../aws.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as http from 'https';
import { VaultService } from '../../vault/vault.service';

@Injectable()
export class UserAuthenticationListener {

  @Inject(AwsService)
  private readonly awsService: AwsService;

  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  @Inject(VaultService)
  private readonly vaultService: VaultService;
  
  @OnEvent(Events.SignUp, { async: true })
  async handleUserSignUp(email: string, verificationToken: string): Promise<void> {
    const messageAttributes: AWS.SQS.MessageBodySystemAttributeMap = {
      event: {
        DataType: 'String',
        StringValue: Events.SignUp,
      },
    };

    try {
      const verificationEndpoint = await this.vaultService
        .getSecretAsync('escort-book-verification-endpoint');
      const verificationUrl = `${verificationEndpoint}/${verificationToken}`;

      const welcomeTemplateUrl = await this.vaultService
        .getSecretAsync('escort-book-welcome-template');
      const welcomeTemplate = await this.readTemplate(welcomeTemplateUrl);

      const body = JSON.stringify({
        to: email,
        subject: await this.vaultService.getSecretAsync('escort-book-welcome-subject'),
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