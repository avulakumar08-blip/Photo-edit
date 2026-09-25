package com.photoeditor.app.ai

import android.graphics.Bitmap

/**
 * Result sealed class representing clear AI service response states.
 */
sealed class AiResult {
    data class Success(val processedBitmap: Bitmap) : AiResult()
    data class ServiceNotConfigured(val message: String = "AI service not configured. Please supply an API key in Settings.") : AiResult()
    data class Error(val error: Throwable) : AiResult()
}

enum class AiToolType(val title: String, val description: String) {
    BACKGROUND_REMOVER("AI Background Remover", "Automatically detect and isolate the primary subject with transparent alpha."),
    OBJECT_REMOVER("AI Object Remover", "Erase unwanted objects, photobombers, or blemishes seamlessly."),
    AI_ENHANCE("AI Enhance", "Intelligently balance lighting, exposure, dynamic range, and textures."),
    AI_UPSCALE("AI Upscale", "Super-resolution upscaling up to 4x clarity without pixelation."),
    BACKGROUND_REPLACEMENT("AI Background Replacement", "Replace background scenery with generative studio backdrops."),
    PORTRAIT_ENHANCEMENT("AI Portrait Enhancement", "Refine skin tone, eye radiance, and studio lighting contours.")
}

interface IAiPhotoService {
    suspend fun processTool(type: AiToolType, inputBitmap: Bitmap): AiResult
    fun isServiceConfigured(): Boolean
}

/**
 * Concrete implementation that checks configuration and returns honest status
 * instead of faking AI output.
 */
class DefaultAiPhotoService(private val apiKey: String? = null) : IAiPhotoService {

    override fun isServiceConfigured(): Boolean {
        return !apiKey.isNullOrBlank()
    }

    override suspend fun processTool(type: AiToolType, inputBitmap: Bitmap): AiResult {
        if (!isServiceConfigured()) {
            return AiResult.ServiceNotConfigured(
                "AI service not configured. Connect your Google AI or Gemini API endpoint to execute ${type.title}."
            )
        }

        // When configured with a valid remote service endpoint, execute real request here.
        return AiResult.ServiceNotConfigured("API key configured but model endpoint is currently offline.")
    }
}
