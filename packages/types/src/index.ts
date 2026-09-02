export type Role = "CUSTOMER" | "ADMIN";
export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: number;
  compareAt: number | null;
  size: string | null;
  color: string | null;
  sport: string | null;
  stock: number;
  imageUrl: string | null;
  category?: CategoryDto | null;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  description: string;
  brand: string;
  price: number;
  compareAt?: number;
  size?: string;
  color?: string;
  sport?: string;
  stock?: number;
  imageUrl?: string;
  categoryId?: string;
}

export interface CartItemDto {
  id: string;
  quantity: number;
  product: ProductDto;
}

export interface CartDto {
  id: string;
  items: CartItemDto[];
  total: number;
  itemCount: number;
}

export interface OrderItemDto {
  id: string;
  quantity: number;
  unitPrice: number;
  size: string | null;
  product: ProductDto;
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  total: number;
  items: OrderItemDto[];
  createdAt: string;
}
