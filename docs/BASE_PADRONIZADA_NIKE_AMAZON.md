# Base padronizada — Nike + Amazon Sports → SportArena

Este documento define como unificar o **Nike Global Catalogue 2026** e o **Amazon Sports & Outdoors** em um catálogo único para alimentar o SportArena.

## Fontes

| Fonte | Papel no projeto | Volume aproximado |
|-------|------------------|-------------------|
| [Nike Global Catalogue 2026](https://www.kaggle.com/datasets/bsthere/nike-global-catalogue-2026) | Catálogo rico (nome, preço, esporte, tamanho, imagem, estoque) | ~1,4M linhas (SKU/tamanho × país) |
| [Amazon Sports & Outdoors 2023](https://huggingface.co/datasets/smartcat/Amazon_Sports_and_Outdoors_2023) | Catálogo multi-marca + atributos (cor, material, sport_type) | ~535k produtos |
| [Amazon Sports & Outdoors 2014](https://huggingface.co/datasets/milistu/Amazon_Sports_and_Outdoors_2014) / [SNAP](https://snap.stanford.edu/data/amazon/productGraph/) | Relações `also_bought` / `bought_together` para recomendações | metadados + grafo de co-compra |

**Estratégia:** Nike = qualidade de catálogo esportivo; Amazon = variedade de marcas + sinais de “comprou X → gosta de Y”.

---

## 1. Mapeamento de campos

### 1.1 Nike → padrão SportArena

| Campo Nike | Campo padronizado | Transformação |
|------------|-------------------|---------------|
| `product_id` / `model_number` | `external_id` | Prefixo `nike:` |
| `product_name` | `name` | trim |
| — | `brand` | fixo `"Nike"` |
| `category` | `category_raw` | mapear para Category SportArena |
| `subcategory` | `sport` | Running, Football, Training… |
| `price_local` | `price` | converter BRL (país BR) ou USD→BRL |
| `sale_price_local` | `compare_at` | preço cheio quando em promoção |
| `size_label` | `size` | agregar tamanhos por produto |
| `gender_segment` | `gender` | Men / Women / Kids / Unisex |
| `image_url` | `image_url` | URL primária |
| `product_url` | `source_url` | link original |
| `available` | `stock` | true → estoque padrão (ex.: 20); false → 0 |
| — | `source` | `"nike"` |
| — | `description` | montar a partir de name + category + sport |

### 1.2 Amazon Sports → padrão SportArena

| Campo Amazon | Campo padronizado | Transformação |
|--------------|-------------------|---------------|
| `parent_asin` / `asin` | `external_id` | Prefixo `amazon:` |
| `title` | `name` | limpar sufixos de embalagem |
| `brand` / `brand_name` / `store` | `brand` | prioridade: brand → brand_name → store |
| `description` + `features` | `description` | concatenar texto |
| `price` | `price` | USD → BRL (taxa fixa ou API) |
| `color` | `color` | normalizar |
| `size` | `size` | normalizar |
| `sport_type` | `sport` | mapear para lista canônica |
| `categories` / `main_category` / `department` | `category_raw` | mapear para Category SportArena |
| `images[0].large` / `hi_res` | `image_url` | primeira imagem válida |
| `average_rating` | `rating_avg` | opcional |
| `rating_number` | `rating_count` | opcional |
| `also_bought` / `bought_together` | tabela `product_relations` | recomendação |
| — | `source` | `"amazon"` |
| — | `stock` | padrão (ex.: 15) se ausente |

---

## 2. Categorias canônicas (SportArena)

| slug | name | ícone | Origens típicas |
|------|------|-------|-----------------|
| `calcados` | Calçados | 👟 | Nike Shoes, Footwear, Running shoes |
| `camisetas` | Camisetas | 👕 | Apparel / Tops / Jerseys |
| `bolas` | Bolas | ⚽ | Balls, Soccer Ball |
| `acessorios` | Acessórios | 🎒 | Bags, Bottles, Caps |
| `equipamentos` | Equipamentos | 🏋️ | Fitness Equipment, Weights |
| `shorts` | Shorts / Calças | 🩳 | Shorts, Pants, Tights |
| `jaquetas` | Jaquetas | 🧥 | Jackets, Hoodies |

Esportes canônicos (`sport`): `Corrida`, `Futebol`, `Basquete`, `Treino`, `Musculação`, `Natação`, `Ciclismo`, `Tênis`, `Outdoor`, `Geral`.

---

## 3. Schema padronizado (tabelas)

### 3.1 `catalog_products` (catálogo unificado)

Tabela intermediária / staging antes de popular `Product` no Prisma.

| Coluna | Tipo | Obrigatório | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | sim | PK interna |
| `external_id` | VARCHAR | sim | `nike:XXXX` ou `amazon:B0XXXX` (UNIQUE) |
| `source` | ENUM | sim | `nike` \| `amazon` |
| `name` | VARCHAR(255) | sim | Nome do produto |
| `slug` | VARCHAR(255) | sim | slug único |
| `description` | TEXT | sim | Descrição unificada |
| `brand` | VARCHAR(120) | sim | Marca |
| `price` | DECIMAL(12,2) | sim | Preço em BRL |
| `compare_at` | DECIMAL(12,2) | não | Preço riscado / original |
| `currency_original` | CHAR(3) | não | USD, BRL, EUR… |
| `price_original` | DECIMAL(12,2) | não | Preço na moeda de origem |
| `size` | VARCHAR(64) | não | Tamanho principal ou lista |
| `color` | VARCHAR(64) | não | Cor |
| `sport` | VARCHAR(64) | não | Esporte canônico |
| `gender` | VARCHAR(32) | não | Men / Women / Kids / Unisex |
| `category_slug` | VARCHAR(64) | não | FK lógica → Category |
| `stock` | INT | sim | Estoque estimado |
| `image_url` | TEXT | não | Imagem principal |
| `source_url` | TEXT | não | URL de origem |
| `rating_avg` | DECIMAL(3,2) | não | Nota média (Amazon) |
| `rating_count` | INT | não | Nº de avaliações |
| `active` | BOOLEAN | sim | default true |
| `raw_payload` | JSONB | não | registro original (auditoria) |
| `created_at` | TIMESTAMP | sim | |
| `updated_at` | TIMESTAMP | sim | |

**Índices:** `external_id` UNIQUE, `source`, `brand`, `sport`, `category_slug`, `name`.

### 3.2 `product_relations` (recomendação “comprou X → Y”)

Principalmente da Amazon (`also_bought` / `bought_together`).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `source_external_id` | VARCHAR | produto origem (`amazon:…`) |
| `target_external_id` | VARCHAR | produto sugerido |
| `relation_type` | ENUM | `also_bought` \| `bought_together` \| `also_viewed` |
| `score` | FLOAT | força da relação (1.0 default; ou lift) |
| `source` | ENUM | `amazon` \| `derived` |

### 3.3 Mapeamento para o Prisma atual (`Product`)

| `catalog_products` | `Product` (Prisma) |
|--------------------|--------------------|
| `id` | `id` |
| `name` | `name` |
| `slug` | `slug` |
| `description` | `description` |
| `brand` | `brand` |
| `price` | `price` |
| `compare_at` | `compareAt` |
| `size` | `size` |
| `color` | `color` |
| `sport` | `sport` |
| `stock` | `stock` |
| `image_url` | `imageUrl` |
| `category_slug` → Category.id | `categoryId` |
| `active` | `active` |

Campos extras (`source`, `external_id`, `rating_*`, `gender`) podem ir para colunas novas no Prisma ou ficar só no staging.

---

## 4. Como fica a base padronizada (exemplos)

### 4.1 Linhas de `catalog_products`

| external_id | source | name | brand | price (BRL) | compare_at | size | color | sport | category_slug | stock | image_url |
|-------------|--------|------|-------|-------------|------------|------|-------|-------|---------------|-------|-----------|
| `nike:DZ5485-010` | nike | Nike Pegasus 41 | Nike | 799.90 | 899.90 | 42 | Black/White | Corrida | calcados | 20 | https://…/pegasus.jpg |
| `nike:DV0650-010` | nike | Nike Dri-FIT Legend Tee | Nike | 129.90 | null | M | Black | Treino | camisetas | 35 | https://…/legend.jpg |
| `amazon:B07XJ8C8F5` | amazon | Under Armour Charged Assert 9 | Under Armour | 449.00 | null | 41 | Grey | Corrida | calcados | 15 | https://…/assert.jpg |
| `amazon:B08N5WRWNW` | amazon | Adidas Soccer Ball League | Adidas | 189.90 | 219.90 | 5 | White/Black | Futebol | bolas | 40 | https://…/ball.jpg |
| `amazon:B09ABCDEF12` | amazon | Hydro Flask 32oz | Hydro Flask | 279.00 | null | 750ml | Blue | Geral | acessorios | 25 | https://…/bottle.jpg |
| `nike:DQ8562-100` | nike | Nike Brasilia Training Duffel | Nike | 249.90 | null | M | Black | Treino | acessorios | 18 | https://…/duffel.jpg |

### 4.2 Linhas de `product_relations` (recomendação)

| source_external_id | target_external_id | relation_type | score |
|--------------------|--------------------|---------------|-------|
| `amazon:B07XJ8C8F5` | `amazon:B08SOCK001` | also_bought | 1.0 |
| `amazon:B07XJ8C8F5` | `amazon:B09BOTTLE2` | also_bought | 0.85 |
| `amazon:B08N5WRWNW` | `amazon:B07SHINPAD` | bought_together | 1.0 |
| `nike:DZ5485-010` | `nike:DV0650-010` | derived | 0.70 |

> Relações Nike podem ser **derivadas** (mesmo sport + category coocorrente em pedidos reais do SportArena, depois do go-live).

### 4.3 Registro JSON padronizado (1 produto)

```json
{
  "external_id": "amazon:B07XJ8C8F5",
  "source": "amazon",
  "name": "Under Armour Charged Assert 9",
  "slug": "under-armour-charged-assert-9",
  "description": "Tênis de corrida leve com amortecimento Charged Cushioning.\nIdeal para treinos diários.",
  "brand": "Under Armour",
  "price": 449.00,
  "compare_at": null,
  "currency_original": "USD",
  "price_original": 79.99,
  "size": "41",
  "color": "Grey",
  "sport": "Corrida",
  "gender": "Men",
  "category_slug": "calcados",
  "stock": 15,
  "image_url": "https://m.media-amazon.com/images/I/example.jpg",
  "source_url": "https://www.amazon.com/dp/B07XJ8C8F5",
  "rating_avg": 4.5,
  "rating_count": 12840,
  "active": true,
  "related": [
    { "external_id": "amazon:B08SOCK001", "type": "also_bought", "score": 1.0 },
    { "external_id": "amazon:B09BOTTLE2", "type": "also_bought", "score": 0.85 }
  ]
}
```

---

## 5. Pipeline de unificação (ETL)

```text
┌─────────────────┐     ┌──────────────────────┐
│ Nike CSV (BR)   │     │ Amazon meta JSON/Parquet │
└────────┬────────┘     └───────────┬──────────┘
         │                          │
         ▼                          ▼
   normalize_nike()          normalize_amazon()
         │                          │
         └──────────┬───────────────┘
                    ▼
           catalog_products
           (dedupe por name+brand+sport)
                    │
                    ▼
         map_category_slug()
         convert_currency_to_BRL()
         slugify()
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   Product (Prisma)    product_relations
                               │
                               ▼
                  GET /products/recommendations
```

### Regras de deduplicação
1. Mesmo `external_id` → upsert  
2. Mesmo `slug` gerado → manter o de melhor imagem/rating  
3. Nike e Amazon com nomes muito parecidos → **não fundir** (marcas/canais diferentes); manter os dois com `source` distinto  

### Filtros sugeridos (para o protótipo)
- Nike: país `BR` (ou `US` se preferir USD) + `available = true`  
- Amazon: `price > 0`, tem `image`, `sport_type` ou categoria esportiva, top N por `rating_number`  
- Limite inicial: **200–500 produtos** no seed (não importar 500k de uma vez)

---

## 6. Extensão sugerida no Prisma

```prisma
model Product {
  // ... campos atuais ...
  externalId  String?  @unique
  source      String?  // "nike" | "amazon" | "manual"
  gender      String?
  ratingAvg   Decimal? @db.Decimal(3, 2)
  ratingCount Int?
  sourceUrl   String?

  relatedFrom ProductRelation[] @relation("RelationSource")
  relatedTo   ProductRelation[] @relation("RelationTarget")
}

model ProductRelation {
  id             String @id @default(uuid())
  sourceProductId String
  targetProductId String
  relationType   String // also_bought | bought_together | derived
  score          Float  @default(1)

  sourceProduct Product @relation("RelationSource", fields: [sourceProductId], references: [id], onDelete: Cascade)
  targetProduct Product @relation("RelationTarget", fields: [targetProductId], references: [id], onDelete: Cascade)

  @@unique([sourceProductId, targetProductId, relationType])
  @@index([sourceProductId])
}
```

---

## 7. Resumo

| Pergunta | Resposta |
|----------|----------|
| O que unificar? | Nike (catálogo) + Amazon Sports (catálogo + co-compra) |
| Formato final? | `catalog_products` + `product_relations` → `Product` + `ProductRelation` |
| Moeda? | BRL no SportArena (`price` / `compareAt`) |
| Categorias? | 7 slugs canônicos do SportArena |
| Recomendação? | Amazon `also_bought` / `bought_together` na tabela de relações |
| Volume no seed? | Começar com amostra filtrada (centenas), não o dataset inteiro |

---

## Fontes adicionais recomendadas (catálogo + imagens de produto)

| Base | Link | O que oferece |
|------|------|----------------|
| Nike Global Catalogue 2026 | https://www.kaggle.com/datasets/bsthere/nike-global-catalogue-2026 | Catálogo Nike com `image_url` de produto |
| Adidas Fashion Retail (9k+) | https://www.kaggle.com/datasets/thedevastator/adidas-fashion-retail-products-dataset-9300-prod | Nome, preço, cor, categoria e **links de imagens** Adidas |
| Nike US Product + Images | https://crawlfeeds.com/datasets/nike-us-product-data-and-image-collection | ~9k produtos Nike com imagens hero/carousel |
| Decathlon (ES) | https://doi.org/10.5281/zenodo.19416543 | Catálogo Decathlon (nome, preço, marca, categoria) |
| Amazon Sports & Outdoors | https://huggingface.co/datasets/smartcat/Amazon_Sports_and_Outdoors_2023 | Multi-marca + imagens |
| Nike/Adidas shoes (classificação) | https://www.kaggle.com/datasets/ifeanyinneji/nike-adidas-shoes-for-image-classification-dataset | Fotos de calçados isolados |

**Critério de imagem no SportArena:** preferir foto do **objeto** (bola, tênis, garrafa), não cena de pessoas praticando o esporte.
