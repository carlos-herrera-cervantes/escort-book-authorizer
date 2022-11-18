import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../user/user.module';
import { HashingModule } from '../hashing/hashing.module';
import { AuthenticationController } from './authentication.controller';
import { AccessTokenModule } from '../access-token/access-token.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JWT_EXPIRATION, JWT_SECRET_KEY } from '../common/enums/app.enum';
import { KAFKA_BROKERS } from '../common/enums/topics.enum';

@Module({
  imports: [
    AccessTokenModule,
    UserModule,
    HashingModule,
    JwtModule.register({
      secret: JWT_SECRET_KEY,
      signOptions: { expiresIn: JWT_EXPIRATION },
    }),
    ClientsModule.register([
      {
        name: 'EscortBook',
        transport: Transport.KAFKA,
        options: {
          client: { clientId: 'Authentication', brokers: [KAFKA_BROKERS] },
        },
      },
    ]),
  ],
  providers: [AuthenticationService, LocalStrategy, JwtStrategy],
  controllers: [AuthenticationController],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
