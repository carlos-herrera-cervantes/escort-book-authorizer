import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ versionKey: false })
export class Role {
  id: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  active: boolean;

  @Prop({ default: new Date().toUTCString() })
  createdAt: Date;

  @Prop({ default: new Date().toUTCString() })
  updateAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
