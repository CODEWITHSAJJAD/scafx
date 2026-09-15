import 'package:flutter/material.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('{{projectName}} Dashboard')),
      body: const Center(
        child: Text('Feature-First Architecture: Dashboard Slice'),
      ),
    );
  }
}
