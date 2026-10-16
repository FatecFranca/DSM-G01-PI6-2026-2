import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@sportarena/database";
import { slugify } from "@sportarena/utils";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProductDto } from "./dto/product.dto";
import { mapProduct } from "../common/mappers";
import {
  CATALOG_SECTIONS,
  COLLECTION_LABELS,
  CatalogSection,
  PRODUCT_COLLECTIONS,
} from "./collections";

export const MAX_PAGE_SIZE = 45;

export type ProductListQuery = {
  q?: string;
  categoryId?: string;
  sport?: string;
  collection?: string;
  page?: number;
};

/** Páginas de tamanho equilibrado (≤ max): 100 itens viram 34 + 33 + 33, e não 45 + 45 + 10. */
function splitEvenly<T>(items: T[], max = MAX_PAGE_SIZE): T[][] {
  if (!items.length) return [];
  const pageCount = Math.ceil(items.length / max);
  const base = Math.floor(items.length / pageCount);
  const extra = items.length % pageCount;
  const pages: T[][] = [];
  let start = 0;
  for (let i = 0; i < pageCount; i++) {
    const size = base + (i < extra ? 1 : 0);
    pages.push(items.slice(start, start + size));
    start += size;
  }
  return pages;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll({ q, categoryId, sport, collection, page = 1 }: ProductListQuery) {
    const base: Prisma.ProductWhereInput = { active: true };
    if (q?.trim()) {
      base.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { sport: { contains: q, mode: "insensitive" } },
      ];
    }
    if (categoryId) base.categoryId = categoryId;
    if (sport) base.sport = { equals: sport, mode: "insensitive" };

    let sections: (CatalogSection & { priority?: number })[] = CATALOG_SECTIONS;
    if (collection) {
      const rule = PRODUCT_COLLECTIONS[collection];
      if (!rule) {
        throw new BadRequestException(`Coleção desconhecida: ${collection}`);
      }
      sections = [{ slug: collection, label: COLLECTION_LABELS[collection], where: rule }];
    }

    const assigned = new Set<string>();
    const idsBySection = new Map<string, string[]>();
    const byPriority = [...sections].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    for (const section of byPriority) {
      const rows = await this.prisma.product.findMany({
        where: section.where ? { AND: [base, section.where] } : base,
        select: { id: true },
        orderBy: [{ sport: "asc" }, { name: "asc" }, { id: "asc" }],
      });
      const ids = rows.map((r) => r.id).filter((id) => !assigned.has(id));
      ids.forEach((id) => assigned.add(id));
      idsBySection.set(section.slug, ids);
    }

    const pages: { section: CatalogSection; ids: string[] }[] = [];
    const summaries: {
      slug: string;
      label: string;
      total: number;
      firstPage: number;
      pageCount: number;
    }[] = [];
    for (const section of sections) {
      const ids = idsBySection.get(section.slug) ?? [];
      const chunks = splitEvenly(ids);
      if (!chunks.length) continue;
      summaries.push({
        slug: section.slug,
        label: section.label,
        total: ids.length,
        firstPage: pages.length + 1,
        pageCount: chunks.length,
      });
      for (const chunk of chunks) pages.push({ section, ids: chunk });
    }

    const totalPages = pages.length;
    const current = Math.min(Math.max(1, Math.trunc(page) || 1), Math.max(totalPages, 1));
    const entry = pages[current - 1];

    let items: ReturnType<typeof mapProduct>[] = [];
    if (entry) {
      const products = await this.prisma.product.findMany({
        where: { id: { in: entry.ids } },
        include: { category: true },
      });
      const position = new Map(entry.ids.map((id, i) => [id, i]));
      products.sort((a, b) => position.get(a.id)! - position.get(b.id)!);
      items = products.map(mapProduct);
    }

    return {
      items,
      page: current,
      totalPages,
      total: assigned.size,
      section: entry ? { slug: entry.section.slug, label: entry.section.label } : null,
      sections: summaries,
    };
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

  /**
   * Sugestões só com base em compras feitas.
   * Sem login ou sem pedidos → lista vazia (nada na home).
   */
  async recommendations(userId?: string) {
    if (!userId) {
      return {
        algorithm: "related-by-purchase",
        basedOn: null,
        message: "Faça uma compra para receber sugestões.",
        products: [],
      };
    }

    const orderItem = await this.prisma.orderItem.findFirst({
      where: { order: { userId } },
      include: { product: { include: { category: true } } },
      orderBy: { id: "desc" },
    });

    const basedOn = orderItem?.product?.active ? orderItem.product : null;

    if (!basedOn) {
      return {
        algorithm: "related-by-purchase",
        basedOn: null,
        message: "Nenhuma compra encontrada para sugerir produtos.",
        products: [],
      };
    }

    const related = await this.prisma.product.findMany({
      where: {
        active: true,
        id: { not: basedOn.id },
        OR: [
          basedOn.sport
            ? { sport: { equals: basedOn.sport, mode: "insensitive" } }
            : undefined,
          basedOn.categoryId ? { categoryId: basedOn.categoryId } : undefined,
        ].filter(Boolean) as Prisma.ProductWhereInput[],
      },
      include: { category: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    let products = related;
    if (products.length < 3) {
      const extras = await this.prisma.product.findMany({
        where: {
          active: true,
          id: {
            notIn: [basedOn.id, ...products.map((p) => p.id)],
          },
        },
        include: { category: true },
        take: 6 - products.length,
        orderBy: { createdAt: "desc" },
      });
      products = [...products, ...extras];
    }

    return {
      algorithm: "related-by-purchase",
      basedOn: mapProduct(basedOn),
      message: `Se você gostou do produto ${basedOn.name}, pode gostar destes`,
      products: products.map(mapProduct),
    };
  }
}
