import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VaultService } from './vault.service';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('VAULT_HOST'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {}
