import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Links, LinksSchema } from '../schemas/links.schema';
import { Contacte, ContacteSchema } from '../schemas/contacte.schema';
import { Subscription, SubscriptionSchema } from '../schemas/subscription.schema';
import { Promocode, PromocodeSchema } from '../schemas/promocode.schema';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Links.name, schema: LinksSchema },
      { name: Contacte.name, schema: ContacteSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Promocode.name, schema: PromocodeSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, EmailService],
})
export class AdminModule {}
