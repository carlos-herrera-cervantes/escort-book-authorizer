import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MessageResponseDto } from '../common/dto/message-response.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthenticationService } from './authentication.service';
import { JwtResponseDto } from './dto/jwt-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from '../user/schemas/user.schema';
import { RevokeJwtGuard } from '../access-token/guards/revoke-jwt.guard';
import { Response } from 'express';
import { UserTypes } from '../user/enums/types.enum';

@Controller('/api/v1/authentication')
export class AuthenticationController {

  @Inject(AuthenticationService)
  private readonly authenticationService: AuthenticationService;

  @Get('verification/customer/:verification_token')
  async verifyCustomerAsync(
    @Res() res: Response,
    @Param('verification_token') verificationToken: string,
  ): Promise<any> {
    await this.authenticationService.verifyCustomerAsync(verificationToken);
    const template = await this.authenticationService.getSuccessTemplateAsync();
    res.send(template);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginAsync(@Req() req: any): Promise<JwtResponseDto> {
    return { accessToken: await this.authenticationService.loginAsync(req?.user) };
  }

  @Post('logout')
  @UseGuards(RevokeJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAsync(@Req() req: any): void {
    const accessToken: string = req?.headers?.authorization?.split(' ').pop();
    this.authenticationService.logoutAsync(accessToken);
  }

  @Post('/customer/sign-up')
  async registerCustomerAsync(@Body() user: CreateUserDto): Promise<MessageResponseDto> {
    return this.authenticationService.signUpCustomerAsync(user, UserTypes.Customer);
  }

  @Post('/user/sign-up')
  async registerUserAsync(@Body() user: CreateUserDto): Promise<User> {
    return this.authenticationService.signUpUserAsync(user);
  }

  @Post('/escort/sign-up')
  async registerEscortAsync(@Body() user: CreateUserDto): Promise<MessageResponseDto> {
    return this.authenticationService.signUpCustomerAsync(user, UserTypes.Escort);
  }
}
