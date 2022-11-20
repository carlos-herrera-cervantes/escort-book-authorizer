import { Controller, Inject, Patch, Req, Body, Get } from '@nestjs/common';
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
  async setFirebaseToken(@Req() req: any, @Body() user: UpdateUserDto): Promise<MessageResponseDto> {
    await this.userService.updateOnePartialAsync({ email: req.body.user.email }, user);
    return { message: 'OK' };
  }
}
