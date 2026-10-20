class Product {
  final String id;
  final String name;
  final String? description;
  final String? brand;
  final double price;
  final String? imageUrl;
  final String? sport;
  final int stock;
  final String? size;  // Novo campo adicionado no Prisma
  final String? color; // Novo campo adicionado no Prisma

  Product({
    required this.id,
    required this.name,
    this.description,
    this.brand,
    required this.price,
    this.imageUrl,
    this.sport,
    required this.stock,
    this.size,
    this.color,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Produto sem nome',
      description: json['description']?.toString(),
      brand: json['brand']?.toString(),
      // O Prisma retorna Decimal/Number, tratamos com segurança para double
      price: json['price'] != null ? double.tryParse(json['price'].toString()) ?? 0.0 : 0.0,
      imageUrl: json['imageUrl']?.toString(),
      sport: json['sport']?.toString(),
      stock: json['stock'] != null ? int.tryParse(json['stock'].toString()) ?? 0 : 0,
      size: json['size']?.toString(),
      color: json['color']?.toString(),
    );
  }
}