import 'package:flutter/material.dart';
import '../../core/constants/app_styles.dart';
import '../../core/network/api_client.dart';
import 'product_detail_screen.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final dynamic res = await _apiClient.dio.get('/orders');
      List<dynamic> orderList = [];

      if (res.data is List) {
        orderList = res.data;
      } else if (res.data is Map) {
        orderList = res.data['orders'] ?? res.data['data'] ?? [];
      }

      setState(() {
        _orders = orderList;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _orders = [];
        _isLoading = false;
      });
    }
  }

  // Abre modal (zoom/lista) quando o pedido tem múltiplos itens
  void _showOrderItemsModal(BuildContext context, List<dynamic> items, String orderId) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(16),
          constraints: const BoxConstraints(maxHeight: 400),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Itens do Pedido #$orderId',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textMain),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              Expanded(
                child: ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final product = item['product'] ?? item;
                    final String name = product['name']?.toString() ?? 'Produto';
                    final double price = (product['price'] as num?)?.toDouble() ?? 0.0;
                    final String? imageUrl = product['imageUrl']?.toString() ?? product['image']?.toString();
                    final int qty = (item['quantity'] as num?)?.toInt() ?? 1;

                    return ListTile(
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: imageUrl != null && imageUrl.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(imageUrl, fit: BoxFit.cover),
                              )
                            : const Icon(Icons.shopping_bag, color: AppColors.textMuted),
                      ),
                      title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: Text('$qty x R\$ ${price.toStringAsFixed(2)}', style: const TextStyle(color: AppColors.primary, fontSize: 12)),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
                      onTap: () {
                        Navigator.pop(context); // Fecha o modal
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ProductDetailScreen(product: product),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Histórico de Compras'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _orders.isEmpty
              ? const Center(
                  child: Text(
                    'Nenhum pedido encontrado.',
                    style: TextStyle(color: AppColors.textMuted, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _orders.length,
                  itemBuilder: (context, index) {
                    final order = _orders[index];
                    final String orderId = order['id']?.toString().substring(0, 8) ?? '12345';
                    final double total = (order['total'] as num?)?.toDouble() ?? 
                                         (order['totalAmount'] as num?)?.toDouble() ?? 0.0;
                    final String status = order['status']?.toString() ?? 'PAID';
                    
                    // Tratamento da data
                    String formattedDate = 'Recentemente';
                    if (order['createdAt'] != null) {
                      try {
                        final dt = DateTime.parse(order['createdAt']);
                        formattedDate = '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
                      } catch (_) {}
                    }

                    List<dynamic> items = order['items'] ?? order['orderItems'] ?? [];

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: AppStyles.cardDecoration,
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // 1. MINIATURA À ESQUERDA
                          GestureDetector(
                            onTap: () {
                              if (items.length == 1) {
                                final product = items[0]['product'] ?? items[0];
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ProductDetailScreen(product: product),
                                  ),
                                );
                              } else if (items.length > 1) {
                                _showOrderItemsModal(context, items, orderId);
                              }
                            },
                            child: Container(
                              width: 70,
                              height: 70,
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.borderLight),
                              ),
                              child: items.isEmpty
                                  ? const Icon(Icons.shopping_bag, color: AppColors.textMuted)
                                  : items.length == 1
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: Image.network(
                                            items[0]['product']?['imageUrl'] ?? items[0]['product']?['image'] ?? '',
                                            fit: BoxFit.cover,
                                            errorBuilder: (_, __, ___) => const Icon(Icons.shopping_bag, color: AppColors.textMuted),
                                          ),
                                        )
                                      : Stack(
                                          alignment: Alignment.center,
                                          children: [
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(8),
                                              child: Image.network(
                                                items[0]['product']?['imageUrl'] ?? items[0]['product']?['image'] ?? '',
                                                fit: BoxFit.cover,
                                                width: 70,
                                                height: 70,
                                                errorBuilder: (_, __, ___) => const Icon(Icons.shopping_bag, color: AppColors.textMuted),
                                              ),
                                            ),
                                            Container(
                                              decoration: BoxDecoration(
                                                color: Colors.black.withOpacity(0.55),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              alignment: Alignment.center,
                                              child: Text(
                                                '+${items.length}',
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // 2. INFORMAÇÕES DO PEDIDO
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Pedido #$orderId',
                                      style: AppStyles.titleStyle,
                                    ),
                                    Text(
                                      'R\$ ${total.toStringAsFixed(2)}',
                                      style: AppStyles.priceStyle,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  formattedDate,
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${items.length} ${items.length == 1 ? 'item' : 'itens'} no pedido',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        status,
                                        style: const TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}