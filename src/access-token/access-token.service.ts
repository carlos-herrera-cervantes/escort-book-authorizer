import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  AccessToken,
  AccessTokenDocument,
} from './schemas/access-token.schema';
import { CreateAccessTokenDto } from './dto/create-access-token.dto';
import { FilterQuery } from 'mongoose';

@Injectable()
export class AccessTokenService {
  @InjectModel(AccessToken.name)
  private readonly productModel: Model<AccessTokenDocument>;

  async getOneAsync(filter?: FilterQuery<AccessTokenDocument>): Promise<AccessToken> {
    return this.productModel.findOne(filter).lean();
  }

  async countAsync(filter?: FilterQuery<AccessTokenDocument>): Promise<number> {
    return this.productModel.countDocuments(filter);
  }

  async createAsync(dto: CreateAccessTokenDto): Promise<AccessToken> {
    return this.productModel.create(dto);
  }

  async deleteOneAsync(filter?: FilterQuery<AccessTokenDocument>): Promise<void> {
    await this.productModel.findOneAndDelete(filter);
  }

  async deleteManyAsync(filter?: FilterQuery<AccessTokenDocument>): Promise<void> {
    await this.productModel.deleteMany(filter);
  }
}
