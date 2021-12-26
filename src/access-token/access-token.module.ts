import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessTokenService } from './access-token.service';
import { UserAuthenticationListener } from './listeners/user-authentication.listener';
import { AccessToken, AccessTokenSchema } from './schemas/access-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AccessToken.name, schema: AccessTokenSchema }]),
  ],
  providers: [AccessTokenService, UserAuthenticationListener],
  exports: [AccessTokenService],
})
export class AccessTokenModule {}
