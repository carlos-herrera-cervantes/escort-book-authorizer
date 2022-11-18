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

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.pre<RoleDocument>('save', function () {
  if (this.isNew) {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    return;
  }

  this.updatedAt = new Date();
});
