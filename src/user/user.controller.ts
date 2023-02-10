import { Controller, Inject, Patch, Body, Get, Headers } from '@nestjs/common';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './schemas/role.schema';
import { UserService } from './user.service';

@Controller('/api/v1/authentication/users')
export class UserController {
  @Inject(UserService)
  private readonly userService: UserService;

  @Get('roles')
  async getRoles(): Promise<Role[]> {
    return this.userService.getRoles();
  }

  @Patch('firebase-token')
  async setFirebaseToken(@Headers('user-email') userEmail: string, @Body() user: UpdateUserDto): Promise<MessageResponseDto> {
    await this.userService.updateOnePartialAsync({ email: userEmail }, user);
    return { message: 'OK' };
  }
}
