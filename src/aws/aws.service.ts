import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class AwsService implements OnModuleInit {

  private queueUrl: string;

  private sqs: AWS.SQS;

  @Inject(VaultService)
  private readonly vaultService: VaultService;

  async onModuleInit(): Promise<void> {
    AWS.config.update({
      region: await this.vaultService.getSecretAsync('escort-book-region'),
    });

    this.queueUrl = await this.vaultService
      .getSecretAsync('escort-book-messenger-sqs-url');
    const awsEndpoint = await this.vaultService
      .getSecretAsync('escort-book-aws-endpoint');

    this.sqs = new AWS.SQS({
      apiVersion: await this.vaultService
        .getSecretAsync('escort-book-sqs-version'),
      endpoint: new AWS.Endpoint(awsEndpoint),
      accessKeyId: await this.vaultService
        .getSecretAsync('escort-book-access-key-id'),
      secretAccessKey: await this.vaultService
        .getSecretAsync('escort-book-secret-access-key'),
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
