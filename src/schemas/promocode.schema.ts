import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromocodeDocument = Promocode & Document;

@Schema({ timestamps: true })
export class Promocode {
  @Prop({ required: true, unique: true }) code: string;
}

export const PromocodeSchema = SchemaFactory.createForClass(Promocode);
