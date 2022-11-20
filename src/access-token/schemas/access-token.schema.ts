import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccessTokenDocument = AccessToken & Document;

@Schema({ versionKey: false })
export class AccessToken {
  _id: string;

  @Prop({ type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  token: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const AccessTokenSchema = SchemaFactory.createForClass(AccessToken);

AccessTokenSchema.pre<AccessTokenDocument>('save', function () {
  if (!this.isNew) return;

  this.createdAt = new Date();
  this.updatedAt = new Date();
});
