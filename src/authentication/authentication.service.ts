import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from '../hashing/hashing.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthenticationService {

  @Inject(UserService)
  private readonly userService: UserService;

  @Inject(HashingService)
  private readonly hashingService: HashingService;

  @Inject(JwtService)
  private readonly jwtService: JwtService;

  async validateUser(email: string, password: string) {
    const user = await this.userService.getOneAsync({ email });
    const validPassword = await this.hashingService.compareAsync(password, user.password);

    if (validPassword) {
      const { password, ...args } = user;
      return args;
    }
    
    return null;
  }

  async login(user: any): Promise<string> {
    const payload = { email: user?.email, roles: user?.roles };
    return this.jwtService.signAsync(payload);
  }

}
