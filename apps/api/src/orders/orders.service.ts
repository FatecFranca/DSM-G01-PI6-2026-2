import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { decimalToNumber, mapProduct } from "../common/mappers";
import { PubSubService } from "../messaging/pubsub.service";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private pubSubService: PubSubService,
  ) {}

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
              size: i.size || i.product.size,
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

    const mappedOrder = this.mapOrder(order);

    // Dispara a mensageria na nuvem (Pub/Sub) com a categoria inclusa
    await this.pubSubService.publishOrderMessage({
      orderId: mappedOrder.id,
      userId,
      total: mappedOrder.total,
      items: mappedOrder.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        category: i.product.category?.name ?? 'Geral', // <--- Categoria adicionada aqui de forma limpa
        quantity: i.quantity,
        size: i.size,
      })),
      createdAt: mappedOrder.createdAt,
    });

    return mappedOrder;
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