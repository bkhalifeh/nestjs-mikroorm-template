import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtUser } from '../types/jwt-user.type';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    if (!req.user) {
      throw new Error(
        'CurrentUser decorator requires a populated request.user; ensure JwtAuthGuard runs first.',
      );
    }
    return req.user;
  },
);
