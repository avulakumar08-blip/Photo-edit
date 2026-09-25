package com.photoeditor.app.drive

import android.graphics.Bitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Service for backing up and saving photos directly to Google Drive
 * using user-granted Drive OAuth permissions.
 */
object GoogleDriveService {

    suspend fun uploadPhotoToDrive(
        accessToken: String,
        bitmap: Bitmap,
        fileName: String = "PhotoEditor_${System.currentTimeMillis()}.jpg"
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val boundary = "======PhotoEditorBoundary" + System.currentTimeMillis()
            val url = URL("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.doInput = true
            conn.doOutput = true
            conn.useCaches = false
            conn.setRequestProperty("Authorization", "Bearer $accessToken")
            conn.setRequestProperty("Content-Type", "multipart/related; boundary=$boundary")

            val os: OutputStream = conn.outputStream
            val writer = os.bufferedWriter(Charsets.UTF_8)

            // 1. Metadata part
            writer.write("--$boundary\r\n")
            writer.write("Content-Type: application/json; charset=UTF-8\r\n\r\n")
            writer.write("{\"name\": \"$fileName\", \"mimeType\": \"image/jpeg\"}\r\n")
            writer.flush()

            // 2. Media part
            writer.write("--$boundary\r\n")
            writer.write("Content-Type: image/jpeg\r\n\r\n")
            writer.flush()

            val byteStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 92, byteStream)
            os.write(byteStream.toByteArray())
            os.flush()

            // Finish multipart
            writer.write("\r\n--$boundary--\r\n")
            writer.flush()
            writer.close()

            val responseCode = conn.responseCode
            if (responseCode in 200..299) {
                val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                Result.success(responseText)
            } else {
                val errorText = conn.errorStream?.bufferedReader()?.use { it.readText() } ?: "HTTP $responseCode"
                Result.failure(Exception("Drive upload failed: $errorText"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
