"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CategoryDto, CreateProductDto, ProductDto } from "@sportarena/types";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function AdminProductsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    description: "",
    brand: "",
    price: "",
    size: "",
    color: "",
    sport: "",
    stock: "10",
    categoryId: "",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<CategoryDto[]>("/categories"),
  });

  const create = useMutation({
    mutationFn: (dto: CreateProductDto) =>
      apiFetch<ProductDto>("/products", {
        method: "POST",
        token: accessToken!,
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOk("Produto cadastrado!");
      setError("");
      setForm({
        name: "",
        description: "",
        brand: "",
        price: "",
        size: "",
        color: "",
        sport: "",
        stock: "10",
        categoryId: "",
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price.replace(",", "."));
    if (!form.name || !form.description || !form.brand || !price) {
      setError("Preencha os campos obrigatórios");
      return;
    }
    create.mutate({
      name: form.name,
      description: form.description,
      brand: form.brand,
      price,
      size: form.size || undefined,
      color: form.color || undefined,
      sport: form.sport || undefined,
      stock: parseInt(form.stock, 10) || 0,
      categoryId: form.categoryId || undefined,
    });
  }

  if (!accessToken) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Cadastrar produto</h1>
        <p className="text-muted mb-6">
          Registre artigos esportivos com preço, tamanho e demais especificações.
        </p>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Descrição *"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Marca *"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
              <Input
                label="Preço (R$) *"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                label="Tamanho"
                placeholder="M, 42, 5kg..."
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
              <Input
                label="Cor"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
              <Input
                label="Esporte"
                placeholder="Futebol, Corrida..."
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
              />
              <Input
                label="Estoque"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Categoria</label>
              <select
                className="w-full h-11 px-4 rounded-xl border border-border bg-white"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            {ok && (
              <p className="text-sm text-brand-700 bg-brand-50 px-3 py-2 rounded-lg">{ok}</p>
            )}
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Salvando..." : "Salvar produto"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
