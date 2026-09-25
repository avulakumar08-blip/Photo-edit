package com.photoeditor.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.photoeditor.app.ui.theme.AccentCyan
import com.photoeditor.app.ui.theme.AccentIndigo
import com.photoeditor.app.ui.theme.DarkCard
import com.photoeditor.app.ui.theme.DarkCanvasBg

@Composable
fun SettingsScreen(onBack: () -> Unit) {
    var autoSave by remember { mutableStateOf(true) }
    var hapticFeedback by remember { mutableStateOf(true) }
    var highQualityPreview by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkCanvasBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Settings",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
            )
        }

        Spacer(modifier = Modifier.height(20.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCard)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Preferences", fontWeight = FontWeight.Bold, color = AccentCyan, fontSize = 14.sp)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Auto Save Projects", fontWeight = FontWeight.Medium, color = Color.White)
                        Text("Preserves undo history locally", fontSize = 12.sp, color = Color.Gray)
                    }
                    Switch(
                        checked = autoSave,
                        onCheckedChange = { autoSave = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = AccentIndigo)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Haptic Feedback", fontWeight = FontWeight.Medium, color = Color.White)
                        Text("Vibrate on slider snap and tool taps", fontSize = 12.sp, color = Color.Gray)
                    }
                    Switch(
                        checked = hapticFeedback,
                        onCheckedChange = { hapticFeedback = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = AccentIndigo)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Full-Res Preview Mode", fontWeight = FontWeight.Medium, color = Color.White)
                        Text("Utilizes GPU rendering for sharper canvas", fontSize = 12.sp, color = Color.Gray)
                    }
                    Switch(
                        checked = highQualityPreview,
                        onCheckedChange = { highQualityPreview = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = AccentIndigo)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // About & Version Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkCard)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("About Photo Editor", fontWeight = FontWeight.Bold, color = AccentCyan, fontSize = 14.sp)
                Text("App Version: 1.0.0 (Native Android Compose)", color = Color.White, fontSize = 14.sp)
                Text("Target SDK: Android 15 (API 35) • Min SDK: Android 8.0 (API 26)", color = Color.Gray, fontSize = 13.sp)
                Text("Image Engine: Android Hardware-Accelerated Canvas & ColorMatrix", color = Color.Gray, fontSize = 13.sp)
                Text("Build Target: app-debug.apk / app-release.apk", color = AccentIndigo, fontSize = 13.sp)
            }
        }
    }
}
