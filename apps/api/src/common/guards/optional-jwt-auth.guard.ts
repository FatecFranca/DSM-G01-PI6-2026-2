import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

/** Aceita request sem token; se houver Bearer válido, popula request.user */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return true;
    }
    try {
      const payload = await this.jwtService.verifyAsync(authHeader.slice(7), {
        secret: this.config.get<string>("JWT_SECRET"),
      });
      request.user = payload;
    } catch {
      // ignora token inválido — endpoint público
    }
    return true;
  }
}
