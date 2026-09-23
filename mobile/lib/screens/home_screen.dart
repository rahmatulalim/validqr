import 'package:flutter/material.dart';
import '../core/theme.dart';
import 'scanner_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundDark,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeader(),
                _buildBalanceCard(),
                _buildPromoBanner(),
                const SizedBox(height: AppSpacing.lg),
                _buildTransactionsList(),
              ],
            ),
            _buildBottomNavBar(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Good Morning 👋', style: AppTextStyles.headerGreeting),
              SizedBox(height: 4),
              Text('Rahmatul Akbar Alim', style: AppTextStyles.headerName),
            ],
          ),
          CircleAvatar(
            backgroundColor: AppColors.iconBgDark,
            child: const Icon(Icons.person_outline, color: AppColors.textLight),
          )
        ],
      ),
    );
  }

  Widget _buildBalanceCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: AppColors.balanceCardGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryBlue.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Available Balance', style: AppTextStyles.balanceLabel),
          const SizedBox(height: 8),
          const Text('Rp 4.827.500', style: AppTextStyles.balanceAmount),
          const SizedBox(height: 4),
          Text('NusaPay · **** 9284', style: AppTextStyles.balanceLabel.copyWith(color: AppColors.textLight.withOpacity(0.7))),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildActionButton(Icons.add, 'Top Up'),
              _buildActionButton(Icons.arrow_upward, 'Transfer'),
              _buildActionButton(Icons.history, 'History'),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label) {
    return Container(
      width: 90,
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.iconBgDark,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.textLight, size: 20),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: AppColors.textLight, fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildPromoBanner() {
    return Container(
      margin: const EdgeInsets.only(left: AppSpacing.lg, right: AppSpacing.lg, top: AppSpacing.lg),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        gradient: AppColors.promoBannerGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Cashback 10% QRIS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 4),
              Text('All merchants · Ends Jul 31', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
            ],
          ),
          const Icon(Icons.chevron_right, color: Colors.white),
        ],
      ),
    );
  }

  Widget _buildTransactionsList() {
    return Expanded(
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surfaceWhite,
          borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Transactions', style: AppTextStyles.sectionTitle),
                Text('See All', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            Expanded(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                children: [
                  _buildTxItem(Icons.restaurant, 'Warung Bakso Pak Budi', 'Today, 12:10 PM', '-Rp25.000', false),
                  _buildTxItem(Icons.credit_card, 'Top Up via BCA Virtual', 'Today, 09:15 AM', '+Rp500.000', true),
                  _buildTxItem(Icons.shopping_cart, 'Alfamart Cipete Raya', 'Yesterday, 06:42 PM', '-Rp87.500', false),
                  _buildTxItem(Icons.motorcycle, 'Gojek — GoRide', 'Yesterday, 02:15 PM', '-Rp32.000', false),
                  _buildTxItem(Icons.person, 'Transfer to Budi S.', 'Mon, Jul 14', '-Rp150.000', false),
                  const SizedBox(height: 80), // Space for bottom nav
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildTxItem(IconData icon, String title, String time, String amount, bool isIncome) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.iconBgLight,
            radius: 20,
            child: Icon(icon, color: AppColors.textMutedDark, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.itemTitle),
                const SizedBox(height: 4),
                Text(time, style: AppTextStyles.itemSubtitle),
              ],
            ),
          ),
          Text(amount, style: isIncome ? AppTextStyles.itemAmountIn : AppTextStyles.itemAmountOut),
        ],
      ),
    );
  }

  Widget _buildBottomNavBar(BuildContext context) {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          Container(
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.surfaceWhite,
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5)),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildNavItem(Icons.home_filled, 'Home', true),
                _buildNavItem(Icons.credit_card, 'Cards', false),
                const SizedBox(width: 80), // Space for FAB
                _buildNavItem(Icons.notifications_none, 'Alerts', false),
                _buildNavItem(Icons.person_outline, 'Profile', false),
              ],
            ),
          ),
          Positioned(
            bottom: 30,
            child: GestureDetector(
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const ScannerScreen()));
              },
              child: Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: AppColors.primaryPurple,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primaryPurple.withOpacity(0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    )
                  ],
                ),
                child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 32),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool isActive) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, color: isActive ? AppColors.primaryBlue : AppColors.textMutedLight),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(
          color: isActive ? AppColors.primaryBlue : AppColors.textMutedLight,
          fontSize: 10,
          fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
        )),
      ],
    );
  }
}
