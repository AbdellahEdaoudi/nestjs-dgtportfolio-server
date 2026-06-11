import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true }) userEmail: string;
  @Prop() planId: string;
  @Prop() nameplan: string;
  @Prop() subscriptionID: string;
  @Prop() promoCode: string;
  @Prop({ default: 'subscription' }) paymentType: string;
  @Prop({ default: 'ACTIVE' }) status: string;
  @Prop({ type: Date, default: null }) expiresAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
