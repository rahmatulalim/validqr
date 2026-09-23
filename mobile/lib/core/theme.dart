import 'package:flutter/material.dart';

/// ValidQR / NusaPay Modern Design System
class AppColors {
  AppColors._();

  // Primary & Backgrounds
  static const Color backgroundDark = Color(0xFF101424); // Dark navy bg
  static const Color surfaceWhite = Color(0xFFFFFFFF);
  static const Color primaryBlue = Color(0xFF3B5998); // Fallback solid color for gradients
  static const Color primaryPurple = Color(0xFF6B4EE6); // For promo banners / FAB

  // Gradients
  static const LinearGradient balanceCardGradient = LinearGradient(
    colors: [Color(0xFF3B5998), Color(0xFF5A4FCF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient promoBannerGradient = LinearGradient(
    colors: [Color(0xFF6B4EE6), Color(0xFF9B51E0)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Status (Matches the dark/neon aesthetic of modals)
  // Blocked Modal
  static const Color modalBlockedBg = Color(0xFF1A0B0B);
  static const Color blockedRed = Color(0xFFFF4B4B);
  static const Color blockedRedDim = Color(0xFF3A1111);

  // Warning Modal
  static const Color modalWarningBg = Color(0xFF1C1608);
  static const Color warningYellow = Color(0xFFFFB74D);
  static const Color warningYellowDim = Color(0xFF422E10);

  // Verified Modal
  static const Color modalVerifiedBg = Color(0xFF0B1A10);
  static const Color verifiedGreen = Color(0xFF4CAF50);
  static const Color verifiedGreenDim = Color(0xFF14301B);

  // Text
  static const Color textLight = Color(0xFFFFFFFF);
  static const Color textDark = Color(0xFF1E293B);
  static const Color textMutedDark = Color(0xFF64748B);
  static const Color textMutedLight = Color(0xFF94A3B8);

  // UI Elements
  static const Color divider = Color(0xFFE2E8F0);
  static const Color iconBgLight = Color(0xFFF1F5F9);
  static const Color iconBgDark = Color(0x33FFFFFF);
}

class AppTextStyles {
  AppTextStyles._();
  
  // Note: Assuming Inter or default Roboto. Flutter's default is fine if we use weights well.
  static const TextStyle headerName = TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textLight);
  static const TextStyle headerGreeting = TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.textMutedLight);
  
  static const TextStyle balanceAmount = TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: AppColors.textLight);
  static const TextStyle balanceLabel = TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textLight);

  static const TextStyle sectionTitle = TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textDark);
  static const TextStyle itemTitle = TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textDark);
  static const TextStyle itemSubtitle = TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: AppColors.textMutedDark);
  static const TextStyle itemAmountOut = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark);
  static const TextStyle itemAmountIn = TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.verifiedGreen);

  // Modal Texts
  static const TextStyle modalTitle = TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textLight);
  static const TextStyle modalSubtitle = TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.textMutedLight);
  static const TextStyle tableHeader = TextStyle(fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.2);
  static const TextStyle tableLabel = TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMutedLight);
  static const TextStyle tableValue = TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textLight);
}

class AppSpacing {
  AppSpacing._();
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
}

class AppTheme {
  AppTheme._();
  
  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primaryBlue,
      surface: AppColors.backgroundDark,
    ),
    fontFamily: 'Inter', // Assuming Inter is default or available
  );
}
