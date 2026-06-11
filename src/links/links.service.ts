import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Links, LinksDocument } from '../schemas/links.schema';

@Injectable()
export class LinksService {
  constructor(@InjectModel(Links.name) private linksModel: Model<LinksDocument>) {}

  async getLinkByEmail(email: string, reqEmail: string) {
    if (email !== reqEmail) throw { status: 403, message: 'Forbidden' };
    const link = await this.linksModel.find({ useremail: email });
    if (!link) throw { status: 404, message: 'Link not found' };
    return link;
  }

  async createLink(body: any, reqEmail: string) {
    if (body.useremail !== reqEmail) throw { status: 403, message: 'Forbidden' };
    body.namelink = body.namelink?.substring(0, 100);
    body.link = body.link?.substring(0, 100);

    const count = await this.linksModel.countDocuments({ useremail: reqEmail });
    if (count >= 10) throw { status: 400, message: 'Maximum 10 links allowed' };

    const newLink = new this.linksModel(body);
    await newLink.save();
    return newLink;
  }

  async updateLink(id: string, body: any, reqEmail: string) {
    if (body.useremail !== reqEmail) throw { status: 403, message: 'Forbidden' };
    body.namelink = body.namelink?.substring(0, 100);
    body.link = body.link?.substring(0, 100);
    const updatedLink = await this.linksModel.findByIdAndUpdate(id, body, { new: true });
    if (!updatedLink) throw { status: 404, message: 'Link not found' };
    return updatedLink;
  }

  async deleteLink(id: string, reqEmail: string) {
    const linkToDelete = await this.linksModel.findById(id);
    if (!linkToDelete) throw { status: 404, message: 'Link not found' };
    if (linkToDelete.useremail !== reqEmail) throw { status: 403, message: 'Forbidden' };
    const deletedLink = await this.linksModel.findByIdAndDelete(id);
    return deletedLink;
  }
}
