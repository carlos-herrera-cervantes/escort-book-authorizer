import { Controller, Inject, Patch, Req, Body, UseGuards } from '@nestjs/common';
import { RevokeJwtGuard } from '../access-token/guards/revoke-jwt.guard';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('/api/v1/authentication/users')
export class UserController {

  @Inject(UserService)
  private readonly userService: UserService;

  @Patch('firebase-token')
  @UseGuards(RevokeJwtGuard)
  async setFirebaseToken(@Req() req: any, @Body() user: UpdateUserDto): Promise<MessageResponseDto> {
    await this.userService.updateOnePartialAsync({ email: req.body.user.email }, user);
    return { message: 'OK' };
  }

}