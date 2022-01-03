import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../../common/enums/events.enum';
import { AwsService } from '../aws.service';

@Injectable()
export class UserAuthenticationListener {

  @Inject(AwsService)
  private readonly awsService: AwsService;
  
  @OnEvent(Events.SignUp, { async: true })
  async handleUserSignUp(email: string): Promise<void> {
    const messageAttributes: AWS.SQS.MessageBodySystemAttributeMap = {
      event: {
        DataType: 'String',
        StringValue: Events.SignUp,
      },
    };
    const body = JSON.stringify({
      to: email,
      subject: '',
      body: '',
    });

    await this.awsService.sendMessageAsync(messageAttributes, body);
  }

}