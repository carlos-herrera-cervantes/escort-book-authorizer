import {
  CanActivate,
  Injectable,
  Inject,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AccessTokenService } from '../access-token.service';

@Injectable()
export class RevokeJwtGuard implements CanActivate {

  @Inject(AccessTokenService)
  private readonly accessTokenService: AccessTokenService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { headers, body } = context.switchToHttp().getRequest();
    const accessToken: string = headers?.authorization?.split(' ').pop();

    const isValid = await this.accessTokenService.getOneAsync({ token: accessToken });

    if (isValid) {
      body.user = { email: isValid.user };
      return true;
    }

    throw new ForbiddenException();
  }
}
