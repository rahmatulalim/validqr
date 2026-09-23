import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QRScannerWidget extends StatelessWidget {
  final MobileScannerController controller;
  final void Function(BarcodeCapture) onDetect;

  const QRScannerWidget({
    super.key,
    required this.controller,
    required this.onDetect,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        MobileScanner(
          controller: controller,
          onDetect: onDetect,
        ),
        // Dark overlay outside the scanner frame
        Container(
          color: Colors.black.withOpacity(0.4),
        ),
        // The actual scan frame (transparent center with corners)
        _buildScanFrame(),
        
        Positioned(
          bottom: 50,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: const Text(
              'Detecting QRIS · ValidQR SDK Active',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildScanFrame() {
    return Center(
      child: Container(
        width: 280,
        height: 280,
        decoration: BoxDecoration(
          color: Colors.transparent,
          // A hack to clear the overlay inside this box is typically done with a CustomPaint.
          // For simplicity in UI building, we will just draw the frame corners here.
        ),
        child: CustomPaint(
          painter: ScannerOverlayPainter(),
        ),
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double cornerLength = 40.0;
    final double cornerRadius = 16.0;
    
    final Paint paint = Paint()
      ..color = const Color(0xFF6B4EE6) // Primary purple/blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;
      
    final Path path = Path();
    
    // Top Left
    path.moveTo(0, cornerLength);
    path.lineTo(0, cornerRadius);
    path.arcToPoint(Offset(cornerRadius, 0), radius: Radius.circular(cornerRadius));
    path.lineTo(cornerLength, 0);

    // Top Right
    path.moveTo(size.width - cornerLength, 0);
    path.lineTo(size.width - cornerRadius, 0);
    path.arcToPoint(Offset(size.width, cornerRadius), radius: Radius.circular(cornerRadius));
    path.lineTo(size.width, cornerLength);

    // Bottom Right
    path.moveTo(size.width, size.height - cornerLength);
    path.lineTo(size.width, size.height - cornerRadius);
    path.arcToPoint(Offset(size.width - cornerRadius, size.height), radius: Radius.circular(cornerRadius));
    path.lineTo(size.width - cornerLength, size.height);

    // Bottom Left
    path.moveTo(cornerLength, size.height);
    path.lineTo(cornerRadius, size.height);
    path.arcToPoint(Offset(0, size.height - cornerRadius), radius: Radius.circular(cornerRadius));
    path.lineTo(0, size.height - cornerLength);

    canvas.drawPath(path, paint);
    
    // Scan line
    final Paint linePaint = Paint()
      ..color = const Color(0xFF6B4EE6).withOpacity(0.8)
      ..style = PaintingStyle.fill
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4.0);
      
    canvas.drawRect(Rect.fromLTWH(20, size.height / 2, size.width - 40, 2), linePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
