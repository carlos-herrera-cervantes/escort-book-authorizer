import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from './schemas/user.schema';
import { UserAuthenticationListener } from './listeners/user-authentication.listener';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UserService, UserAuthenticationListener],
  exports: [UserService],
})
export class UserModule {}
