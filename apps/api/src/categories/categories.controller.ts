import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { mapCategory } from "../common/mappers";

@ApiTags("categories")
@Controller("categories")
export class CategoriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Listar categorias" })
  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories.map(mapCategory);
  }
}
