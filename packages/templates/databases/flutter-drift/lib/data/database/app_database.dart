class AppDatabase {
  static final AppDatabase instance = AppDatabase._internal();
  AppDatabase._internal();

  bool _isInitialized = false;

  Future<void> initialize() async {
    _isInitialized = true;
    print('[Drift] Initialized local SQLite database for {{projectName}}');
  }

  bool get isReady => _isInitialized;
}
