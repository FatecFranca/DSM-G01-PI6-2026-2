import 'package:dio/dio.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  static String? authToken;

  final Dio dio = Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3002/api',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (authToken != null) {
            options.headers['Authorization'] = 'Bearer $authToken';
          }
          return handler.next(options);
        },
      ),
    );

  Future<dynamic> getProducts({
    int page = 1,
    int limit = 30,
    String? collection,
    String? search,
  }) async {
    final Map<String, dynamic> queryParams = {
      'page': page,
      'limit': limit,
    };

    if (collection != null && collection.isNotEmpty) {
      queryParams['collection'] = collection;
    }

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }

    final response = await dio.get('/products', queryParameters: queryParams);
    return response.data;
  }

  Future<dynamic> getCart() async {
    final response = await dio.get('/cart');
    return response.data;
  }
}