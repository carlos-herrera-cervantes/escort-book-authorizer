import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AwsService } from './aws.service';
import { UserAuthenticationListener } from './listeners/user-authentication.listener';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'EscortBook',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'Authorizer',
              brokers: [configService.get<string>('BROKERS')],
            },
          },
        }),
      },
    ]),
  ],
  providers: [AwsService, UserAuthenticationListener],
})
export class AwsModule {}
