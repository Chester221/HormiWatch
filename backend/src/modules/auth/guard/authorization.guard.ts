import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { Role } from '../enums/roles.enum';
import { IJwtPayload } from '../interface/payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos desde el decorador `@Roles`
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no se definen roles, se permite el acceso
    }

    const request: { user?: IJwtPayload } = context.switchToHttp().getRequest();
    const user = request.user as IJwtPayload;

    if (!user || !user.role) {
      return false; // Rechazar si no hay usuario o no tiene rol
    }

    return requiredRoles.includes(user.role as Role); // Validar si el usuario tiene un rol permitido
  }
}
