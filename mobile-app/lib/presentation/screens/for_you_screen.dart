import 'package:flutter/material.dart';
import '../../core/constants/app_styles.dart';
import '../../core/network/api_client.dart';
import 'product_detail_screen.dart';

class ForYouScreen extends StatefulWidget {
  const ForYouScreen({super.key});

  @override
  State<ForYouScreen> createState() => _ForYouScreenState();
}

class _ForYouScreenState extends State<ForYouScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _recommendedProducts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRecommendations();
  }

  Future<void> _fetchRecommendations() async {
    setState(() => _isLoading = true);
    try {
      final dynamic response = await _apiClient.getRecommendations();
      print('DEBUG MOBILE - Resposta da Web/API: $response');

      List<dynamic> productList = [];
      if (response is Map) {
        final dynamic prods = response['products'];
        if (prods is List) {
          productList = prods;
        }
      } else if (response is List) {
        productList = response;
      }

      setState(() {
        _recommendedProducts = productList;
        _isLoading = false;
      });
    } catch (e) {
      print('DEBUG MOBILE - Erro ao carregar recomendações: $e');
      setState(() {
        _recommendedProducts = [];
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Para Você (Recomendações)'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _recommendedProducts.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24.0),
                    child: Text(
                      'Nenhuma recomendação disponível no momento. Realize algumas compras para treinar as regras de associação!',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 15),
                    ),
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Quem comprou, também levou',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textMain,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Sugestões baseadas em mineração de regras de associação (Apriori).',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: GridView.builder(
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.72,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _recommendedProducts.length,
                          itemBuilder: (context, index) {
                            final product = _recommendedProducts[index];
                            final String name = product['name']?.toString() ?? 'Produto';
                            final double price = (product['price'] as num?)?.toDouble() ?? 0.0;
                            final String? imageUrl = product['imageUrl']?.toString() ?? product['image']?.toString();
                            final String? brand = product['brand']?.toString();

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
                                decoration: AppStyles.cardDecoration,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Container(
                                        width: double.infinity,
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade100,
                                          borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                        ),
                                        child: imageUrl != null && imageUrl.isNotEmpty
                                            ? ClipRRect(
                                                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                                child: Image.network(
                                                  imageUrl,
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (_, __, ___) => const Icon(
                                                    Icons.shopping_bag,
                                                    size: 40,
                                                    color: AppColors.textMuted,
                                                  ),
                                                ),
                                              )
                                            : const Icon(Icons.shopping_bag, size: 40, color: AppColors.textMuted),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.all(10.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (brand != null && brand.isNotEmpty) ...[
                                            Text(
                                              brand,
                                              style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                                            ),
                                            const SizedBox(height: 2),
                                          ],
                                          Text(
                                            name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                              color: AppColors.textMain,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            'R\$ ${price.toStringAsFixed(2)}',
                                            style: AppStyles.priceStyle,
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
                    ],
                  ),
                ),
    );
  }
}