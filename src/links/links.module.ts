import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { Links, LinksSchema } from '../schemas/links.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Links.name, schema: LinksSchema }])],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
