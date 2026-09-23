import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants.dart';
import '../models/qr_payload.dart';
import '../models/scan_response.dart';

class ApiService {
  Future<ScanResponse> verifyScan({
    required QrPayload payload,
    double? latitude,
    double? longitude,
  }) async {
    final url = Uri.parse('${AppConstants.apiBaseUrl}${AppConstants.scanEndpoint}');
    
    final body = {
      'nmid': payload.nmid,
      'merchantName': payload.merchantName,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    };

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(AppConstants.apiTimeout);

      if (response.statusCode == 200 || response.statusCode == 400) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        
        if (data.containsKey('error') && data['error'] == 'BAD_REQUEST') {
            throw Exception(data['message'] ?? 'Bad Request');
        }
        
        return ScanResponse.fromJson(data);
      } else {
        throw Exception('Failed to verify scan. Status code: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
