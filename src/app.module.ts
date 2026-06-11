import { Module, Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { LinksModule } from './links/links.module';
import { ContactsModule } from './contacts/contacts.module';
import { AdminModule } from './admin/admin.module';
import { PaypalModule } from './paypal/paypal.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { PromoModule } from './promo/promo.module';
import { WebhookModule } from './webhook/webhook.module';
import { CustomDomainModule } from './custom-domain/custom-domain.module';
import { GeneralModule } from './general/general.module';
import { CloudinaryProvider } from './common/providers/cloudinary.provider';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    GeneralModule,
    UserModule,
    LinksModule,
    ContactsModule,
    AdminModule,
    PaypalModule,
    SubscriptionModule,
    PromoModule,
    WebhookModule,
    CustomDomainModule,
  ],
  providers: [CloudinaryProvider],
})
export class AppModule {
  constructor(@Inject('CLOUDINARY') private cloudinary: any) {}
}
