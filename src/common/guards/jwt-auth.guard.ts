import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader =
      request.headers['authorization'] || request.headers['Authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token is missing');
    }

    try {
      const user = jwt.verify(token, process.env.NEXTAUTH_SECRET as string);
      request.user = user;
      return true;
    } catch (err) {
      console.error('Authentication error:', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
