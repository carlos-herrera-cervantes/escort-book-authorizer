import { Module } from '@nestjs/common';
import { AccessTokenService } from './access-token.service';

@Module({
  providers: [AccessTokenService]
})
export class AccessTokenModule {}
