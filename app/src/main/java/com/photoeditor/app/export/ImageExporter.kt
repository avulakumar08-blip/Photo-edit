package com.photoeditor.app.export

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

enum class ExportFormat(val extension: String, val mimeType: String, val compressFormat: Bitmap.CompressFormat) {
    JPG("jpg", "image/jpeg", Bitmap.CompressFormat.JPEG),
    PNG("png", "image/png", Bitmap.CompressFormat.PNG),
    WEBP("webp", "image/webp", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) Bitmap.CompressFormat.WEBP_LOSSY else Bitmap.CompressFormat.WEBP)
}

enum class ExportQuality(val label: String, val qualityPercent: Int) {
    STANDARD("Standard", 80),
    HIGH("High", 92),
    ULTRA("Ultra", 100)
}

enum class ExportResolution(val label: String, val maxDimension: Int?) {
    ORIGINAL("Original", null),
    HD_1080P("1080p", 1920),
    QHD_2K("2K", 2560),
    UHD_4K("4K", 3840)
}

object ImageExporter {

    suspend fun saveToGallery(
        context: Context,
        bitmap: Bitmap,
        format: ExportFormat = ExportFormat.JPG,
        quality: ExportQuality = ExportQuality.HIGH,
        resolution: ExportResolution = ExportResolution.ORIGINAL,
        fileName: String = "PhotoEditor_${System.currentTimeMillis()}"
    ): Uri? = withContext(Dispatchers.IO) {
        val targetBitmap = scaleBitmap(bitmap, resolution.maxDimension)
        val resolver = context.contentResolver
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, "$fileName.${format.extension}")
            put(MediaStore.MediaColumns.MIME_TYPE, format.mimeType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/PhotoEditor")
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
        }

        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
        if (uri != null) {
            try {
                val outputStream: OutputStream? = resolver.openOutputStream(uri)
                if (outputStream != null) {
                    targetBitmap.compress(format.compressFormat, quality.qualityPercent, outputStream)
                    outputStream.flush()
                    outputStream.close()
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    contentValues.clear()
                    contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                    resolver.update(uri, contentValues, null, null)
                }
                return@withContext uri
            } catch (e: Exception) {
                e.printStackTrace()
                resolver.delete(uri, null, null)
            }
        }
        null
    }

    suspend fun shareImage(
        context: Context,
        bitmap: Bitmap,
        format: ExportFormat = ExportFormat.JPG,
        quality: ExportQuality = ExportQuality.HIGH
    ) = withContext(Dispatchers.IO) {
        try {
            val cachePath = File(context.cacheDir, "images")
            cachePath.mkdirs()
            val file = File(cachePath, "shared_photo.${format.extension}")
            val stream = FileOutputStream(file)
            bitmap.compress(format.compressFormat, quality.qualityPercent, stream)
            stream.flush()
            stream.close()

            val contentUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = format.mimeType
                putExtra(Intent.EXTRA_STREAM, contentUri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            val chooser = Intent.createChooser(shareIntent, "Share Edited Photo")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun scaleBitmap(bitmap: Bitmap, maxDimension: Int?): Bitmap {
        if (maxDimension == null) return bitmap
        val width = bitmap.width
        val height = bitmap.height
        val currentMax = Math.max(width, height)
        if (currentMax <= maxDimension) return bitmap

        val scale = maxDimension.toFloat() / currentMax.toFloat()
        val targetWidth = (width * scale).toInt()
        val targetHeight = (height * scale).toInt()
        return Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
    }
}
