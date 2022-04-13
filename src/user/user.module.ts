import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from './schemas/user.schema';
import { UserAuthenticationListener } from './listeners/user-authentication.listener';
import { UserController } from './user.controller';
import { AccessTokenModule } from '../access-token/access-token.module';

@Module({
  imports: [
    AccessTokenModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserService, UserAuthenticationListener],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
