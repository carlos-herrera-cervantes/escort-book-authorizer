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
import { RevokeJwtGuard } from '../access-token/guards/revoke-jwt.guard';
import { Response } from 'express';
import { UserTypes } from '../user/enums/types.enum';
import {
  VERIFICATION_CUSTOMER_TEMPLATE,
  VERIFICATION_USER_TEMPLATE,
} from '../common/enums/templates.enum';
import '../common/extensions/string.extension';

@Controller('/api/v1/authentication')
export class AuthenticationController {
  @Inject(AuthenticationService)
  private readonly authenticationService: AuthenticationService;

  @Get('verification/customers/:verification_token')
  async verifyCustomerAsync(
    @Res() res: Response,
    @Param('verification_token') verificationToken: string,
  ): Promise<any> {
    await this.authenticationService.verifyCustomerAsync(verificationToken);
    const html = await VERIFICATION_CUSTOMER_TEMPLATE.readHtml();
    res.send(html);
  }

  @Get('verification/users/:verification_token')
  async verifyUserAsync(
    @Res() res: Response,
    @Param('verification_token') verificationToken: string,
  ): Promise<any> {
    await this.authenticationService.verifyCustomerAsync(verificationToken);
    const html = await VERIFICATION_USER_TEMPLATE.readHtml();
    res.send(html);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginAsync(@Req() req: any): Promise<JwtResponseDto> {
    return {
      accessToken: await this.authenticationService.loginAsync(req?.user),
    };
  }

  @Post('logout')
  @UseGuards(RevokeJwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logoutAsync(@Req() req: any): void {
    this.authenticationService.logoutAsync(req?.body?.user?.email);
  }

  @Post('/customers/sign-up')
  async registerCustomerAsync(@Body() user: CreateUserDto): Promise<MessageResponseDto> {
    return this.authenticationService.signUpCustomerAsync(user, UserTypes.Customer);
  }

  @Post('/users/sign-up')
  async registerUserAsync(@Body() user: CreateUserDto): Promise<MessageResponseDto> {
    return this.authenticationService.signUpUserAsync(user);
  }

  @Post('/escorts/sign-up')
  async registerEscortAsync(@Body() user: CreateUserDto): Promise<MessageResponseDto> {
    return this.authenticationService.signUpCustomerAsync(user, UserTypes.Escort);
  }
}
