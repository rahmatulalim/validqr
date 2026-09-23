import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/constants.dart';

class WarningAlertDialog extends StatelessWidget {
  final VoidCallback onContinue;

  const WarningAlertDialog({super.key, required this.onContinue});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Konfirmasi Pembayaran'),
      content: const Text(
        'Nama merchant pada QR tidak sepenuhnya cocok dengan data terdaftar. '
        'Pastikan Anda sudah mengonfirmasi dengan merchant sebelum melanjutkan.'
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Batal', style: TextStyle(color: AppColors.secondaryText)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.warningDark),
          onPressed: onContinue,
          child: const Text('Saya Mengerti, Lanjutkan'),
        ),
      ],
    );
  }
}
