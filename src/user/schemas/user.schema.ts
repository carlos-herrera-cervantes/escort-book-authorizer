import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/roles.enum';
import { HashingService } from '../../hashing/hashing.service';
import { UserTypes } from '../enums/types.enum';

export type UserDocument = User & Document;

@Schema({ versionKey: false })
export class User {
  id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: [ Role.Employee ] })
  roles: Role[];

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  verificationToken: string;

  @Prop({ default: UserTypes.Organization })
  type: string;

  @Prop()
  firebaseToken: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ default: false })
  block: boolean;

  @Prop({ default: false })
  deactivated: boolean;

  @Prop({ default: false })
  delete: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function () {
  const hashingService = new HashingService();

  if (!this.isNew) {
    this.updatedAt = new Date();
  } else {
    this.updatedAt = new Date();
    this.createdAt = new Date();
  }

  if (this.password) {
    this.password = await hashingService.hashAsync(this.password);
  }
});
