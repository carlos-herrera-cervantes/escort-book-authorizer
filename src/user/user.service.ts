import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {

  @InjectModel(User.name)
  private readonly userModel: Model<UserDocument>;

  async getOneAsync(filter: FilterQuery<UserDocument>): Promise<User> {
    return this.userModel.findOne(filter).lean();
  }

  async createAsync(user: CreateUserDto): Promise<User> {
    return this.userModel.create(user);
  }

  async updateOnePartialAsync(filter: FilterQuery<UserDocument>, user: UpdateUserDto): Promise<User> {
    return this.userModel.findOneAndUpdate(filter, { $set: user }, { new: true });
  }

  async deleteOneAsync(filter: FilterQuery<UserDocument>): Promise<void> {
    await this.userModel.findOneAndDelete(filter);
  }

}
