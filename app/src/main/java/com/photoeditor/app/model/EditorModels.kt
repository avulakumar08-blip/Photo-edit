package com.photoeditor.app.model

import android.graphics.Bitmap
import android.graphics.RectF
import androidx.compose.ui.graphics.Color

/**
 * Non-destructive editor state containing all parameters needed to render
 * or re-render the final composition from the original image.
 */
data class EditorState(
    val originalUri: String = "",
    val cropRect: RectF? = null,
    val cropAspectRatio: AspectRatio = AspectRatio.ORIGINAL,
    val rotationDegrees: Float = 0f,
    val flipHorizontal: Boolean = false,
    val flipVertical: Boolean = false,
    
    // Core Adjustments (-100 to +100 range)
    val brightness: Float = 0f,
    val contrast: Float = 0f,
    val saturation: Float = 0f,
    val exposure: Float = 0f,
    val highlights: Float = 0f,
    val shadows: Float = 0f,
    val temperature: Float = 0f,
    val sharpness: Float = 0f,
    val blur: Float = 0f,
    
    // Filters & Effects
    val selectedFilter: FilterType = FilterType.ORIGINAL,
    val filterIntensity: Float = 1.0f,
    val activeEffects: List<EffectSetting> = emptyList(),
    
    // Overlays
    val textLayers: List<TextLayer> = emptyList(),
    val stickerLayers: List<StickerLayer> = emptyList(),
    val drawingPaths: List<DrawingStroke> = emptyList(),
    val frame: FrameType = FrameType.NONE,
    val frameThickness: Float = 12f
)

enum class AspectRatio(val label: String, val ratio: Float?) {
    FREE("Free", null),
    ORIGINAL("Original", null),
    SQUARE_1_1("1:1", 1.0f),
    PORTRAIT_4_5("4:5", 4f / 5f),
    LANDSCAPE_16_9("16:9", 16f / 9f),
    STORY_9_16("9:16", 9f / 16f)
}

enum class FilterType(val displayName: String, val category: String) {
    ORIGINAL("Original", "Basic"),
    NATURAL("Natural", "Natural"),
    PORTRAIT("Portrait", "Portrait"),
    CINEMATIC("Cinematic", "Cinematic"),
    VINTAGE("Vintage", "Vintage"),
    WARM("Warm", "Tone"),
    COOL("Cool", "Tone"),
    BLACK_WHITE("B&W", "Monochrome"),
    DRAMATIC("Dramatic", "Dramatic")
}

data class EffectSetting(
    val type: EffectType,
    val intensity: Float = 0.5f
)

enum class EffectType(val title: String) {
    GLOW("Glow"),
    GRAIN("Grain"),
    VIGNETTE("Vignette"),
    LIGHT_LEAK("Light Leak"),
    NOISE("Noise"),
    COLOR_OVERLAY("Color Overlay"),
    RADIAL_BLUR("Radial Blur")
}

data class TextLayer(
    val id: String = java.util.UUID.randomUUID().toString(),
    val text: String = "Double tap to edit",
    val x: Float = 0.5f,
    val y: Float = 0.5f,
    val size: Float = 28f,
    val colorHex: String = "#FFFFFF",
    val isBold: Boolean = false,
    val isItalic: Boolean = false,
    val hasBackground: Boolean = false,
    val backgroundColorHex: String = "#80000000",
    val opacity: Float = 1.0f,
    val rotation: Float = 0f,
    val alignment: TextAlignment = TextAlignment.CENTER,
    val hasShadow: Boolean = true,
    val hasOutline: Boolean = false
)

enum class TextAlignment { LEFT, CENTER, RIGHT }

data class StickerLayer(
    val id: String = java.util.UUID.randomUUID().toString(),
    val stickerCode: String = "✨",
    val category: StickerCategory = StickerCategory.EMOJI,
    val x: Float = 0.5f,
    val y: Float = 0.5f,
    val scale: Float = 1.0f,
    val rotation: Float = 0f,
    val opacity: Float = 1.0f
)

enum class StickerCategory(val label: String) {
    EMOJI("Emoji"),
    LOVE("Love"),
    TRAVEL("Travel"),
    FOOD("Food"),
    CELEBRATION("Celebration"),
    SOCIAL("Social"),
    SHAPES("Shapes"),
    DECORATIVE("Decorative")
}

data class DrawingStroke(
    val points: List<android.graphics.PointF>,
    val colorHex: String,
    val strokeWidth: Float,
    val opacity: Float,
    val isEraser: Boolean = false
)

enum class FrameType(val title: String) {
    NONE("None"),
    SIMPLE("Simple"),
    MODERN("Modern"),
    CLASSIC("Classic"),
    POLAROID("Polaroid"),
    SOCIAL_MEDIA("Social")
}

data class ProjectItem(
    val id: String,
    val title: String,
    val originalUri: String,
    val thumbnailPath: String? = null,
    val dateCreated: Long = System.currentTimeMillis(),
    val dateModified: Long = System.currentTimeMillis()
)
