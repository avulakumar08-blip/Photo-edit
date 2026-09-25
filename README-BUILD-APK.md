# Photo Editor - Android Studio & APK Build Instructions

This is a complete, native Android application project built with **Kotlin** and **Jetpack Compose**, targeting Android 8.0 (API 26) through Android 15 (API 35).

---

## 🚀 How to Build into an APK

### Method 1: Build APK via Android Studio (Recommended)

1. **Open the Project:**
   - Launch Android Studio (version Ladybug / Hedgehog or newer with JDK 17+ support).
   - Click **File > Open...** and select the root directory containing `settings.gradle.kts` and `app/`.
   - Android Studio will automatically run Gradle Sync.

2. **Build Debug APK (`app-debug.apk`):**
   - In Android Studio, open the top menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once compilation finishes, a popup will appear at the bottom right:
     `APK(s) generated successfully for 1 module. [locate]`.
   - Click **locate**. Your APK will be at:
     ```
     app/build/outputs/apk/debug/app-debug.apk
     ```

3. **Run on an Emulator or Real Device:**
   - Connect your Android phone with **USB Debugging** enabled (or start an Android Virtual Device from Device Manager).
   - Click the green **Run (▶)** button in Android Studio.

---

### Method 2: Build APK via Command Line (Terminal / CI)

From the project root directory, run:

#### On Linux / macOS:
```bash
# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

# Output APK path:
# app/build/outputs/apk/debug/app-debug.apk
```

#### On Windows:
```cmd
gradlew.bat assembleDebug
```

---

### Method 3: Build Signed Release APK (`app-release.apk`)

1. In Android Studio, go to **Build > Generate Signed Bundle / APK...**
2. Choose **APK**, then click **Next**.
3. Select your Keystore (or click *Create new...* to generate a keystore `.jks` file).
4. Enter your Keystore password, key alias, and key password.
5. Select destination folder and choose build variant: `release`.
6. Click **Finish**. Your signed production APK will be generated at:
   ```
   app/release/app-release.apk
   ```

---

## 📦 Project Architecture & Key Files

| Path | Purpose |
|------|---------|
| `app/build.gradle.kts` | Application Gradle configuration, SDK versions (minSdk 26, targetSdk 35), Compose BOM, CameraX & Room dependencies |
| `app/src/main/AndroidManifest.xml` | Declares Camera, Storage, FileProvider, and Android 8-15 permissions |
| `app/src/main/java/com/photoeditor/app/MainActivity.kt` | Android Activity entry point loading the Jetpack Compose theme & NavGraph |
| `app/src/main/java/com/photoeditor/app/navigation/NavGraph.kt` | Navigation across all 10 screens (Splash, Onboarding, Home, Gallery, Camera, Editor, ExportPreview, Projects, Profile, Settings) |
| `app/src/main/java/com/photoeditor/app/editor/ImageProcessor.kt` | Hardware-accelerated Bitmap transformations, ColorMatrix filters, Non-destructive overlay rendering |
| `app/src/main/java/com/photoeditor/app/editor/EditorViewModel.kt` | Reactive StateFlow state holder with real non-destructive Undo/Redo stacks |
| `app/src/main/java/com/photoeditor/app/filters/FilterManager.kt` | 9 photographic filter algorithms (Cinematic, Vintage, Warm, Cool, B&W, Dramatic, etc.) |
| `app/src/main/java/com/photoeditor/app/camera/CameraXHelper.kt` | CameraX lifecycle binding, high-res capture, front/back lens toggle, flash modes |
| `app/src/main/java/com/photoeditor/app/export/ImageExporter.kt` | MediaStore insertion (JPG, PNG, WEBP), quality compression, and Android Sharesheet |
| `app/src/main/java/com/photoeditor/app/drive/GoogleDriveService.kt` | Direct multipart Google Drive upload integration |
| `app/src/main/java/com/photoeditor/app/ai/AiPhotoService.kt` | Clean architectural interface for AI tools with explicit unconfigured/offline handling |
