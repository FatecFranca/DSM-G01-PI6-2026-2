import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              brand: true,
              sport: true,
              price: true,
              categoryId: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const baskets = orders
    .map((o) => ({
      orderId: o.id,
      userId: o.userId,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({
        productId: i.productId,
        slug: i.product.slug,
        name: i.product.name,
        brand: i.product.brand,
        sport: i.product.sport,
        category: i.product.category?.name ?? null,
        categoryId: i.product.categoryId,
        price: Number(i.unitPrice),
        quantity: i.quantity,
      })),
    }))
    .filter((b) => b.items.length >= 2);

  const out = resolve(__dirname, "data", "baskets.json");
  writeFileSync(out, JSON.stringify(baskets, null, 2) + "\n", "utf-8");
  console.log(`Exportadas ${baskets.length} cestas → ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
