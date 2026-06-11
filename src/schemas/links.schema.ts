import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LinksDocument = Links & Document;

@Schema({ timestamps: true })
export class Links {
  @Prop({ required: true }) useremail: string;
  @Prop() namelink: string;
  @Prop() link: string;
}

export const LinksSchema = SchemaFactory.createForClass(Links);
