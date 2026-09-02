import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { mapUser } from "../common/mappers";
import { normalizePhone } from "@sportarena/utils";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("E-mail já cadastrado");

    if (dto.phone) {
      const phone = normalizePhone(dto.phone);
      const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
      if (existingPhone) throw new ConflictException("Telefone já cadastrado");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone ? normalizePhone(dto.phone) : null,
        passwordHash,
        cart: { create: {} },
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Credenciais inválidas");
    }
    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException("Usuário não encontrado");
      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException("Refresh token inválido");
    }
  }

  private async buildAuthResponse(user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: Date;
  }) {
    const accessExpires = this.config.get<string>("JWT_EXPIRES_IN") ?? "15m";
    const refreshExpires = this.config.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "7d";

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        {
          secret: this.config.getOrThrow<string>("JWT_SECRET"),
          expiresIn: accessExpires as `${number}m`,
        }
      ),
      this.jwt.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        {
          secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
          expiresIn: refreshExpires as `${number}d`,
        }
      ),
    ]);

    return { user: mapUser(user), accessToken, refreshToken };
  }
}
