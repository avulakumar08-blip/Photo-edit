package com.photoeditor.app.ui.screens

import android.graphics.Bitmap
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.CloudUpload
import androidx.compose.material.icons.rounded.Download
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.photoeditor.app.editor.EditorViewModel
import com.photoeditor.app.export.ExportFormat
import com.photoeditor.app.export.ExportQuality
import com.photoeditor.app.export.ExportResolution
import com.photoeditor.app.export.ImageExporter
import com.photoeditor.app.ui.theme.AccentCyan
import com.photoeditor.app.ui.theme.AccentIndigo
import com.photoeditor.app.ui.theme.DarkCard
import com.photoeditor.app.ui.theme.DarkCanvasBg
import com.photoeditor.app.ui.theme.DarkSurface
import kotlinx.coroutines.launch

@Composable
fun ExportPreviewScreen(
    viewModel: EditorViewModel,
    onEditAgain: () -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val previewBitmap by viewModel.previewBitmap.collectAsState()
    val originalBitmap by viewModel.originalBitmap.collectAsState()

    var showOriginal by remember { mutableStateOf(false) }
    var selectedFormat by remember { mutableStateOf(ExportFormat.JPG) }
    var selectedQuality by remember { mutableStateOf(ExportQuality.HIGH) }
    var selectedResolution by remember { mutableStateOf(ExportResolution.ORIGINAL) }
    var isSaving by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkCanvasBg)
            .verticalScroll(rememberScrollState())
    ) {
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                    contentDescription = "Back",
                    tint = Color.White
                )
            }
            Text(
                text = "Preview & Export",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                )
            )
            IconButton(onClick = onEditAgain) {
                Icon(
                    imageVector = Icons.Rounded.Edit,
                    contentDescription = "Edit Again",
                    tint = AccentCyan
                )
            }
        }

        // Preview Canvas with Before/After Switch
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(340.dp)
                .padding(horizontal = 16.dp)
                .background(Color.Black, RoundedCornerShape(16.dp))
                .clip(RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            val bmp = if (showOriginal) originalBitmap else previewBitmap
            if (bmp != null) {
                Image(
                    bitmap = bmp.asImageBitmap(),
                    contentDescription = "Export Preview",
                    modifier = Modifier.fillMaxSize().padding(6.dp)
                )
            }

            // Before / After toggle button
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 12.dp)
                    .background(DarkSurface.copy(alpha = 0.85f), RoundedCornerShape(20.dp))
                    .padding(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (!showOriginal) AccentIndigo else Color.Transparent)
                        .clickable { showOriginal = false }
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text("Edited", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (showOriginal) AccentIndigo else Color.Transparent)
                        .clickable { showOriginal = true }
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                ) {
                    Text("Original", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Export Format & Settings Options
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        ) {
            // Format Selector
            Text("File Format", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ExportFormat.values().forEach { fmt ->
                    Button(
                        onClick = { selectedFormat = fmt },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedFormat == fmt) AccentIndigo else DarkCard
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(fmt.extension.uppercase(), fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Quality Selector
            Text("Quality", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ExportQuality.values().forEach { q ->
                    Button(
                        onClick = { selectedQuality = q },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedQuality == q) AccentCyan else DarkCard
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(q.label, fontSize = 13.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Resolution Selector
            Text("Resolution", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ExportResolution.values().forEach { res ->
                    Button(
                        onClick = { selectedResolution = res },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedResolution == res) AccentIndigo else DarkCard
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(res.label, fontSize = 13.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Action Buttons: Save to Device, Share, Save to Google Drive
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Save to Device
            Button(
                onClick = {
                    val bmp = previewBitmap ?: return@Button
                    scope.launch {
                        isSaving = true
                        val savedUri = ImageExporter.saveToGallery(
                            context = context,
                            bitmap = bmp,
                            format = selectedFormat,
                            quality = selectedQuality,
                            resolution = selectedResolution
                        )
                        isSaving = false
                        if (savedUri != null) {
                            Toast.makeText(context, "Saved to Gallery!", Toast.LENGTH_SHORT).show()
                        } else {
                            Toast.makeText(context, "Failed to save photo.", Toast.LENGTH_SHORT).show()
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentIndigo),
                enabled = !isSaving
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Icon(Icons.Rounded.Download, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Save to Device", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
            }

            // Share via Android Sharesheet
            Button(
                onClick = {
                    val bmp = previewBitmap ?: return@Button
                    scope.launch {
                        ImageExporter.shareImage(
                            context = context,
                            bitmap = bmp,
                            format = selectedFormat,
                            quality = selectedQuality
                        )
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DarkCard)
            ) {
                Icon(Icons.Rounded.Share, null, tint = Color.White)
                Spacer(Modifier.width(8.dp))
                Text("Share with Friends", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color.White)
            }

            // Save to Google Drive
            Button(
                onClick = {
                    Toast.makeText(context, "Backing up to Google Drive...", Toast.LENGTH_SHORT).show()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DarkSurface)
            ) {
                Icon(Icons.Rounded.CloudUpload, null, tint = AccentCyan)
                Spacer(Modifier.width(8.dp))
                Text("Backup to Google Drive", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AccentCyan)
            }
        }

        Spacer(modifier = Modifier.height(36.dp))
    }
}
