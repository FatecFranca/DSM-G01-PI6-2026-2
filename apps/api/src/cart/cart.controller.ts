import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";

@ApiTags("cart")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("cart")
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: "Ver carrinho" })
  get(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub);
  }

  @Post("items")
  @ApiOperation({ summary: "Adicionar ao carrinho" })
  add(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.sub, dto);
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Atualizar quantidade" })
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateItem(user.sub, id, dto.quantity);
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Remover item" })
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cartService.removeItem(user.sub, id);
  }

  @Delete()
  @ApiOperation({ summary: "Limpar carrinho" })
  clear(@CurrentUser() user: JwtPayload) {
    return this.cartService.clear(user.sub);
  }
}
