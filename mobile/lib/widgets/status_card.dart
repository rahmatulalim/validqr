import 'package:flutter/material.dart';
import '../models/scan_response.dart';
import '../core/theme.dart';
import '../core/state_machine.dart';

class StatusCard extends StatelessWidget {
  final ScanResponse response;

  const StatusCard({super.key, required this.response});

  @override
  Widget build(BuildContext context) {
    Color backgroundColor;
    Color iconColor;
    IconData iconData;
    String titleText;

    switch (response.status) {
      case ScanStatus.verified:
        backgroundColor = AppColors.verifiedBackground;
        iconColor = AppColors.verified;
        iconData = Icons.check_circle;
        titleText = 'TRANSAKSI AMAN';
        break;
      case ScanStatus.softWarning:
        backgroundColor = AppColors.warningBackground;
        iconColor = AppColors.warningDark;
        iconData = Icons.warning_amber;
        titleText = 'KONFIRMASI DIPERLUKAN';
        break;
      case ScanStatus.hardBlock:
        backgroundColor = AppColors.dangerBackground;
        iconColor = AppColors.danger;
        iconData = Icons.block;
        titleText = 'TRANSAKSI DIBLOKIR';
        break;
      default:
        backgroundColor = AppColors.surface;
        iconColor = AppColors.secondaryText;
        iconData = Icons.help_outline;
        titleText = 'STATUS TIDAK DIKETAHUI';
    }

    return Card(
      color: backgroundColor,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Icon(iconData, size: 64, color: iconColor),
            const SizedBox(height: AppSpacing.md),
            Text(
              titleText,
              style: AppTextStyles.headlineMedium.copyWith(color: iconColor),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              response.message,
              style: AppTextStyles.bodyLarge,
              textAlign: TextAlign.center,
            ),
            if (response.score != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Skor Kecocokan: ${response.score}%',
                style: AppTextStyles.bodyMedium,
              ),
            ],
            if (response.distanceMeters != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Jarak GPS: ${response.distanceMeters}m',
                style: AppTextStyles.bodyMedium,
              ),
            ],
            if (response.degraded == true) ...[
              const SizedBox(height: AppSpacing.sm),
              const Text(
                'GPS tidak tersedia, degradasi aktif',
                style: TextStyle(fontStyle: FontStyle.italic, color: AppColors.secondaryText),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
