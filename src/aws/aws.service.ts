import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {

  private readonly queueUrl: string;

  private readonly sqs: AWS.SQS;

  constructor() {
    AWS.config.update({ region: '' });

    this.sqs = new AWS.SQS({
      apiVersion: '',
      endpoint: new AWS.Endpoint(''),
      accessKeyId: '',
      secretAccessKey: '',
    });
  }

  async sendMessageAsync(
    messageAttributes: AWS.SQS.MessageBodyAttributeMap,
    body: string,
  ): Promise<void> {
    const params: AWS.SQS.SendMessageRequest = {
      MessageAttributes: messageAttributes,
      MessageBody: body,
      QueueUrl: this.queueUrl,
    };

    await this.sqs.sendMessage(params).promise();
  }
  
}
