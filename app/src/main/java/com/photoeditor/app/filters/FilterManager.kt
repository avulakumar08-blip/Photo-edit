package com.photoeditor.app.filters

import android.graphics.ColorMatrix
import com.photoeditor.app.model.FilterType

/**
 * FilterManager produces ColorMatrix objects corresponding to classic and cinematic
 * photographic filter profiles.
 */
object FilterManager {

    fun getColorMatrixForFilter(filter: FilterType, intensity: Float = 1.0f): ColorMatrix {
        val baseMatrix = when (filter) {
            FilterType.ORIGINAL -> ColorMatrix()
            FilterType.NATURAL -> createNaturalMatrix()
            FilterType.PORTRAIT -> createPortraitMatrix()
            FilterType.CINEMATIC -> createCinematicMatrix()
            FilterType.VINTAGE -> createVintageMatrix()
            FilterType.WARM -> createWarmMatrix()
            FilterType.COOL -> createCoolMatrix()
            FilterType.BLACK_WHITE -> createBlackAndWhiteMatrix()
            FilterType.DRAMATIC -> createDramaticMatrix()
        }

        if (intensity >= 0.99f || filter == FilterType.ORIGINAL) {
            return baseMatrix
        }

        // Blend with identity matrix based on intensity
        val identity = ColorMatrix()
        val baseArray = baseMatrix.array
        val identArray = identity.array
        val resultArray = FloatArray(20)

        for (i in 0 until 20) {
            resultArray[i] = identArray[i] + (baseArray[i] - identArray[i]) * intensity
        }

        return ColorMatrix(resultArray)
    }

    private fun createNaturalMatrix(): ColorMatrix {
        val cm = ColorMatrix()
        cm.setSaturation(1.15f)
        val array = cm.array
        array[0] = 1.05f
        array[6] = 1.02f
        array[12] = 0.98f
        return ColorMatrix(array)
    }

    private fun createPortraitMatrix(): ColorMatrix {
        val cm = ColorMatrix()
        cm.setSaturation(1.08f)
        val array = cm.array
        array[0] = 1.08f  // Slight warm red for healthy skin tone
        array[6] = 1.02f
        array[12] = 0.95f
        array[4] = 8f    // gentle lift
        return ColorMatrix(array)
    }

    private fun createCinematicMatrix(): ColorMatrix {
        // Teal & Orange cinematic look
        return ColorMatrix(floatArrayOf(
            1.15f, 0.05f, 0.00f, 0.0f, 5.0f,
            0.00f, 1.05f, 0.05f, 0.0f, 0.0f,
            0.05f, 0.10f, 1.25f, 0.0f, 12.0f,
            0.00f, 0.00f, 0.00f, 1.0f, 0.0f
        ))
    }

    private fun createVintageMatrix(): ColorMatrix {
        // Sepia & aged film look
        return ColorMatrix(floatArrayOf(
            0.393f * 1.2f, 0.769f, 0.189f, 0.0f, 15.0f,
            0.349f, 0.686f * 1.1f, 0.168f, 0.0f, 10.0f,
            0.272f, 0.534f, 0.131f * 1.3f, 0.0f, 5.0f,
            0.000f, 0.000f, 0.000f, 1.0f, 0.0f
        ))
    }

    private fun createWarmMatrix(): ColorMatrix {
        return ColorMatrix(floatArrayOf(
            1.20f, 0.00f, 0.00f, 0.0f, 15.0f,
            0.00f, 1.05f, 0.00f, 0.0f, 5.0f,
            0.00f, 0.00f, 0.85f, 0.0f, -10.0f,
            0.00f, 0.00f, 0.00f, 1.0f, 0.0f
        ))
    }

    private fun createCoolMatrix(): ColorMatrix {
        return ColorMatrix(floatArrayOf(
            0.88f, 0.00f, 0.00f, 0.0f, -10.0f,
            0.00f, 0.98f, 0.00f, 0.0f, 0.0f,
            0.00f, 0.00f, 1.25f, 0.0f, 18.0f,
            0.00f, 0.00f, 0.00f, 1.0f, 0.0f
        ))
    }

    private fun createBlackAndWhiteMatrix(): ColorMatrix {
        val cm = ColorMatrix()
        cm.setSaturation(0.0f)
        // High contrast B&W
        val array = cm.array
        for (i in 0..14) {
            array[i] *= 1.25f
        }
        array[4] -= 15f
        array[9] -= 15f
        array[14] -= 15f
        return ColorMatrix(array)
    }

    private fun createDramaticMatrix(): ColorMatrix {
        return ColorMatrix(floatArrayOf(
            1.40f, 0.00f, 0.00f, 0.0f, -25.0f,
            0.00f, 1.35f, 0.00f, 0.0f, -25.0f,
            0.00f, 0.00f, 1.45f, 0.0f, -20.0f,
            0.00f, 0.00f, 0.00f, 1.0f, 0.0f
        ))
    }
}
