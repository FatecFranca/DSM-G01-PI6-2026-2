import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

function fix(text: string | null | undefined): string | null | undefined {
  if (text == null) return text;
  return text
    .replace(/Raparigas/g, "Mulheres")
    .replace(/raparigas/g, "mulheres")
    .replace(/RAPARIGAS/g, "MULHERES")
    .replace(/Rapariga/g, "Mulher")
    .replace(/rapariga/g, "mulher")
    .replace(/RAPARIGA/g, "MULHER");
}

async function main() {
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: "rapariga", mode: "insensitive" } },
        { description: { contains: "rapariga", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, description: true },
  });

  let updated = 0;
  for (const r of rows) {
    const name = fix(r.name)!;
    const description = fix(r.description)!;
    if (name !== r.name || description !== r.description) {
      await prisma.product.update({
        where: { id: r.id },
        data: { name, description },
      });
      updated++;
    }
  }

  const jsonPath = resolve(__dirname, "data", "products.json");
  const products = JSON.parse(readFileSync(jsonPath, "utf-8")) as Array<{
    name: string;
    description: string;
    [k: string]: unknown;
  }>;
  let jsonUpdated = 0;
  for (const p of products) {
    const name = fix(p.name)!;
    const description = fix(p.description)!;
    if (name !== p.name || description !== p.description) {
      p.name = name;
      p.description = description;
      jsonUpdated++;
    }
  }
  writeFileSync(jsonPath, JSON.stringify(products, null, 2) + "\n", "utf-8");

  console.log(`DB: ${updated}/${rows.length} produtos atualizados`);
  console.log(`products.json: ${jsonUpdated} registros atualizados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
