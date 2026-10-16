import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();
const DATA_DIR = resolve(__dirname, "data");

function writeJson(file: string, data: unknown) {
  writeFileSync(resolve(DATA_DIR, file), JSON.stringify(data, null, 2) + "\n", "utf-8");
}

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  mkdirSync(DATA_DIR, { recursive: true });
  writeJson(
    "categories.json",
    categories.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon }))
  );
  writeJson(
    "products.json",
    products.map((p) => ({
      name: p.name,
      brand: p.brand,
      description: p.description,
      price: Number(p.price),
      compareAt: p.compareAt === null ? null : Number(p.compareAt),
      size: p.size,
      color: p.color,
      sport: p.sport,
      stock: p.stock,
      imageUrl: p.imageUrl,
      category: p.category?.name ?? null,
      active: p.active,
      slug: p.slug,
    }))
  );

  console.log(
    `${categories.length} categorias e ${products.length} produtos exportados para ${DATA_DIR}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
