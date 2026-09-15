import 'package:flutter/material.dart';
import '../viewmodels/home_viewmodel.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  late final HomeViewModel _viewModel;

  @override
  void initState() {
    super.initState();
    _viewModel = HomeViewModel();
    _viewModel.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_viewModel.appInfo.appName),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Architecture: MVVM Pattern', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            Text('Taps: ${_viewModel.counter}', style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _viewModel.increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
