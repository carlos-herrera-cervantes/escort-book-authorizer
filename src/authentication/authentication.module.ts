import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../user/user.module';
import { HashingModule } from '../hashing/hashing.module';

@Module({
  imports: [
    UserModule,
    HashingModule,
    JwtModule.register({
      secret: 'mySecretKey',
      signOptions: { expiresIn: '120h' },
    }),
  ],
  providers: [AuthenticationService, LocalStrategy, JwtStrategy],
})
export class AuthenticationModule {}
