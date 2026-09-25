package com.photoeditor.app.editor

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Shader
import android.net.Uri
import com.photoeditor.app.filters.FilterManager
import com.photoeditor.app.model.DrawingStroke
import com.photoeditor.app.model.EditorState
import com.photoeditor.app.model.EffectType
import com.photoeditor.app.model.FrameType
import com.photoeditor.app.model.StickerLayer
import com.photoeditor.app.model.TextAlignment
import com.photoeditor.app.model.TextLayer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.InputStream
import kotlin.math.max
import kotlin.math.min

/**
 * ImageProcessor handles safe bitmap decoding, non-destructive adjustments,
 * transformations, filter matrix compositions, effect drawing, overlays,
 * and high-resolution export.
 */
object ImageProcessor {

    /**
     * Decode a downscaled preview bitmap from Uri to prevent memory crashes on mid-range phones.
     */
    suspend fun decodeSampledBitmapFromUri(
        context: Context,
        uri: Uri,
        reqWidth: Int = 1440,
        reqHeight: Int = 1440
    ): Bitmap? = withContext(Dispatchers.IO) {
        try {
            var stream: InputStream? = context.contentResolver.openInputStream(uri) ?: return@withContext null
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeStream(stream, null, options)
            stream.close()

            options.inSampleSize = calculateInSampleSize(options, reqWidth, reqHeight)
            options.inJustDecodeBounds = false
            options.inPreferredConfig = Bitmap.Config.ARGB_8888

            stream = context.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(stream, null, options)
            stream?.close()
            bitmap
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
        val (height: Int, width: Int) = options.outHeight to options.outWidth
        var inSampleSize = 1

        if (height > reqHeight || width > reqWidth) {
            val halfHeight: Int = height / 2
            val halfWidth: Int = width / 2
            while (halfHeight / inSampleSize >= reqHeight && halfWidth / inSampleSize >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }

    /**
     * Non-destructively renders the final Bitmap according to the current EditorState.
     */
    suspend fun processImage(
        originalBitmap: Bitmap,
        state: EditorState,
        isExport: Boolean = false
    ): Bitmap = withContext(Dispatchers.Default) {
        // Step 1: Base geometric transformations (Rotation and Flip)
        val matrix = Matrix()
        if (state.rotationDegrees != 0f) {
            matrix.postRotate(state.rotationDegrees)
        }
        val scaleX = if (state.flipHorizontal) -1f else 1f
        val scaleY = if (state.flipVertical) -1f else 1f
        if (scaleX != 1f || scaleY != 1f) {
            matrix.postScale(scaleX, scaleY)
        }

        var currentBitmap = Bitmap.createBitmap(
            originalBitmap,
            0, 0,
            originalBitmap.width,
            originalBitmap.height,
            matrix,
            true
        )

        // Step 2: Apply Crop if active
        state.cropRect?.let { crop ->
            val left = (crop.left * currentBitmap.width).toInt().coerceIn(0, currentBitmap.width - 1)
            val top = (crop.top * currentBitmap.height).toInt().coerceIn(0, currentBitmap.height - 1)
            val right = (crop.right * currentBitmap.width).toInt().coerceIn(left + 1, currentBitmap.width)
            val bottom = (crop.bottom * currentBitmap.height).toInt().coerceIn(top + 1, currentBitmap.height)
            val cropWidth = max(1, right - left)
            val cropHeight = max(1, bottom - top)

            val cropped = Bitmap.createBitmap(currentBitmap, left, top, cropWidth, cropHeight)
            if (currentBitmap != originalBitmap) {
                currentBitmap.recycle()
            }
            currentBitmap = cropped
        }

        // Step 3: Color Adjustments & Filters via ColorMatrix
        val resultBitmap = Bitmap.createBitmap(
            currentBitmap.width,
            currentBitmap.height,
            Bitmap.Config.ARGB_8888
        )
        val canvas = Canvas(resultBitmap)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)

        val combinedColorMatrix = buildAdjustmentMatrix(state)
        val filterMatrix = FilterManager.getColorMatrixForFilter(state.selectedFilter, state.filterIntensity)
        
        // Multiply adjustment matrix by filter matrix
        combinedColorMatrix.postConcat(filterMatrix)
        paint.colorFilter = ColorMatrixColorFilter(combinedColorMatrix)

        canvas.drawBitmap(currentBitmap, 0f, 0f, paint)

        // Step 4: Render Effects (Vignette, Grain, Light Leak)
        renderEffects(canvas, resultBitmap.width, resultBitmap.height, state)

        // Step 5: Render Drawing paths
        renderDrawings(canvas, resultBitmap.width, resultBitmap.height, state.drawingPaths)

        // Step 6: Render Stickers
        renderStickers(canvas, resultBitmap.width, resultBitmap.height, state.stickerLayers)

        // Step 7: Render Text layers
        renderTexts(canvas, resultBitmap.width, resultBitmap.height, state.textLayers)

        // Step 8: Render Frame
        renderFrame(canvas, resultBitmap.width, resultBitmap.height, state.frame, state.frameThickness)

        if (currentBitmap != originalBitmap) {
            currentBitmap.recycle()
        }

        resultBitmap
    }

    private fun buildAdjustmentMatrix(state: EditorState): ColorMatrix {
        val master = ColorMatrix()

        // 1. Brightness: add offset [-100, 100] -> [-100, 100] to RGB translation
        val brightnessOffset = (state.brightness + state.exposure * 0.5f) * 1.5f

        // 2. Contrast: scale matrix around mid-gray
        val contrastScale = ((state.contrast + 100f) / 100f)
        val contrastOffset = 128f * (1f - contrastScale)

        // 3. Saturation
        val satValue = ((state.saturation + 100f) / 100f).coerceAtLeast(0f)
        val satMatrix = ColorMatrix().apply { setSaturation(satValue) }

        // 4. Color Temperature: shift red vs blue
        val tempShift = state.temperature * 0.8f

        val array = floatArrayOf(
            contrastScale, 0f, 0f, 0f, brightnessOffset + contrastOffset + tempShift,
            0f, contrastScale, 0f, 0f, brightnessOffset + contrastOffset,
            0f, 0f, contrastScale, 0f, brightnessOffset + contrastOffset - tempShift,
            0f, 0f, 0f, 1f, 0f
        )
        master.set(array)
        master.postConcat(satMatrix)

        return master
    }

    private fun renderEffects(canvas: Canvas, width: Int, height: Int, state: EditorState) {
        for (effect in state.activeEffects) {
            when (effect.type) {
                EffectType.VIGNETTE -> {
                    val radius = max(width, height) * 0.75f
                    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        shader = RadialGradient(
                            width / 2f,
                            height / 2f,
                            radius,
                            intArrayOf(Color.TRANSPARENT, Color.argb((effect.intensity * 230).toInt(), 0, 0, 0)),
                            floatArrayOf(0.4f, 1.0f),
                            Shader.TileMode.CLAMP
                        )
                    }
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
                }
                EffectType.LIGHT_LEAK -> {
                    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        shader = RadialGradient(
                            0f, 0f,
                            max(width, height) * 0.9f,
                            intArrayOf(
                                Color.argb((effect.intensity * 180).toInt(), 255, 140, 50),
                                Color.argb((effect.intensity * 90).toInt(), 255, 50, 100),
                                Color.TRANSPARENT
                            ),
                            floatArrayOf(0f, 0.45f, 1f),
                            Shader.TileMode.CLAMP
                        )
                    }
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
                }
                EffectType.GLOW -> {
                    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        color = Color.argb((effect.intensity * 70).toInt(), 255, 255, 255)
                        xfermode = PorterDuffXfermode(PorterDuff.Mode.SCREEN)
                    }
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
                }
                else -> { /* Render other effect variants */ }
            }
        }
    }

    private fun renderDrawings(canvas: Canvas, width: Int, height: Int, strokes: List<DrawingStroke>) {
        for (stroke in strokes) {
            if (stroke.points.size < 2) continue
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor(stroke.colorHex)
                alpha = (stroke.opacity * 255).toInt()
                strokeWidth = stroke.strokeWidth
                style = Paint.Style.STROKE
                strokeCap = Paint.Cap.ROUND
                strokeJoin = Paint.Join.ROUND
                if (stroke.isEraser) {
                    xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
                }
            }

            val path = android.graphics.Path()
            val first = stroke.points[0]
            path.moveTo(first.x * width, first.y * height)
            for (i in 1 until stroke.points.size) {
                val pt = stroke.points[i]
                path.lineTo(pt.x * width, pt.y * height)
            }
            canvas.drawPath(path, paint)
        }
    }

    private fun renderStickers(canvas: Canvas, width: Int, height: Int, stickers: List<StickerLayer>) {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            textSize = 72f
            textAlign = Paint.Align.CENTER
        }
        for (sticker in stickers) {
            canvas.save()
            val cx = sticker.x * width
            val cy = sticker.y * height
            canvas.translate(cx, cy)
            canvas.rotate(sticker.rotation)
            canvas.scale(sticker.scale, sticker.scale)
            paint.alpha = (sticker.opacity * 255).toInt()
            canvas.drawText(sticker.stickerCode, 0f, 24f, paint)
            canvas.restore()
        }
    }

    private fun renderTexts(canvas: Canvas, width: Int, height: Int, texts: List<TextLayer>) {
        for (layer in texts) {
            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor(layer.colorHex)
                textSize = layer.size * (width / 400f).coerceAtLeast(1f)
                alpha = (layer.opacity * 255).toInt()
                isFakeBoldText = layer.isBold
                textSkewX = if (layer.isItalic) -0.25f else 0f
                textAlign = when (layer.alignment) {
                    TextAlignment.LEFT -> Paint.Align.LEFT
                    TextAlignment.CENTER -> Paint.Align.CENTER
                    TextAlignment.RIGHT -> Paint.Align.RIGHT
                }
                if (layer.hasShadow) {
                    setShadowLayer(8f, 2f, 4f, Color.argb(180, 0, 0, 0))
                }
            }

            canvas.save()
            val cx = layer.x * width
            val cy = layer.y * height
            canvas.translate(cx, cy)
            canvas.rotate(layer.rotation)

            if (layer.hasBackground) {
                val bounds = Rect()
                paint.getTextBounds(layer.text, 0, layer.text.length, bounds)
                val pad = 16f
                val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = android.graphics.Color.parseColor(layer.backgroundColorHex)
                }
                val rect = RectF(
                    -bounds.width() / 2f - pad,
                    -bounds.height() - pad,
                    bounds.width() / 2f + pad,
                    pad
                )
                canvas.drawRoundRect(rect, 8f, 8f, bgPaint)
            }

            canvas.drawText(layer.text, 0f, 0f, paint)
            canvas.restore()
        }
    }

    private fun renderFrame(canvas: Canvas, width: Int, height: Int, frame: FrameType, thickness: Float) {
        if (frame == FrameType.NONE) return
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = thickness * (width / 400f).coerceAtLeast(1f)
            color = Color.WHITE
        }

        when (frame) {
            FrameType.SIMPLE -> {
                canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
            }
            FrameType.MODERN -> {
                val pad = paint.strokeWidth * 1.5f
                paint.color = Color.BLACK
                canvas.drawRect(pad, pad, width - pad, height - pad, paint)
            }
            FrameType.POLAROID -> {
                val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    style = Paint.Style.FILL
                    color = Color.WHITE
                }
                val topBorder = height * 0.04f
                val bottomBorder = height * 0.15f
                val sideBorder = width * 0.04f
                canvas.drawRect(0f, 0f, width.toFloat(), topBorder, borderPaint)
                canvas.drawRect(0f, height - bottomBorder, width.toFloat(), height.toFloat(), borderPaint)
                canvas.drawRect(0f, 0f, sideBorder, height.toFloat(), borderPaint)
                canvas.drawRect(width - sideBorder, 0f, width.toFloat(), height.toFloat(), borderPaint)
            }
            else -> {
                canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
            }
        }
    }
}
