import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../core/constants.dart';
import '../core/theme.dart';
import '../core/state_machine.dart';
import '../services/scanner_service.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../widgets/qr_scanner_widget.dart';
import 'result_screen.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  final ScannerService _scannerService = ScannerService();
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();
  bool _isProcessing = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleScan(BarcodeCapture capture) async {
    if (_isProcessing) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty || barcodes.first.rawValue == null) return;

    final String rawValue = barcodes.first.rawValue!;
    
    setState(() {
      _isProcessing = true;
    });

    final stateMachine = Provider.of<ScanStateMachine>(context, listen: false);
    stateMachine.startScan();
    
    // Stop scanner temporarily while processing
    _controller.stop();

    try {
      // 1. Parse QRIS Payload
      final payload = _scannerService.parseQris(rawValue);

      // 2. Get Location (with graceful failure)
      final position = await _locationService.getCurrentLocation();

      // 3. Verify with Backend (Layers 1-3)
      final response = await _apiService.verifyScan(
        payload: payload,
        latitude: position?.latitude,
        longitude: position?.longitude,
      );

      // 4. Update state and show modal
      stateMachine.setResult(response.status);
      
      if (mounted) {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => ResultScreen(response: response),
        ).then((_) {
          // When returning from result modal, reset state and resume scanning
          setState(() {
            _isProcessing = false;
          });
          stateMachine.reset();
          _controller.start();
        });
      }
    } catch (e) {
      stateMachine.setError(e.toString());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppColors.blockedRed,
          ),
        );
        setState(() {
          _isProcessing = false;
        });
        _controller.start();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          QRScannerWidget(
            controller: _controller,
            onDetect: _handleScan,
          ),
          
          // Header Overlay
          Positioned(
            top: 50,
            left: 20,
            right: 20,
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildIconButton(Icons.arrow_back, () => Navigator.pop(context)),
                    Column(
                      children: [
                        const Text('Scan QRIS', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('Align QR code within the frame', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                      ],
                    ),
                    _buildIconButton(Icons.flash_off, () => _controller.toggleTorch()),
                  ],
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.location_off, color: Colors.white.withOpacity(0.7), size: 14),
                      const SizedBox(width: 6),
                      Text('Location: Offline (Basement Mode)', style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          Consumer<ScanStateMachine>(
            builder: (context, stateMachine, child) {
              if (stateMachine.isLoading) {
                return Container(
                  color: Colors.black54,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.primaryBlue,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildIconButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
    );
  }
}
