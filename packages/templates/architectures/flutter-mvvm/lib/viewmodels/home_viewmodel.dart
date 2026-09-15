import 'package:flutter/foundation.dart';
import '../models/app_info.dart';

class HomeViewModel extends ChangeNotifier {
  AppInfo _appInfo = const AppInfo(
    appName: '{{projectName}}',
    version: '1.0.0',
    isReady: true,
  );

  int _counter = 0;

  AppInfo get appInfo => _appInfo;
  int get counter => _counter;

  void increment() {
    _counter++;
    notifyListeners();
  }
}
