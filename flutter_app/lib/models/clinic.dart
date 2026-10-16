class Clinic {
  final String id;
  final String name;
  final String address;
  final String phone;
  final double rating;

  Clinic({
    required this.id,
    required this.name,
    required this.address,
    required this.phone,
    this.rating = 0.0,
  });

  // Factory constructor from JSON (if needed)
  factory Clinic.fromJson(Map<String, dynamic> json) {
    return Clinic(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      phone: json['phone'] ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'phone': phone,
      'rating': rating,
    };
  }
}