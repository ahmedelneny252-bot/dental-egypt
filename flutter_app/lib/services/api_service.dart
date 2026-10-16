import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/clinic.dart';

class ApiService {
  final String baseUrl = 'https://your-api-domain.com/api'; // Change to your API

  Future<List<Clinic>> fetchClinics() async {
    final response = await http.get(Uri.parse('$baseUrl/clinics'));
    if (response.statusCode == 200) {
      List<dynamic> data = json.decode(response.body);
      return data.map((json) => Clinic.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load clinics');
    }
  }

  // Add other API methods as needed
}