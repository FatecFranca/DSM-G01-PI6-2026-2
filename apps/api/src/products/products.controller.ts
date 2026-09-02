import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/product.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
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
  findAll(
    @Query("q") q?: string,
    @Query("categoryId") categoryId?: string,
    @Query("sport") sport?: string
  ) {
    return this.productsService.findAll(q, categoryId, sport);
  }

  @Get("recommendations")
  @ApiOperation({ summary: "Recomendações (placeholder)" })
  recommendations() {
    return this.productsService.recommendations();
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
