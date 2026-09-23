import 'package:flutter/material.dart';
import '../core/constants.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppConstants.historyTitle),
      ),
      body: const Center(
        child: Text('Riwayat scan akan ditampilkan di sini.'),
      ),
    );
  }
}
