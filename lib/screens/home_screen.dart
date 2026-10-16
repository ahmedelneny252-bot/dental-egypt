import 'package:flutter/material.dart';
import 'package:dental_clinics/widgets/custom_app_bar.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Dental Clinics'),
      body: const Center(
        child: Text(
          'Welcome to Dental Clinics Platform',
          style: TextStyle(fontSize: 20),
        ),
      ),
    );
  }
}