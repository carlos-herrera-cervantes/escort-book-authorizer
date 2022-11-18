import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessTokenModule } from './access-token/access-token.module';
import { HashingModule } from './hashing/hashing.module';
import { UserModule } from './user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MONGODB_URI } from './common/enums/mongo.enum';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(MONGODB_URI),
    AuthenticationModule,
    AccessTokenModule,
    HashingModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
