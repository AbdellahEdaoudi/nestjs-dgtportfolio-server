import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Links, LinksSchema } from '../schemas/links.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Links.name, schema: LinksSchema },
    ]),
  ],
  controllers: [GeneralController],
  providers: [GeneralService],
})
export class GeneralModule {}
