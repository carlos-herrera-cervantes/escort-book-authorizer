import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AccessToken, AccessTokenDocument } from './schemas/access-token.schema';
import { CreateAccessTokenDto } from './dto/create-access-token.dto';

@Injectable()
export class AccessTokenService {

  @InjectModel(AccessToken.name)
  private readonly productModel: Model<AccessTokenDocument>;

  async getOneAsync(filter?: any): Promise<AccessToken> {
    return this.productModel.findOne(filter).lean();
  }

  async createAsync(dto: CreateAccessTokenDto): Promise<AccessToken> {
    return this.productModel.create(dto);
  }

  async deleteOneAsync(token: string): Promise<void> {
    await this.productModel.findOneAndDelete({ token });
  }

}
