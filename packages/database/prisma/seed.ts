import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type CategorySeed = { name: string; slug: string; icon: string };

type ProductSeed = {
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  compareAt: number | null;
  size: string | null;
  color: string | null;
  sport: string | null;
  stock: number;
  imageUrl: string | null;
  category: string | null;
  active: boolean;
};

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, "data", file), "utf-8"));
}

async function main() {
  const categories = readJson<CategorySeed[]>("categories.json");
  const products = readJson<ProductSeed[]>("products.json");

  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "demo@sportarena.app" },
    update: {},
    create: {
      name: "Admin Demo",
      email: "demo@sportarena.app",
      phone: "5511888888888",
      passwordHash,
      role: "ADMIN",
    },
  });

  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: { name: c.name, slug: c.slug, icon: c.icon },
    });
    categoryIds[c.name] = cat.id;
  }

  const unknownCategories = new Set(
    products
      .map((p) => p.category)
      .filter((c): c is string => Boolean(c) && !categoryIds[c!])
  );
  if (unknownCategories.size > 0) {
    throw new Error(
      `Categorias usadas em products.json mas ausentes em categories.json: ${[...unknownCategories].join(", ")}`
    );
  }

  for (const p of products) {
    const data = {
      name: p.name,
      description: p.description,
      brand: p.brand,
      price: p.price,
      compareAt: p.compareAt,
      size: p.size,
      color: p.color,
      sport: p.sport,
      stock: p.stock,
      imageUrl: p.imageUrl,
      active: p.active,
      categoryId: p.category ? categoryIds[p.category] : null,
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { ...data, slug: p.slug, sellerId: admin.id },
    });
  }

  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log(
    `Seed concluído: ${categories.length} categorias, ${products.length} produtos`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
