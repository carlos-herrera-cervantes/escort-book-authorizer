import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Events } from '../../common/enums/events.enum';
import { AccessTokenService } from '../access-token.service';

@Injectable()
export class UserAuthenticationListener {
  @Inject(AccessTokenService)
  private readonly accessTokenService: AccessTokenService;

  @OnEvent(Events.UserLogin, { async: true })
  async handleUserLogin(token: string, user: string): Promise<void> {
    await this.accessTokenService.createAsync({ token, user });
  }

  @OnEvent(Events.UserLogout, { async: true })
  async handlerUserLogout(email: string): Promise<void> {
    await this.accessTokenService.deleteOneAsync({ email });
  }

  @OnEvent(Events.InvalidateSessions, { async: true })
  async handleInvalidateSessions(user: string): Promise<void> {
    await this.accessTokenService.deleteManyAsync({ user });
  }
}
