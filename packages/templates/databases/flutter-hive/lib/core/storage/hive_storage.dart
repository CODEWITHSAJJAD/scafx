import 'package:hive_flutter/hive_flutter.dart';

class HiveStorageService {
  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox('settingsBox');
  }

  static Box get box => Hive.box('settingsBox');
}
