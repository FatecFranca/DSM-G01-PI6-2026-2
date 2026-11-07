import 'dart:async';
import 'package:flutter/material.dart';
import '../../core/constants/app_styles.dart';
import '../../core/network/api_client.dart';
import 'my_orders_screen.dart';
import 'product_detail_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _cartItems = [];
  List<dynamic> _recommendations = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  double _total = 0.0;
  
  final PageController _carouselController = PageController();
  int _currentCarouselPage = 0;
  Timer? _carouselTimer;

  @override
  void initState() {
    super.initState();
    _fetchCartAndRecommendations();
  }

  @override
  void dispose() {
    _carouselTimer?.cancel();
    _carouselController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _carouselTimer?.cancel();
    if (_recommendations.isEmpty) return;

    _carouselTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!mounted) return;
      int totalPages = (_recommendations.length / 2).ceil();
      if (totalPages <= 1) return;

      int nextPage = _currentCarouselPage + 1;
      if (nextPage >= totalPages) {
        nextPage = 0;
      }

      if (_carouselController.hasClients) {
        _carouselController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _fetchCartAndRecommendations() async {
    setState(() => _isLoading = true);
    try {
      final dynamic res = await _apiClient.getCart();

      List<dynamic> items = [];
      double calculatedTotal = 0.0;

      if (res is Map) {
        if (res['items'] is List) {
          items = res['items'];
        }
        calculatedTotal = (res['total'] as num?)?.toDouble() ??
            (res['totalAmount'] as num?)?.toDouble() ??
            0.0;
      } else if (res is List) {
        items = res;
      }

      if (calculatedTotal == 0.0 && items.isNotEmpty) {
        for (var item in items) {
          final product = item['product'] ?? item;
          final double price = (product['price'] as num?)?.toDouble() ??
              (item['price'] as num?)?.toDouble() ??
              0.0;
          final int quantity = (item['quantity'] as num?)?.toInt() ?? 1;
          calculatedTotal += price * quantity;
        }
      }

      List<dynamic> recList = [];
      try {
        final dynamic recRes = await _apiClient.getRecommendations();
        if (recRes is Map && recRes['products'] is List) {
          recList = recRes['products'];
        } else if (recRes is List) {
          recList = recRes;
        }
      } catch (_) {}

      setState(() {
        _cartItems = items;
        _total = calculatedTotal;
        _recommendations = recList;
        _isLoading = false;
      });

      if (recList.isNotEmpty) {
        _startAutoScroll();
      }
    } catch (e) {
      setState(() {
        _cartItems = [];
        _total = 0.0;
        _recommendations = [];
        _isLoading = false;
      });
    }
  }

  Future<void> _updateQuantity(String itemId, int newQuantity) async {
    if (newQuantity <= 0) {
      await _removeItem(itemId);
      return;
    }

    try {
      await _apiClient.dio.patch('/cart/items/$itemId', data: {
        'quantity': newQuantity,
      });
      _fetchCartAndRecommendations();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao atualizar quantidade: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _removeItem(String itemId) async {
    try {
      await _apiClient.dio.delete('/cart/items/$itemId');
      _fetchCartAndRecommendations();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao remover item: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _addRecommendedToCart(dynamic product) async {
    try {
      final String productId = product['id']?.toString() ?? '';
      if (productId.isEmpty) return;

      await _apiClient.dio.post('/cart/items', data: {
        'productId': productId,
        'quantity': 1,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Produto adicionado ao carrinho!'),
          backgroundColor: AppColors.primary,
          duration: Duration(seconds: 1),
        ),
      );

      _fetchCartAndRecommendations();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao adicionar produto: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _checkout() async {
    if (_cartItems.isEmpty || _isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      try {
        await _apiClient.dio.post('/orders/checkout');
      } catch (_) {
        await _apiClient.dio.post('/orders');
      }

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pedido efetuado e publicado no Pub/Sub com sucesso!'),
          backgroundColor: AppColors.primary,
        ),
      );

      _fetchCartAndRecommendations();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao finalizar pedido: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meu Carrinho'),
        actions: [
          TextButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MyOrdersScreen()),
              );
            },
            icon: const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 18),
            label: const Text(
              'Você comprou',
              style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _cartItems.isEmpty
              ? const Center(
                  child: Text(
                    'Seu carrinho está vazio.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 16),
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _cartItems.length,
                        itemBuilder: (context, index) {
                          final item = _cartItems[index];
                          final product = item['product'] ?? item;

                          final String itemId = item['id']?.toString() ?? '';
                          final String name = product['name']?.toString() ?? item['name']?.toString() ?? 'Produto';
                          final double price = (product['price'] as num?)?.toDouble() ?? (item['price'] as num?)?.toDouble() ?? 0.0;
                          final int quantity = (item['quantity'] as num?)?.toInt() ?? 1;

                          final String? size = item['size']?.toString() ?? product['size']?.toString();
                          final String? color = item['color']?.toString() ?? product['color']?.toString();
                          final String? imageUrl = product['imageUrl']?.toString() ?? product['image']?.toString() ?? item['imageUrl']?.toString() ?? item['image']?.toString();

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: AppStyles.cardDecoration,
                            child: Row(
                              children: [
                                Container(
                                  width: 70,
                                  height: 70,
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: imageUrl != null && imageUrl.isNotEmpty
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: Image.network(
                                            imageUrl,
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => const Icon(Icons.shopping_bag, size: 32, color: AppColors.textMuted),
                                          ),
                                        )
                                      : const Icon(Icons.shopping_bag, size: 32, color: AppColors.textMuted),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: AppStyles.titleStyle,
                                      ),
                                      if ((size != null && size.isNotEmpty) || (color != null && color.isNotEmpty)) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          [
                                            if (size != null && size.isNotEmpty) 'Tamanho: $size',
                                            if (color != null && color.isNotEmpty) 'Cor: $color',
                                          ].join(' • '),
                                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                                        ),
                                      ],
                                      const SizedBox(height: 4),
                                      Text(
                                        'R\$ ${(price * quantity).toStringAsFixed(2)}',
                                        style: AppStyles.priceStyle,
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          InkWell(
                                            onTap: () => _updateQuantity(itemId, quantity - 1),
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: BoxDecoration(
                                                border: Border.all(color: AppColors.borderLight),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Icon(Icons.remove, size: 16),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 12),
                                            child: Text('$quantity', style: AppStyles.titleStyle),
                                          ),
                                          InkWell(
                                            onTap: () => _updateQuantity(itemId, quantity + 1),
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: BoxDecoration(
                                                border: Border.all(color: AppColors.borderLight),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Icon(Icons.add, size: 16),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                                  onPressed: () => _removeItem(itemId),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    if (_recommendations.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        color: Colors.white,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                              child: Text(
                                'Quem comprou, também levou',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textMain),
                              ),
                            ),
                            SizedBox(
                              height: 150,
                              child: NotificationListener<ScrollNotification>(
                                onNotification: (notification) {
                                  if (notification is UserScrollNotification) {
                                    _startAutoScroll();
                                  }
                                  return false;
                                },
                                child: PageView.builder(
                                  controller: _carouselController,
                                  itemCount: (_recommendations.length / 2).ceil(),
                                  onPageChanged: (index) {
                                    setState(() {
                                      _currentCarouselPage = index;
                                    });
                                  },
                                  itemBuilder: (context, pageIndex) {
                                    final int firstIndex = pageIndex * 2;
                                    final int secondIndex = firstIndex + 1;
                                    final prod1 = _recommendations[firstIndex];
                                    final prod2 = secondIndex < _recommendations.length ? _recommendations[secondIndex] : null;

                                    return Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      child: Row(
                                        children: [
                                          Expanded(child: _buildMiniCard(prod1)),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: prod2 != null ? _buildMiniCard(prod2) : const SizedBox.shrink(),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                            if ((_recommendations.length / 2).ceil() > 1) ...[
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: List.generate((_recommendations.length / 2).ceil(), (index) {
                                  return Container(
                                    width: _currentCarouselPage == index ? 16 : 6,
                                    height: 6,
                                    margin: const EdgeInsets.symmetric(horizontal: 2),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(3),
                                      color: _currentCarouselPage == index ? AppColors.primary : Colors.grey.shade300,
                                    ),
                                  );
                                }),
                              ),
                            ],
                          ],
                        ),
                      ),
                    SafeArea(
                      top: false,
                      child: Container(
                        padding: const EdgeInsets.all(16),
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
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('Total a pagar:', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                                Text('R\$ ${_total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textMain)),
                              ],
                            ),
                            ElevatedButton(
                              onPressed: _isSubmitting ? null : _checkout,
                              child: _isSubmitting
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('FINALIZAR', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildMiniCard(dynamic product) {
    final String name = product['name']?.toString() ?? 'Produto';
    final double price = (product['price'] as num?)?.toDouble() ?? 0.0;
    final String? imageUrl = product['imageUrl']?.toString() ?? product['image']?.toString();

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: product),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Center(
                child: imageUrl != null && imageUrl.isNotEmpty
                    ? Image.network(
                        imageUrl,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(Icons.shopping_bag, size: 28, color: AppColors.textMuted),
                      )
                    : const Icon(Icons.shopping_bag, size: 28, color: AppColors.textMuted),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.textMain),
            ),
            const SizedBox(height: 2),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('R\$ ${price.toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11)),
                InkWell(
                  onTap: () => _addRecommendedToCart(product),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                    child: const Icon(Icons.add, size: 12, color: Colors.white),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}