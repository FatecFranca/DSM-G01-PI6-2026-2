import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post("checkout")
  @ApiOperation({ summary: "Finalizar compra a partir do carrinho" })
  checkout(@CurrentUser() user: JwtPayload) {
    return this.ordersService.checkout(user.sub);
  }

  @Get()
  @ApiOperation({ summary: "Meus pedidos" })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.ordersService.findMine(user.sub);
  }

  @Get("purchased")
  @ApiOperation({ summary: "Produtos que você comprou (base p/ recomendações)" })
  purchased(@CurrentUser() user: JwtPayload) {
    return this.ordersService.purchasedProducts(user.sub);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe do pedido" })
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ordersService.findOne(user.sub, id);
  }
}
