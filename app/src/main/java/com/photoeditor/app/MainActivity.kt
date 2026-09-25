package com.photoeditor.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.photoeditor.app.navigation.NavGraph
import com.photoeditor.app.ui.theme.DarkCanvasBg
import com.photoeditor.app.ui.theme.PhotoEditorTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PhotoEditorTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DarkCanvasBg
                ) {
                    NavGraph()
                }
            }
        }
    }
}
