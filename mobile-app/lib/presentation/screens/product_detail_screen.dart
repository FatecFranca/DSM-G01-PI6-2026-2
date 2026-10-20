import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';

class ProductDetailScreen extends StatefulWidget {
  final dynamic product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isAdding = false;

  String? _selectedSize;
  String? _selectedColor;

  List<String> _availableSizes = [];
  List<String> _availableColors = [];

  @override
  void initState() {
    super.initState();
    _parseVariations();
  }

  void _parseVariations() {
    final Map<String, dynamic> prod = widget.product is Map<String, dynamic>
        ? widget.product
        : (widget.product.toJson != null ? widget.product.toJson() : {});

    // Trata Tamanhos
    final dynamic rawSize = prod['size'] ?? prod['sizes'];
    if (rawSize != null) {
      if (rawSize is List) {
        _availableSizes = rawSize.map((e) => e.toString().trim()).toList();
      } else if (rawSize is String) {
        _availableSizes = rawSize
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      }
    }

    // Se houver tamanhos disponíveis, seleciona o primeiro por padrão
    if (_availableSizes.isNotEmpty) {
      _selectedSize = _availableSizes.first;
    }

    // Trata Cores
    final dynamic rawColor = prod['color'] ?? prod['colors'];
    if (rawColor != null) {
      if (rawColor is List) {
        _availableColors = rawColor.map((e) => e.toString().trim()).toList();
      } else if (rawColor is String) {
        _availableColors = rawColor
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      }
    }

    // Se houver cores disponíveis, seleciona a primeira por padrão
    if (_availableColors.isNotEmpty) {
      _selectedColor = _availableColors.first;
    }
  }

  Future<void> _addToCart() async {
    if (_availableSizes.isNotEmpty && _selectedSize == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, selecione um tamanho.')),
      );
      return;
    }

    if (_availableColors.isNotEmpty && _selectedColor == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, selecione uma cor.')),
      );
      return;
    }

    setState(() => _isAdding = true);
    try {
      final String productId = widget.product['id']?.toString() ?? '';
      
      await _apiClient.dio.post('/cart/items', data: {
        'productId': productId,
        'quantity': 1,
        if (_selectedSize != null) 'size': _selectedSize,
        if (_selectedColor != null) 'color': _selectedColor,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Produto adicionado ao carrinho com sucesso!'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao adicionar ao carrinho: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isAdding = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final Map<String, dynamic> prod = widget.product is Map<String, dynamic>
        ? widget.product
        : (widget.product.toJson != null ? widget.product.toJson() : {});

    final String name = prod['name']?.toString() ?? 'Produto';
    final String brand = prod['brand']?.toString() ?? '';
    final String sport = prod['sport']?.toString() ?? '';
    final double price = prod['price'] != null
        ? (double.tryParse(prod['price'].toString()) ?? 0.0)
        : 0.0;
    final String description =
        prod['description']?.toString() ?? 'Sem descrição disponível.';

    // Leitura flexível da URL da imagem
    final String? imageUrl =
        prod['imageUrl']?.toString() ?? prod['image']?.toString();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          name,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF1F2937),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Container da Imagem do Produto
            Container(
              height: 300,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: imageUrl != null && imageUrl.isNotEmpty
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => const Center(
                          child: Icon(Icons.shopping_bag, size: 80, color: Colors.grey),
                        ),
                      ),
                    )
                  : const Center(
                      child: Icon(Icons.shopping_bag, size: 80, color: Colors.grey),
                    ),
            ),
            const SizedBox(height: 16),

            // Marca e Esporte
            if (brand.isNotEmpty || sport.isNotEmpty)
              Text(
                [brand, sport].where((e) => e.isNotEmpty).join(' • ').toUpperCase(),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade600,
                ),
              ),
            const SizedBox(height: 4),

            // Nome do Produto
            Text(
              name,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),

            // Preço
            Text(
              'R\$ ${price.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF10B981),
              ),
            ),
            const SizedBox(height: 16),

            // Seletor de Tamanhos (se disponível)
            if (_availableSizes.isNotEmpty) ...[
              const Text(
                'Tamanho',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _availableSizes.map((size) {
                  final bool isSelected = _selectedSize == size;
                  return ChoiceChip(
                    label: Text(size),
                    selected: isSelected,
                    selectedColor: const Color(0xFF10B981),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedSize = size);
                      }
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            // Seletor de Cores (se disponível)
            if (_availableColors.isNotEmpty) ...[
              const Text(
                'Cor',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _availableColors.map((color) {
                  final bool isSelected = _selectedColor == color;
                  return ChoiceChip(
                    label: Text(color),
                    selected: isSelected,
                    selectedColor: const Color(0xFF10B981),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedColor = color);
                      }
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],

            // Descrição
            const Text(
              'Descrição',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              description,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade700, height: 1.4),
            ),
            const SizedBox(height: 24),

            // Botão Adicionar ao Carrinho
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isAdding ? null : _addToCart,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: _isAdding
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'ADICIONAR AO CARRINHO',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}