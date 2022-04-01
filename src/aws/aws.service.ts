import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class AwsService {

  private queueUrl: string;

  private sqs: AWS.SQS;

  constructor(private readonly configService: ConfigService) {
    AWS.config.update({
      region: this.configService.get<string>('REGION'),
    });

    this.queueUrl = this.configService.get<string>('QUEUE_URL');
    const awsEndpoint = this.configService.get<string>('AWS_ENDPOINT');

    this.sqs = new AWS.SQS({
      apiVersion: this.configService.get<string>('SQS_VERSION'),
      endpoint: new AWS.Endpoint(awsEndpoint),
      accessKeyId: this.configService.get<string>('ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('SECRET_ACCESS_KEY'),
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
