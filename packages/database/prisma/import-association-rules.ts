import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type RuleRow = {
  source_slug: string;
  target_slug: string;
  score: number;
  relation_type?: string;
};

async function main() {
  const path = resolve(__dirname, "data", "association_rules.json");
  const rules = JSON.parse(readFileSync(path, "utf-8")) as RuleRow[];

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, slug: true },
  });
  const slugToId = new Map(products.map((p) => [p.slug, p.id]));

  await prisma.productRelation.deleteMany({
    where: { relationType: "ALSO_BOUGHT" },
  });

  let inserted = 0;
  const chunk: {
    sourceProductId: string;
    targetProductId: string;
    relationType: "ALSO_BOUGHT";
    score: number;
  }[] = [];

  for (const r of rules) {
    const sourceProductId = slugToId.get(r.source_slug);
    const targetProductId = slugToId.get(r.target_slug);
    if (!sourceProductId || !targetProductId || sourceProductId === targetProductId) {
      continue;
    }
    chunk.push({
      sourceProductId,
      targetProductId,
      relationType: "ALSO_BOUGHT",
      score: Number(r.score) || 0,
    });
  }

  // dedupe by unique key keeping max score
  const best = new Map<string, (typeof chunk)[number]>();
  for (const row of chunk) {
    const key = `${row.sourceProductId}|${row.targetProductId}`;
    const prev = best.get(key);
    if (!prev || prev.score < row.score) best.set(key, row);
  }
  const rows = [...best.values()];

  const size = 200;
  for (let i = 0; i < rows.length; i += size) {
    const part = rows.slice(i, i + size);
    const result = await prisma.productRelation.createMany({
      data: part,
      skipDuplicates: true,
    });
    inserted += result.count;
  }

  console.log(
    `ProductRelation ALSO_BOUGHT: ${inserted} inseridos (${rows.length} únicos de ${rules.length} regras)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
