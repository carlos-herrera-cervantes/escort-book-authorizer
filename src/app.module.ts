import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccessTokenModule } from './access-token/access-token.module';
import { HashingModule } from './hashing/hashing.module';
import { UserModule } from './user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AwsModule } from './aws/aws.module';
import { VaultModule } from './vault/vault.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI')
      }),
      inject: [ConfigService]
    }),
    AuthenticationModule,
    AccessTokenModule,
    HashingModule,
    UserModule,
    AwsModule,
    VaultModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
