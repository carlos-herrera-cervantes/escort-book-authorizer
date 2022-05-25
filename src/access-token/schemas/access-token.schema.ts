import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccessTokenDocument = AccessToken & Document;

@Schema({ versionKey: false })
export class AccessToken {
  id: string;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  token: string;

  @Prop({ default: new Date().toUTCString() })
  createdAt: Date;

  @Prop({ default: new Date().toUTCString() })
  updateAt: Date;
}

export const AccessTokenSchema = SchemaFactory.createForClass(AccessToken);
