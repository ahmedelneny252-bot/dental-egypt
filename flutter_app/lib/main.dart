import 'package:flutter/material.dart';
import 'package:dental_clinics/screens/home_screen.dart';

void main() {
  runApp(const DentalClinicsApp());
}

class DentalClinicsApp extends StatelessWidget {
  const DentalClinicsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dental Clinics Platform',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const HomeScreen(),
    );
  }
}