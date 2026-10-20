import 'product_model.dart';

class CartItemModel {
  final String id;
  final String productId;
  final int quantity;
  final Product? product;

  CartItemModel({
    required this.id,
    required this.productId,
    required this.quantity,
    this.product,
  });

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      id: json['id'],
      productId: json['productId'],
      quantity: json['quantity'],
      product: json['product'] != null ? Product.fromJson(json['product']) : null,
    );
  }
}