package com.photoeditor.app.ui.screens

import android.graphics.Bitmap
import android.graphics.RectF
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Redo
import androidx.compose.material.icons.automirrored.rounded.Undo
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Brush
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Crop
import androidx.compose.material.icons.rounded.CropRotate
import androidx.compose.material.icons.rounded.FilterHdr
import androidx.compose.material.icons.rounded.Flip
import androidx.compose.material.icons.rounded.FormatShapes
import androidx.compose.material.icons.rounded.Mood
import androidx.compose.material.icons.rounded.PhotoSizeSelectActual
import androidx.compose.material.icons.rounded.Rotate90DegreesCw
import androidx.compose.material.icons.rounded.TextFields
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.WbSunny
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.photoeditor.app.editor.EditorToolTab
import com.photoeditor.app.editor.EditorViewModel
import com.photoeditor.app.model.AspectRatio
import com.photoeditor.app.model.EffectType
import com.photoeditor.app.model.FilterType
import com.photoeditor.app.model.FrameType
import com.photoeditor.app.ui.theme.AccentCyan
import com.photoeditor.app.ui.theme.AccentIndigo
import com.photoeditor.app.ui.theme.DarkCard
import com.photoeditor.app.ui.theme.DarkCanvasBg
import com.photoeditor.app.ui.theme.DarkSurface

data class ToolBarItem(val tab: EditorToolTab, val title: String, val icon: ImageVector)

@Composable
fun EditorScreen(
    viewModel: EditorViewModel,
    onNavigateToExport: () -> Unit,
    onBack: () -> Unit
) {
    val editorState by viewModel.editorState.collectAsState()
    val originalBitmap by viewModel.originalBitmap.collectAsState()
    val previewBitmap by viewModel.previewBitmap.collectAsState()
    val activeTab by viewModel.activeTab.collectAsState()
    val isProcessing by viewModel.isProcessing.collectAsState()
    val canUndo by viewModel.canUndo.collectAsState()
    val canRedo by viewModel.canRedo.collectAsState()

    var showCompareOriginal by remember { mutableStateOf(false) }
    var aiDialogMessage by remember { mutableStateOf<String?>(null) }

    val toolbarItems = listOf(
        ToolBarItem(EditorToolTab.CROP, "Crop", Icons.Rounded.Crop),
        ToolBarItem(EditorToolTab.ADJUST, "Adjust", Icons.Rounded.Tune),
        ToolBarItem(EditorToolTab.FILTERS, "Filters", Icons.Rounded.FilterHdr),
        ToolBarItem(EditorToolTab.EFFECTS, "Effects", Icons.Rounded.WbSunny),
        ToolBarItem(EditorToolTab.TEXT, "Text", Icons.Rounded.TextFields),
        ToolBarItem(EditorToolTab.STICKERS, "Stickers", Icons.Rounded.Mood),
        ToolBarItem(EditorToolTab.DRAW, "Draw", Icons.Rounded.Brush),
        ToolBarItem(EditorToolTab.BLUR, "Blur", Icons.Rounded.CropRotate),
        ToolBarItem(EditorToolTab.FRAMES, "Frames", Icons.Rounded.FormatShapes),
        ToolBarItem(EditorToolTab.AI, "AI Tools", Icons.Rounded.AutoAwesome)
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkCanvasBg)
    ) {
        // TOP BAR: Back, Undo, Redo, Preview (hold), Save
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
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

            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(
                    onClick = { viewModel.undo() },
                    enabled = canUndo
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.Undo,
                        contentDescription = "Undo",
                        tint = if (canUndo) Color.White else Color.Gray.copy(alpha = 0.4f)
                    )
                }

                IconButton(
                    onClick = { viewModel.redo() },
                    enabled = canRedo
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.Redo,
                        contentDescription = "Redo",
                        tint = if (canRedo) Color.White else Color.Gray.copy(alpha = 0.4f)
                    )
                }

                // Hold to compare with original
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (showCompareOriginal) AccentIndigo else DarkSurface)
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    showCompareOriginal = true
                                    tryAwaitRelease()
                                    showCompareOriginal = false
                                }
                            )
                        }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.Visibility,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (showCompareOriginal) "Original" else "Compare",
                            fontSize = 12.sp,
                            color = Color.White
                        )
                    }
                }
            }

            // Export / Save button
            Button(
                onClick = onNavigateToExport,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AccentIndigo),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Text("Export", fontWeight = FontWeight.Bold)
            }
        }

        // CENTER: Large photo canvas
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            val displayBitmap: Bitmap? = if (showCompareOriginal) originalBitmap else previewBitmap

            if (displayBitmap != null) {
                Image(
                    bitmap = displayBitmap.asImageBitmap(),
                    contentDescription = "Photo Canvas",
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(8.dp)
                )
            } else {
                CircularProgressIndicator(color = AccentIndigo)
            }

            if (isProcessing) {
                CircularProgressIndicator(
                    color = AccentCyan,
                    modifier = Modifier
                        .size(32.dp)
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                )
            }
        }

        // BOTTOM: Active Tool Panel + Scrollable editing toolbar
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(DarkSurface)
        ) {
            // Contextual Tool Sub-Panel
            when (activeTab) {
                EditorToolTab.CROP -> CropControlPanel(
                    onRotate = { viewModel.rotate90(true) },
                    onFlipH = { viewModel.flipHorizontal() },
                    onFlipV = { viewModel.flipVertical() },
                    onApplyCrop = { rect -> viewModel.applyCrop(rect) },
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.ADJUST -> AdjustControlPanel(
                    viewModel = viewModel,
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.FILTERS -> FilterControlPanel(
                    viewModel = viewModel,
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.EFFECTS -> EffectControlPanel(
                    viewModel = viewModel,
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.TEXT -> TextControlPanel(
                    viewModel = viewModel,
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.STICKERS -> StickerControlPanel(
                    viewModel = viewModel,
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.FRAMES -> FrameControlPanel(
                    viewModel = viewModel,
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                EditorToolTab.AI -> AiControlPanel(
                    onShowAiNotice = { message -> aiDialogMessage = message },
                    onClose = { viewModel.setActiveTab(EditorToolTab.NONE) }
                )
                else -> { /* Toolbar visible */ }
            }

            // Scrollable Main Toolbar
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                contentPadding = PaddingValues(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(toolbarItems) { item ->
                    val isSelected = activeTab == item.tab
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.setActiveTab(if (isSelected) EditorToolTab.NONE else item.tab)
                            }
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(
                                    if (isSelected) AccentIndigo else DarkCard,
                                    RoundedCornerShape(12.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.title,
                                tint = if (isSelected) Color.White else Color.LightGray,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = item.title,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) AccentIndigo else Color.LightGray
                        )
                    }
                }
            }
        }
    }

    // AI Status Notice Dialog
    if (aiDialogMessage != null) {
        AlertDialog(
            onDismissRequest = { aiDialogMessage = null },
            title = { Text("AI Tools Status") },
            text = { Text(aiDialogMessage ?: "") },
            confirmButton = {
                TextButton(onClick = { aiDialogMessage = null }) {
                    Text("OK", color = AccentIndigo)
                }
            },
            containerColor = DarkCard,
            titleContentColor = Color.White,
            textContentColor = Color.LightGray
        )
    }
}

@Composable
fun CropControlPanel(
    onRotate: () -> Unit,
    onFlipH: () -> Unit,
    onFlipV: () -> Unit,
    onApplyCrop: (RectF) -> Unit,
    onClose: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Crop & Transform", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            TextButton(onClick = onRotate) {
                Icon(Icons.Rounded.Rotate90DegreesCw, null, tint = Color.White)
                Spacer(Modifier.width(4.dp))
                Text("Rotate 90°", color = Color.White)
            }
            TextButton(onClick = onFlipH) {
                Icon(Icons.Rounded.Flip, null, tint = Color.White)
                Spacer(Modifier.width(4.dp))
                Text("Flip H", color = Color.White)
            }
            TextButton(onClick = onFlipV) {
                Icon(Icons.Rounded.Flip, null, tint = Color.White)
                Spacer(Modifier.width(4.dp))
                Text("Flip V", color = Color.White)
            }
        }
    }
}

@Composable
fun AdjustControlPanel(viewModel: EditorViewModel, onClose: () -> Unit) {
    val state by viewModel.editorState.collectAsState()
    var selectedParam by remember { mutableStateOf("Brightness") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Adjustments: $selectedParam", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        val currentValue = when (selectedParam) {
            "Brightness" -> state.brightness
            "Contrast" -> state.contrast
            "Saturation" -> state.saturation
            "Exposure" -> state.exposure
            "Highlights" -> state.highlights
            "Shadows" -> state.shadows
            "Temperature" -> state.temperature
            else -> 0f
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("-100", fontSize = 12.sp, color = Color.Gray)
            Slider(
                value = currentValue,
                onValueChange = { newVal ->
                    when (selectedParam) {
                        "Brightness" -> viewModel.updateAdjustment(brightness = newVal)
                        "Contrast" -> viewModel.updateAdjustment(contrast = newVal)
                        "Saturation" -> viewModel.updateAdjustment(saturation = newVal)
                        "Exposure" -> viewModel.updateAdjustment(exposure = newVal)
                        "Highlights" -> viewModel.updateAdjustment(highlights = newVal)
                        "Shadows" -> viewModel.updateAdjustment(shadows = newVal)
                        "Temperature" -> viewModel.updateAdjustment(temperature = newVal)
                    }
                },
                onValueChangeFinished = { viewModel.commitAdjustmentChange() },
                valueRange = -100f..100f,
                modifier = Modifier.weight(1f).padding(horizontal = 8.dp),
                colors = SliderDefaults.colors(
                    thumbColor = AccentIndigo,
                    activeTrackColor = AccentIndigo
                )
            )
            Text("+100", fontSize = 12.sp, color = Color.Gray)
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        ) {
            val params = listOf("Brightness", "Contrast", "Saturation", "Exposure", "Highlights", "Shadows", "Temperature")
            items(params) { param ->
                Button(
                    onClick = { selectedParam = param },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (selectedParam == param) AccentIndigo else DarkCard
                    ),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Text(param, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun FilterControlPanel(viewModel: EditorViewModel, onClose: () -> Unit) {
    val state by viewModel.editorState.collectAsState()

    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Filters (${state.selectedFilter.displayName})", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        // Intensity slider if filter is not original
        if (state.selectedFilter != FilterType.ORIGINAL) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Intensity", fontSize = 12.sp, color = Color.Gray)
                Slider(
                    value = state.filterIntensity,
                    onValueChange = { viewModel.setFilterIntensity(it) },
                    valueRange = 0f..1f,
                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp),
                    colors = SliderDefaults.colors(thumbColor = AccentCyan, activeTrackColor = AccentCyan)
                )
                Text("${(state.filterIntensity * 100).toInt()}%", fontSize = 12.sp, color = Color.White)
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        ) {
            items(FilterType.values()) { filter ->
                val isSelected = state.selectedFilter == filter
                Button(
                    onClick = { viewModel.setFilter(filter) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) AccentCyan else DarkCard
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(filter.displayName, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun EffectControlPanel(viewModel: EditorViewModel, onClose: () -> Unit) {
    val state by viewModel.editorState.collectAsState()

    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Special Effects", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        ) {
            items(EffectType.values()) { effect ->
                val isActive = state.activeEffects.any { it.type == effect }
                Button(
                    onClick = { viewModel.toggleEffect(effect) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isActive) AccentIndigo else DarkCard
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(effect.title, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun TextControlPanel(viewModel: EditorViewModel, onClose: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Text Tool", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        Button(
            onClick = { viewModel.addTextLayer("Tap to edit") },
            colors = ButtonDefaults.buttonColors(containerColor = AccentIndigo),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("+ Add Text Box")
        }
    }
}

@Composable
fun StickerControlPanel(viewModel: EditorViewModel, onClose: () -> Unit) {
    val stickers = listOf("✨", "❤️", "🔥", "🎉", "🌟", "🕶️", "🍕", "🏖️", "✈️", "💯", "🎈", "🌸")
    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Stickers", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
        ) {
            items(stickers) { sticker ->
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(DarkCard, RoundedCornerShape(12.dp))
                        .clickable { viewModel.addSticker(sticker) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(sticker, fontSize = 24.sp)
                }
            }
        }
    }
}

@Composable
fun FrameControlPanel(viewModel: EditorViewModel, onClose: () -> Unit) {
    val state by viewModel.editorState.collectAsState()

    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Borders & Frames", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
        ) {
            items(FrameType.values()) { frame ->
                val isSelected = state.frame == frame
                Button(
                    onClick = { viewModel.setFrame(frame) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) AccentCyan else DarkCard
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(frame.title, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun AiControlPanel(onShowAiNotice: (String) -> Unit, onClose: () -> Unit) {
    val aiTools = listOf(
        "AI Background Remover",
        "AI Object Remover",
        "AI Enhance",
        "AI Upscale",
        "AI Background Replacement",
        "AI Portrait Enhancement"
    )

    Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("AI Tools (Future-Ready)", fontWeight = FontWeight.Bold, color = Color.White)
            IconButton(onClick = onClose) {
                Icon(Icons.Rounded.Check, "Done", tint = AccentCyan)
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth().padding(top = 6.dp)
        ) {
            items(aiTools) { tool ->
                Button(
                    onClick = {
                        onShowAiNotice("AI service not configured.\nPlease configure a Gemini API key or model backend in Settings before using $tool.")
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = DarkCard),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Rounded.AutoAwesome, null, modifier = Modifier.size(16.dp), tint = AccentCyan)
                    Spacer(Modifier.width(6.dp))
                    Text(tool, fontSize = 12.sp)
                }
            }
        }
    }
}
