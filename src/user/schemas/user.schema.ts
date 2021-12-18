import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/roles.enum';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {

  id: string

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: [ Role.Viewer ] })
  roles: Role[];

  @Prop({ default: new Date().toUTCString() })
  createdAt: Date;

  @Prop({ default: new Date().toUTCString() })
  updateAt: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', function (next) {
  if (this.isNew) {
    console.info('IS NEW');
  }

  console.info('IS NOT NEW');

  next();
});