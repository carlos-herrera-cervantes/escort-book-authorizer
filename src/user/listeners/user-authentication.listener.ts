import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FilterQuery } from 'mongoose';
import { Events } from '../../common/enums/events.enum';
import { UserDocument } from '../schemas/user.schema';
import { UserService } from '../user.service';

@Injectable()
export class UserAuthenticationListener {

  @Inject(UserService)
  private readonly userService: UserService;

  @OnEvent(Events.DeleteUser, { async: true })
  async handleUserSignUp(filter: FilterQuery<UserDocument>): Promise<void> {
    await this.userService.deleteOneAsync(filter);
  }

}