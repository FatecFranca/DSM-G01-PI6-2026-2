import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import 'my_orders_screen.dart'; // Importe a nova tela criada acima

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _cartItems = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  double _total = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchCart();
  }

  Future<void> _fetchCart() async {
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

      setState(() {
        _cartItems = items;
        _total = calculatedTotal;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _cartItems = [];
        _total = 0.0;
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
      _fetchCart();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao atualizar quantidade: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _removeItem(String itemId) async {
    try {
      await _apiClient.dio.delete('/cart/items/$itemId');
      _fetchCart();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao remover item: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _checkout() async {
    if (_cartItems.isEmpty || _isSubmitting) return;

    setState(() => _isSubmitting = true);

    try {
      // Tenta rota /orders/checkout ou /orders
      try {
        await _apiClient.dio.post('/orders/checkout');
      } catch (_) {
        await _apiClient.dio.post('/orders');
      }

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pedido efetuado e publicado no Pub/Sub com sucesso!'),
          backgroundColor: Color(0xFF10B981),
        ),
      );

      _fetchCart();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao finalizar pedido: $e'),
          backgroundColor: Colors.red,
        ),
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
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: const Text(
          'Meu Carrinho',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1F2937),
        foregroundColor: Colors.white,
        actions: [
          // Botão estilo "Você comprou" igual ao Web
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
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _cartItems.isEmpty
              ? const Center(
                  child: Text(
                    'Seu carrinho está vazio.',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
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
                          final String name = product['name']?.toString() ??
                              item['name']?.toString() ??
                              'Produto';
                          final double price = (product['price'] as num?)?.toDouble() ??
                              (item['price'] as num?)?.toDouble() ??
                              0.0;
                          final int quantity = (item['quantity'] as num?)?.toInt() ?? 1;

                          final String? size = item['size']?.toString() ?? product['size']?.toString();
                          final String? color = item['color']?.toString() ?? product['color']?.toString();

                          final String? imageUrl = product['imageUrl']?.toString() ??
                              product['image']?.toString() ??
                              item['imageUrl']?.toString() ??
                              item['image']?.toString();

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
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
                                            errorBuilder: (context, error, stackTrace) =>
                                                const Icon(Icons.shopping_bag, size: 32, color: Colors.grey),
                                          ),
                                        )
                                      : const Icon(Icons.shopping_bag, size: 32, color: Colors.grey),
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
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      if ((size != null && size.isNotEmpty) || (color != null && color.isNotEmpty)) ...[
                                        const SizedBox(height: 2),
                                        Text(
                                          [
                                            if (size != null && size.isNotEmpty) 'Tamanho: $size',
                                            if (color != null && color.isNotEmpty) 'Cor: $color',
                                          ].join(' • '),
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.grey.shade600,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                      const SizedBox(height: 4),
                                      Text(
                                        'R\$ ${(price * quantity).toStringAsFixed(2)}',
                                        style: const TextStyle(
                                          color: Color(0xFF10B981),
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          InkWell(
                                            onTap: () => _updateQuantity(itemId, quantity - 1),
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: BoxDecoration(
                                                border: Border.all(color: Colors.grey.shade300),
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: const Icon(Icons.remove, size: 16),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 12),
                                            child: Text(
                                              '$quantity',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                              ),
                                            ),
                                          ),
                                          InkWell(
                                            onTap: () => _updateQuantity(itemId, quantity + 1),
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: BoxDecoration(
                                                border: Border.all(color: Colors.grey.shade300),
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
                                const Text(
                                  'Total a pagar:',
                                  style: TextStyle(color: Colors.grey, fontSize: 12),
                                ),
                                Text(
                                  'R\$ ${_total.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF1F2937),
                                  ),
                                ),
                              ],
                            ),
                            ElevatedButton(
                              onPressed: _isSubmitting ? null : _checkout,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: _isSubmitting
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'FINALIZAR',
                                      style: TextStyle(fontWeight: FontWeight.bold),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }
}