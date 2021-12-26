import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { UserAuthenticationListener } from './listeners/user-authentication.listener';

@Module({
  providers: [AwsService, UserAuthenticationListener]
})
export class AwsModule {}
