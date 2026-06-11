import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contacte, ContacteSchema } from '../schemas/contacte.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Contacte.name, schema: ContacteSchema }])],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
