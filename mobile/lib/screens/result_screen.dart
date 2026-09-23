import 'package:flutter/material.dart';
import '../models/scan_response.dart';
import '../core/theme.dart';
import '../core/state_machine.dart';

class ResultScreen extends StatelessWidget {
  final ScanResponse response;

  const ResultScreen({super.key, required this.response});

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color primaryColor;
    Color primaryColorDim;
    IconData icon;
    String title;
    String subtitle;
    String headerText;

    switch (response.status) {
      case ScanStatus.hardBlock:
        bgColor = AppColors.modalBlockedBg;
        primaryColor = AppColors.blockedRed;
        primaryColorDim = AppColors.blockedRedDim;
        icon = Icons.gpp_bad;
        title = 'TRANSACTION BLOCKED';
        headerText = 'Potential Fraud Detected';
        subtitle = 'Physical sticker does not match the registered merchant';
        break;
      case ScanStatus.softWarning:
        bgColor = AppColors.modalWarningBg;
        primaryColor = AppColors.warningYellow;
        primaryColorDim = AppColors.warningYellowDim;
        icon = Icons.error_outline;
        title = 'MERCHANT NAME MISMATCH WARNING';
        headerText = 'Possible Merchant Rebrand Detected';
        subtitle = 'The scanned name differs slightly from our database. This may be a legitimate rebrand — please verify with the seller before proceeding.';
        break;
      case ScanStatus.verified:
      default:
        bgColor = AppColors.modalVerifiedBg;
        primaryColor = AppColors.verifiedGreen;
        primaryColorDim = AppColors.verifiedGreenDim;
        icon = Icons.verified_user;
        title = 'PAYMENT VERIFIED';
        headerText = 'Merchant Authenticated';
        subtitle = 'NMID & name match passed at minimum security level';
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: primaryColor.withOpacity(0.3), width: 1)),
      ),
      padding: const EdgeInsets.only(left: 24, right: 24, top: 12, bottom: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: primaryColorDim,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          
          // Icon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: primaryColorDim,
              shape: BoxShape.rectangle,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: primaryColor.withOpacity(0.2),
                  blurRadius: 20,
                  spreadRadius: 2,
                )
              ],
            ),
            child: Icon(icon, color: primaryColor, size: 40),
          ),
          const SizedBox(height: 16),
          
          // Header Texts
          Text(title, style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 11)),
          const SizedBox(height: 8),
          Text(headerText, style: AppTextStyles.modalTitle),
          const SizedBox(height: 8),
          Text(
            subtitle, 
            style: AppTextStyles.modalSubtitle,
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 24),
          
          // Details Table
          _buildDetailsTable(primaryColor, primaryColorDim),
          
          const SizedBox(height: 24),
          
          // Action Buttons
          _buildActionButtons(context, primaryColor, primaryColorDim),
        ],
      ),
    );
  }

  Widget _buildDetailsTable(Color primary, Color dim) {
    return Container(
      decoration: BoxDecoration(
        color: dim.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: dim, width: 1),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: dim, width: 1)),
            ),
            child: Row(
              children: [
                Icon(response.status == ScanStatus.verified ? Icons.check_circle_outline : Icons.warning_amber, color: primary, size: 16),
                const SizedBox(width: 8),
                Text(
                  response.status == ScanStatus.hardBlock ? 'CRITICAL MISMATCH DETAILS' : 
                  response.status == ScanStatus.softWarning ? 'NAME COMPARISON · ${response.score ?? 0}% MATCH' :
                  'VERIFIED VIA MINIMUM SECURITY LEVEL',
                  style: AppTextStyles.tableHeader.copyWith(color: primary),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (response.status == ScanStatus.hardBlock) ...[
                  _buildRow('Physical Sticker', 'Toko Aksesoris Penipu', badge: 'UNKNOWN ENTITY', badgeColor: AppColors.blockedRed),
                  const Divider(color: Colors.white12, height: 24),
                  _buildRow('Registered at Location', 'Warung Bakso Pak Budi', badge: '✓ Official · ID1020304050607', badgeColor: AppColors.verifiedGreen),
                  const Divider(color: Colors.white12, height: 24),
                  _buildScoreRow(0, primary),
                  const Divider(color: Colors.white12, height: 24),
                  _buildRow('Scanned NMID', response.reason == 'NMID_MISMATCH' ? 'ID99999999980' : 'Unknown', badge: 'X NOT IN DATABASE', badgeColor: AppColors.blockedRed),
                ] else if (response.status == ScanStatus.softWarning) ...[
                  _buildRow('Scanned Sticker', 'Bakso Budi Dipatiukur', badge: '⚡ Partial Match', badgeColor: AppColors.warningYellow),
                  const Divider(color: Colors.white12, height: 24),
                  _buildRow('Database Record', 'Warung Bakso Pak Budi', badge: '✓ NMID: ID1020304050607', badgeColor: AppColors.verifiedGreen),
                  const Divider(color: Colors.white12, height: 24),
                  _buildScoreRow(response.score ?? 70, primary),
                ] else ...[
                  _buildRow('Merchant Name', '✓ Warung Bakso Pak Budi', valueColor: AppColors.verifiedGreen),
                  const Divider(color: Colors.white12, height: 24),
                  _buildRow('NMID', 'ID1020304050607', badge: '✓ Official · Matched', badgeColor: AppColors.verifiedGreen),
                  const Divider(color: Colors.white12, height: 24),
                  _buildScoreRow(100, primary),
                  const Divider(color: Colors.white12, height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('GPS Verification', style: AppTextStyles.tableLabel),
                      Row(
                        children: [
                          Icon(Icons.location_off, color: AppColors.textMutedLight, size: 14),
                          const SizedBox(width: 4),
                          const Text('Skipped (Offline)', style: AppTextStyles.tableLabel),
                        ],
                      )
                    ],
                  )
                ]
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {String? badge, Color? badgeColor, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.tableLabel),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(value, style: AppTextStyles.tableValue.copyWith(color: valueColor ?? AppColors.textLight)),
            if (badge != null) ...[
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  border: Border.all(color: badgeColor!.withOpacity(0.5)),
                  borderRadius: BorderRadius.circular(4),
                  color: badgeColor.withOpacity(0.1),
                ),
                child: Text(badge, style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold)),
              )
            ]
          ],
        )
      ],
    );
  }

  Widget _buildScoreRow(int score, Color primary) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Fuzzy Name Match Score', style: AppTextStyles.tableLabel),
            Text('$score%', style: AppTextStyles.tableValue.copyWith(color: primary)),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: score / 100,
          backgroundColor: primary.withOpacity(0.2),
          valueColor: AlwaysStoppedAnimation<Color>(primary),
          borderRadius: BorderRadius.circular(4),
          minHeight: 6,
        )
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context, Color primary, Color dim) {
    if (response.status == ScanStatus.hardBlock) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.cancel_outlined, color: Colors.white),
          label: const Text('Cancel & Report Fraud', style: TextStyle(color: Colors.white)),
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      );
    } else if (response.status == ScanStatus.softWarning) {
      return Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Yes, Confirm & Proceed', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: primary),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text('Cancel Transaction', style: TextStyle(color: primary, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      );
    } else {
      // Verified
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_forward, color: Colors.white),
          label: const Text('Confirm & Enter Amount', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: primary,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      );
    }
  }
}
