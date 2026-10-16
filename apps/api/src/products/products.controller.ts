import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/product.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { CurrentUser, JwtPayload } from "../common/decorators/current-user.decorator";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "Listar / buscar produtos" })
  @ApiQuery({ name: "q", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "sport", required: false })
  @ApiQuery({
    name: "collection",
    required: false,
    description:
      "camisetas, camisetas-adulto, camisetas-infantil, calcas, shorts, tops-sutias, moletons, artigos-esportivos, tenis, tenis-masculino, tenis-feminino",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Página (1..totalPages). Cada página traz até 45 produtos de uma única seção/categoria.",
  })
  findAll(
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("sport") sport?: string,
    @Query("collection") collection?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number
  ) {
    return this.productsService.findAll({ q, categoryId, sport, collection, page });
  }

  @Get("recommendations")
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Sugestões: se gostou de X, pode gostar de Y (carrinho/compras ou destaque)",
  })
  recommendations(@CurrentUser() user?: JwtPayload) {
    return this.productsService.recommendations(user?.sub);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalhe do produto" })
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cadastrar produto" })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.sub, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Desativar produto" })
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
