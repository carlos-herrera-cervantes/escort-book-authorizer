import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../hashing/hashing.service';
import { UserService } from '../user/user.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Events } from '../common/enums/events.enum';

@Injectable()
export class AuthenticationService {

  @Inject(UserService)
  private readonly userService: UserService;

  @Inject(HashingService)
  private readonly hashingService: HashingService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  async validateUserAsync(email: string, password: string) {
    const user = await this.userService.getOneAsync({ email });
    const validPassword = await this.hashingService.compareAsync(password, user.password);

    if (validPassword) {
      const { password, ...args } = user;
      return args;
    }
    
    return null;
  }

  logoutAsync(token: string): void {
    this.eventEmitter.emit(Events.UserLogout, token);
  }

  async loginAsync(user: any): Promise<string> {
    const payload = { email: user?.email, roles: user?.roles };
    const token = await this.jwtService.signAsync(payload);

    this.eventEmitter.emit(Events.InvalidateSessions, user?.email);
    this.eventEmitter.emit(Events.UserLogin, token, user?.email);

    return token;
  }

}
