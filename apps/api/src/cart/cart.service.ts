import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { decimalToNumber, mapProduct } from "../common/mappers";
import { AddCartItemDto } from "./dto/cart.dto";

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const full = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: { include: { category: true } } },
          orderBy: { id: "asc" },
        },
      },
    });

    const items = full.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      product: mapProduct(item.product),
    }));

    const total = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0
    );

    return {
      id: full.id,
      items,
      total,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, active: true },
    });
    if (!product) throw new NotFoundException("Produto não encontrado");
    if (product.stock < dto.quantity) {
      throw new BadRequestException("Estoque insuficiente");
    }

    const cart = await this.ensureCart(userId);

    await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
      update: { quantity: { increment: dto.quantity } },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
    });

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException("Item não encontrado");

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException("Item não encontrado");
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
}
