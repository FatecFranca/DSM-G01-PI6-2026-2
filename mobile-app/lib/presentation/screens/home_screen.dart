import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import 'cart_screen.dart';
import 'login_screen.dart';
import 'product_detail_screen.dart';
import 'my_orders_screen.dart'; // Importe a tela de histórico de pedidos

// Modelo de Produto interno
class Product {
  final String id;
  final String name;
  final String? description;
  final String? brand;
  final double price;
  final String? imageUrl;
  final String? sport;
  final int stock;
  final String? size;
  final String? color;

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
      name: json['name']?.toString() ?? json['title']?.toString() ?? 'Produto sem nome',
      description: json['description']?.toString(),
      brand: json['brand']?.toString(),
      price: json['price'] != null ? (double.tryParse(json['price'].toString()) ?? 0.0) : 0.0,
      imageUrl: json['imageUrl']?.toString() ?? json['image']?.toString() ?? json['url']?.toString(),
      sport: json['sport']?.toString(),
      stock: json['stock'] != null ? (int.tryParse(json['stock'].toString()) ?? 0) : 0,
      size: json['size']?.toString(),
      color: json['color']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'brand': brand,
      'price': price,
      'imageUrl': imageUrl,
      'sport': sport,
      'stock': stock,
      'size': size,
      'color': color,
    };
  }
}

class CategoryItem {
  final String slug;
  final String label;
  final List<CategoryItem>? children;

  const CategoryItem({required this.slug, required this.label, this.children});
}

const List<CategoryItem> kCategoryMenu = [
  CategoryItem(
    slug: 'camisetas',
    label: 'Camisetas',
    children: [
      CategoryItem(slug: 'camisetas-adulto', label: 'Adulto'),
      CategoryItem(slug: 'camisetas-infantil', label: 'Infantil'),
    ],
  ),
  CategoryItem(slug: 'tops-sutias', label: 'Tops e Sutiãs'),
  CategoryItem(slug: 'calcas', label: 'Calças'),
  CategoryItem(slug: 'shorts', label: 'Shorts e Bermudas'),
  CategoryItem(slug: 'moletons', label: 'Moletons / Blusas de Frio'),
  CategoryItem(slug: 'artigos-esportivos', label: 'Artigos Esportivos'),
  CategoryItem(
    slug: 'tenis',
    label: 'Tênis',
    children: [
      CategoryItem(slug: 'tenis-masculino', label: 'Masculino'),
      CategoryItem(slug: 'tenis-feminino', label: 'Feminino'),
    ],
  ),
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiClient _apiClient = ApiClient();
  List<Product> _products = [];
  int _cartItemCount = 0;
  bool _isLoading = true;
  String _searchQuery = '';
  String? _selectedCollection;
  String _selectedCategoryLabel = 'Ver todo o catálogo';

  int _currentPage = 1;
  final int _limit = 30;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final dynamic productsRes = await _apiClient.getProducts(
        page: _currentPage,
        limit: _limit,
        collection: _selectedCollection,
        search: _searchQuery,
      );

      int count = 0;
      try {
        final dynamic cartData = await _apiClient.getCart();
        if (cartData is Map) {
          count = cartData['itemCount'] ?? 0;
        }
      } catch (_) {}

      List<Product> parsedProducts = [];
      int calculatedPages = 1;

      if (productsRes is Map) {
        final rawData = productsRes['data'] ?? productsRes['items'] ?? productsRes['products'];
        if (rawData is List) {
          for (var item in rawData) {
            if (item is Map<String, dynamic>) {
              try {
                parsedProducts.add(Product.fromJson(item));
              } catch (e) {
                debugPrint('Erro ao desserializar produto: $e');
              }
            }
          }
        }
        calculatedPages = (productsRes['totalPages'] as num?)?.toInt() ??
                      (productsRes['pageCount'] as num?)?.toInt() ?? 1;
      } else if (productsRes is List) {
        for (var item in productsRes) {
          if (item is Map<String, dynamic>) {
            try {
              parsedProducts.add(Product.fromJson(item));
            } catch (e) {
              debugPrint('Erro ao desserializar produto: $e');
            }
          }
        }
        calculatedPages = 1;
      }

      setState(() {
        _products = parsedProducts;
        _totalPages = calculatedPages;
        _cartItemCount = count;
        _isLoading = false;
      });
    } catch (e, stack) {
      debugPrint('Erro na busca de produtos: $e');
      debugPrint('Stacktrace: $stack');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _logout() {
    ApiClient.authToken = null;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  void _selectCategory(String? slug, String label) {
    setState(() {
      _selectedCollection = slug;
      _selectedCategoryLabel = label;
      _currentPage = 1;
    });
    Navigator.pop(context);
    _fetchData();
  }

  void _clearCategoryFilter() {
    setState(() {
      _selectedCollection = null;
      _selectedCategoryLabel = 'Ver todo o catálogo';
      _currentPage = 1;
    });
    _fetchData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text(
          'SportArena',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1F2937),
        foregroundColor: Colors.white,
        actions: [
          // Botão "Você comprou" na barra superior
          TextButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MyOrdersScreen()),
              );
            },
            icon: const Icon(Icons.inventory_2_outlined, color: Color(0xFF10B981), size: 18),
            label: const Text(
              'Você comprou',
              style: TextStyle(
                color: Color(0xFF10B981),
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart),
                tooltip: 'Carrinho',
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const CartScreen()),
                  ).then((_) => _fetchData());
                },
              ),
              if (_cartItemCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '$_cartItemCount',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sair',
            onPressed: _logout,
          ),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(16, 40, 16, 16),
              width: double.infinity,
              color: const Color(0xFF10B981),
              child: const Text(
                'CATEGORIAS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.grid_view, color: Color(0xFF10B981)),
              title: const Text('Ver todo o catálogo', style: TextStyle(fontWeight: FontWeight.bold)),
              selected: _selectedCollection == null,
              onTap: () => _selectCategory(null, 'Ver todo o catálogo'),
            ),
            const Divider(),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: kCategoryMenu.map((cat) {
                  if (cat.children != null && cat.children!.isNotEmpty) {
                    return ExpansionTile(
                      title: Text(cat.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                      children: [
                        ListTile(
                          title: Text('Todas em ${cat.label}'),
                          contentPadding: const EdgeInsets.only(left: 32),
                          onTap: () => _selectCategory(cat.slug, cat.label),
                        ),
                        ...cat.children!.map(
                          (child) => ListTile(
                            title: Text(child.label),
                            contentPadding: const EdgeInsets.only(left: 32),
                            onTap: () => _selectCategory(child.slug, '${cat.label} · ${child.label}'),
                          ),
                        ),
                      ],
                    );
                  }
                  return ListTile(
                    title: Text(cat.label, style: const TextStyle(fontWeight: FontWeight.w600)),
                    onTap: () => _selectCategory(cat.slug, cat.label),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_selectedCollection != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Chip(
                      label: Text(_selectedCategoryLabel),
                      deleteIcon: const Icon(Icons.close, size: 16),
                      onDeleted: _clearCategoryFilter,
                      backgroundColor: const Color(0xFFE5E7EB),
                    ),
                  ),
                TextField(
                  onChanged: (val) {
                    setState(() => _searchQuery = val);
                    _currentPage = 1;
                    _fetchData();
                  },
                  decoration: InputDecoration(
                    hintText: 'Buscar por nome, marca ou esporte...',
                    prefixIcon: const Icon(Icons.search, color: Colors.grey),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                : _products.isEmpty
                    ? const Center(
                        child: Text(
                          'Nenhum produto encontrado.',
                          style: TextStyle(color: Colors.grey, fontSize: 16),
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.72,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                        itemCount: _products.length,
                        itemBuilder: (context, index) {
                          final product = _products[index];
                          return InkWell(
                            onTap: () {
                              dynamic targetProduct = product.toJson();
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ProductDetailScreen(product: targetProduct),
                                ),
                              ).then((_) => _fetchData());
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Container(
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade100,
                                        borderRadius: const BorderRadius.vertical(
                                          top: Radius.circular(12),
                                        ),
                                      ),
                                      child: product.imageUrl != null && product.imageUrl!.isNotEmpty
                                          ? ClipRRect(
                                              borderRadius: const BorderRadius.vertical(
                                                top: Radius.circular(12),
                                              ),
                                              child: Image.network(
                                                product.imageUrl!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) =>
                                                    const Center(child: Icon(Icons.shopping_bag, size: 40, color: Colors.grey)),
                                              ),
                                            )
                                          : const Center(
                                              child: Icon(Icons.shopping_bag, size: 40, color: Colors.grey),
                                            ),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          product.brand ?? '',
                                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          product.name,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'R\$ ${product.price.toStringAsFixed(2)}',
                                          style: const TextStyle(
                                            color: Color(0xFF10B981),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          if (_totalPages > 1)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    offset: const Offset(0, -2),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ElevatedButton.icon(
                    onPressed: _currentPage > 1
                        ? () {
                            setState(() => _currentPage--);
                            _fetchData();
                          }
                        : null,
                    icon: const Icon(Icons.arrow_back, size: 16),
                    label: const Text('Anterior'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                    ),
                  ),
                  Text(
                    'Página $_currentPage de $_totalPages',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  ElevatedButton.icon(
                    onPressed: _currentPage < _totalPages
                        ? () {
                            setState(() => _currentPage++);
                            _fetchData();
                          }
                        : null,
                    icon: const Icon(Icons.arrow_forward, size: 16),
                    label: const Text('Próxima'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade300,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}