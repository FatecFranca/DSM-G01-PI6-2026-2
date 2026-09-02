import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@sportarena/database";
import { slugify } from "@sportarena/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/product.dto";
import { mapProduct } from "../common/mappers";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(q?: string, categoryId?: string, sport?: string) {
    const where: Prisma.ProductWhereInput = { active: true };

    if (q?.trim()) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { sport: { contains: q, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (sport) where.sport = { equals: sport, mode: "insensitive" };

    const products = await this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return products.map(mapProduct);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, active: true },
      include: { category: true },
    });
    if (!product) throw new NotFoundException("Produto não encontrado");
    return mapProduct(product);
  }

  async create(sellerId: string, dto: CreateProductDto) {
    const base = slugify(dto.name);
    const slug = `${base}-${Date.now().toString(36)}`;

    const product = await this.prisma.product.create({
      data: {
        sellerId,
        name: dto.name,
        slug,
        description: dto.description,
        brand: dto.brand,
        price: dto.price,
        compareAt: dto.compareAt,
        size: dto.size,
        color: dto.color,
        sport: dto.sport,
        stock: dto.stock ?? 0,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
      },
      include: { category: true },
    });
    return mapProduct(product);
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Produto não encontrado");
    await this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
    return { success: true };
  }

  /** Placeholder — recomendações (próximo passo) */
  async recommendations(userId?: string) {
    const products = await this.prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    return {
      algorithm: "placeholder",
      message: "Recomendações personalizadas serão implementadas no próximo passo",
      basedOnUserId: userId ?? null,
      products: products.map(mapProduct),
    };
  }
}
