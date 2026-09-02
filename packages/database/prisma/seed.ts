import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
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

  const categories = [
    { name: "Calçados", icon: "👟" },
    { name: "Camisetas", icon: "👕" },
    { name: "Bolas", icon: "⚽" },
    { name: "Acessórios", icon: "🎒" },
    { name: "Equipamentos", icon: "🏋️" },
  ];

  const createdCats: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: {},
      create: { name: c.name, slug: slugify(c.name), icon: c.icon },
    });
    createdCats[c.name] = cat.id;
  }

  const products = [
    {
      name: "Tênis Running Pro X",
      description: "Amortecimento responsivo para corrida diária.",
      brand: "ArenaRun",
      price: 399.9,
      compareAt: 499.9,
      size: "42",
      color: "Preto/Verde",
      sport: "Corrida",
      stock: 25,
      category: "Calçados",
    },
    {
      name: "Camisa Futebol Dry-Fit",
      description: "Tecido leve que absorve suor. Ideal para treinos.",
      brand: "KickSport",
      price: 129.9,
      size: "M",
      color: "Verde",
      sport: "Futebol",
      stock: 40,
      category: "Camisetas",
    },
    {
      name: "Bola Oficial Campo",
      description: "Costura térmica, circunferência oficial.",
      brand: "GoalMax",
      price: 189.9,
      size: "5",
      color: "Branco",
      sport: "Futebol",
      stock: 15,
      category: "Bolas",
    },
    {
      name: "Garrafa Térmica 750ml",
      description: "Mantém temperatura por até 12h.",
      brand: "HydroFit",
      price: 79.9,
      color: "Azul",
      sport: "Geral",
      stock: 60,
      category: "Acessórios",
    },
    {
      name: "Halteres 5kg (par)",
      description: "Revestimento emborrachado antiderrapante.",
      brand: "IronGym",
      price: 149.9,
      size: "5kg",
      color: "Preto",
      sport: "Musculação",
      stock: 20,
      category: "Equipamentos",
    },
    {
      name: "Shorts Training Flex",
      description: "Elastano com bolso lateral e cordão.",
      brand: "ArenaRun",
      price: 99.9,
      size: "G",
      color: "Cinza",
      sport: "Treino",
      stock: 35,
      category: "Camisetas",
    },
  ];

  for (const p of products) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        sellerId: admin.id,
        categoryId: createdCats[p.category],
        name: p.name,
        slug,
        description: p.description,
        brand: p.brand,
        price: p.price,
        compareAt: p.compareAt ?? null,
        size: p.size ?? null,
        color: p.color ?? null,
        sport: p.sport,
        stock: p.stock,
        imageUrl: null,
        active: true,
      },
    });
  }

  await prisma.cart.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log("Seed SportArena concluído:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
