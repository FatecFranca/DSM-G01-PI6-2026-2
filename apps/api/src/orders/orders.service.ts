import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { decimalToNumber, mapProduct } from "../common/mappers";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Carrinho vazio");
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para ${item.product.name}`
        );
      }
    }

    const total = cart.items.reduce(
      (sum, i) => sum + Number(i.product.price) * i.quantity,
      0
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          status: "PAID",
          total,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.product.price,
              size: i.product.size,
            })),
          },
        },
        include: {
          items: { include: { product: { include: { category: true } } } },
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    return this.mapOrder(order);
  }

  async findMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    });
    if (!order) throw new NotFoundException("Pedido não encontrado");
    return this.mapOrder(order);
  }

  /** Produtos já comprados — base para recomendações futuras */
  async purchasedProducts(userId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { userId } },
      include: { product: { include: { category: true } } },
      distinct: ["productId"],
      orderBy: { order: { createdAt: "desc" } },
    });
    return items.map((i) => mapProduct(i.product));
  }

  private mapOrder(order: {
    id: string;
    status: string;
    total: { toString(): string } | number;
    createdAt: Date;
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: { toString(): string } | number;
      size: string | null;
      product: Parameters<typeof mapProduct>[0];
    }>;
  }) {
    return {
      id: order.id,
      status: order.status,
      total: decimalToNumber(order.total as never),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: decimalToNumber(i.unitPrice as never),
        size: i.size,
        product: mapProduct(i.product),
      })),
    };
  }
}
