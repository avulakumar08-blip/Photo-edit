package com.photoeditor.app.navigation

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.photoeditor.app.editor.EditorViewModel
import com.photoeditor.app.editor.ImageProcessor
import com.photoeditor.app.ui.screens.CameraScreen
import com.photoeditor.app.ui.screens.EditorScreen
import com.photoeditor.app.ui.screens.ExportPreviewScreen
import com.photoeditor.app.ui.screens.GalleryPickerScreen
import com.photoeditor.app.ui.screens.HomeScreen
import com.photoeditor.app.ui.screens.OnboardingScreen
import com.photoeditor.app.ui.screens.ProfileScreen
import com.photoeditor.app.ui.screens.ProjectsScreen
import com.photoeditor.app.ui.screens.SettingsScreen
import com.photoeditor.app.ui.screens.SplashScreen
import kotlinx.coroutines.launch

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController(),
    editorViewModel: EditorViewModel = viewModel()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                onSplashFinished = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onFinish = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                onCreateNewEdit = { navController.navigate(Screen.GalleryPicker.route) },
                onOpenGallery = { navController.navigate(Screen.GalleryPicker.route) },
                onOpenCamera = { navController.navigate(Screen.Camera.route) },
                onOpenProjects = { navController.navigate(Screen.Projects.route) },
                onOpenProfile = { navController.navigate(Screen.Profile.route) },
                onOpenSettings = { navController.navigate(Screen.Settings.route) },
                onSelectQuickTool = { _ -> navController.navigate(Screen.GalleryPicker.route) }
            )
        }

        composable(Screen.GalleryPicker.route) {
            GalleryPickerScreen(
                onPhotoSelected = { uri: Uri ->
                    scope.launch {
                        val bitmap = ImageProcessor.decodeSampledBitmapFromUri(context, uri)
                        if (bitmap != null) {
                            editorViewModel.setInitialImage(bitmap, uri.toString())
                            navController.navigate(Screen.Editor.route)
                        }
                    }
                },
                onOpenGoogleDrive = {
                    // Open Google Drive import
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Camera.route) {
            CameraScreen(
                onImageCaptured = { uri: Uri ->
                    scope.launch {
                        val bitmap = ImageProcessor.decodeSampledBitmapFromUri(context, uri)
                        if (bitmap != null) {
                            editorViewModel.setInitialImage(bitmap, uri.toString())
                            navController.navigate(Screen.Editor.route)
                        }
                    }
                },
                onOpenGallery = {
                    navController.navigate(Screen.GalleryPicker.route)
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Editor.route) {
            EditorScreen(
                viewModel = editorViewModel,
                onNavigateToExport = { navController.navigate(Screen.ExportPreview.route) },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.ExportPreview.route) {
            ExportPreviewScreen(
                viewModel = editorViewModel,
                onEditAgain = { navController.popBackStack() },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Projects.route) {
            ProjectsScreen(
                onOpenProject = { _ -> navController.navigate(Screen.Editor.route) },
                onBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.Settings.route) {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
