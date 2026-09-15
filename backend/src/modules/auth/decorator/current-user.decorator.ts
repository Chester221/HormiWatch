import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IActiveUser } from '../interface/payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IActiveUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);