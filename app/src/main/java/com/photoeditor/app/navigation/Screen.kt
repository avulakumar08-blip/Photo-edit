package com.photoeditor.app.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Onboarding : Screen("onboarding")
    object Home : Screen("home")
    object GalleryPicker : Screen("gallery_picker")
    object Camera : Screen("camera")
    object Editor : Screen("editor")
    object ExportPreview : Screen("export_preview")
    object Projects : Screen("projects")
    object Profile : Screen("profile")
    object Settings : Screen("settings")
}
