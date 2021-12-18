import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {

  @InjectModel(User.name)
  private readonly userModel: Model<UserDocument>;

  async getOneAsync(filter: any): Promise<User> {
    return this.userModel.findOne(filter).lean();
  }

  async createAsync(dto: CreateUserDto): Promise<User> {
    return this.userModel.create(dto);
  }

  async updateOnePartialAsync(filter: any, dto: UpdateUserDto): Promise<User> {
    return this.userModel.findOneAndUpdate(filter, { $set: dto }, { new: true });
  }

}
