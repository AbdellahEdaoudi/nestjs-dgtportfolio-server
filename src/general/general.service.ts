import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Links, LinksDocument } from '../schemas/links.schema';

@Injectable()
export class GeneralService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Links.name) private linksModel: Model<LinksDocument>,
  ) {}

  async getAllData(email: string) {
    const findemail = await this.userModel.findOne({ email });
    if (!findemail) return null;

    const [users, links] = await Promise.all([
      this.userModel
        .findOne({ email })
        .select('-updatedAt -createdAt -__v')
        .lean(),
      this.linksModel
        .find({ useremail: email })
        .select('-createdAt -updatedAt -__v')
        .lean(),
    ]);

    return { users, links };
  }
}
