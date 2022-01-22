import { Module } from '@nestjs/common';
import { VaultModule } from '../vault/vault.module';
import { AwsService } from './aws.service';
import { UserAuthenticationListener } from './listeners/user-authentication.listener';

@Module({
  imports: [VaultModule],
  providers: [AwsService, UserAuthenticationListener]
})
export class AwsModule {}
