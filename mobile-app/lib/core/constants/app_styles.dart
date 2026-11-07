import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFF10B981);
  static const darkBackground = Color(0xFF1F2937);
  static const lightBackground = Color(0xFFF9FAFB);
  static const textMain = Color(0xFF1F2937);
  static const textMuted = Colors.grey;
  static const borderLight = Color(0xFFE5E7EB); // Cores de bordas cinzas comuns
}

class AppStyles {
  static BoxDecoration cardDecoration = BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(12),
    border: Border.all(color: AppColors.borderLight),
  );

  static const TextStyle titleStyle = TextStyle(
    fontWeight: FontWeight.bold,
    fontSize: 14,
    color: AppColors.textMain,
  );

  static const TextStyle priceStyle = TextStyle(
    color: AppColors.primary,
    fontWeight: FontWeight.bold,
    fontSize: 14,
  );
}