import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContacteDocument = Contacte & Document;

@Schema({ timestamps: true })
export class Contacte {
  @Prop() email: string;
  @Prop() name: string;
  @Prop() subject: string;
  @Prop() message: string;
  @Prop() attachment: string;
}

export const ContacteSchema = SchemaFactory.createForClass(Contacte);
