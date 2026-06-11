import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromoController } from './promo.controller';
import { PromoService } from './promo.service';
import { Promocode, PromocodeSchema } from '../schemas/promocode.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Promocode.name, schema: PromocodeSchema }])],
  controllers: [PromoController],
  providers: [PromoService],
})
export class PromoModule {}
