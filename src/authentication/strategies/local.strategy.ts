import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authenticationService: AuthenticationService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authenticationService.validateUserAsync(email, password);

    if (!user.verified) {
      throw new ForbiddenException('The account is not verified');
    }

    if (!user) {
      throw new UnauthorizedException();
    }
    
    return user;
  }
}