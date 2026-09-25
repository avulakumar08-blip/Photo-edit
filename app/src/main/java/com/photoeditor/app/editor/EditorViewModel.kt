package com.photoeditor.app.editor

import android.graphics.Bitmap
import android.graphics.RectF
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.photoeditor.app.model.DrawingStroke
import com.photoeditor.app.model.EditorState
import com.photoeditor.app.model.EffectSetting
import com.photoeditor.app.model.EffectType
import com.photoeditor.app.model.FilterType
import com.photoeditor.app.model.FrameType
import com.photoeditor.app.model.StickerLayer
import com.photoeditor.app.model.TextLayer
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.ArrayDeque

enum class EditorToolTab {
    NONE,
    CROP,
    ADJUST,
    FILTERS,
    EFFECTS,
    TEXT,
    STICKERS,
    DRAW,
    BLUR,
    FRAMES,
    AI
}

class EditorViewModel : ViewModel() {

    private val _editorState = MutableStateFlow(EditorState())
    val editorState: StateFlow<EditorState> = _editorState.asStateFlow()

    private val _originalBitmap = MutableStateFlow<Bitmap?>(null)
    val originalBitmap: StateFlow<Bitmap?> = _originalBitmap.asStateFlow()

    private val _previewBitmap = MutableStateFlow<Bitmap?>(null)
    val previewBitmap: StateFlow<Bitmap?> = _previewBitmap.asStateFlow()

    private val _activeTab = MutableStateFlow(EditorToolTab.NONE)
    val activeTab: StateFlow<EditorToolTab> = _activeTab.asStateFlow()

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing: StateFlow<Boolean> = _isProcessing.asStateFlow()

    // Undo / Redo History Stacks
    private val undoStack = ArrayDeque<EditorState>()
    private val redoStack = ArrayDeque<EditorState>()

    val canUndo = MutableStateFlow(false)
    val canRedo = MutableStateFlow(false)

    fun setInitialImage(bitmap: Bitmap, uri: String = "") {
        _originalBitmap.value = bitmap
        _editorState.value = EditorState(originalUri = uri)
        undoStack.clear()
        redoStack.clear()
        updateHistoryButtons()
        triggerRender()
    }

    fun setActiveTab(tab: EditorToolTab) {
        _activeTab.value = tab
    }

    private fun pushHistory() {
        undoStack.push(_editorState.value.copy())
        redoStack.clear()
        updateHistoryButtons()
    }

    private fun updateHistoryButtons() {
        canUndo.value = undoStack.isNotEmpty()
        canRedo.value = redoStack.isNotEmpty()
    }

    fun undo() {
        if (undoStack.isNotEmpty()) {
            redoStack.push(_editorState.value.copy())
            val previousState = undoStack.pop()
            _editorState.value = previousState
            updateHistoryButtons()
            triggerRender()
        }
    }

    fun redo() {
        if (redoStack.isNotEmpty()) {
            undoStack.push(_editorState.value.copy())
            val nextState = redoStack.pop()
            _editorState.value = nextState
            updateHistoryButtons()
            triggerRender()
        }
    }

    // --- Adjustments ---
    fun updateAdjustment(
        brightness: Float? = null,
        contrast: Float? = null,
        saturation: Float? = null,
        exposure: Float? = null,
        highlights: Float? = null,
        shadows: Float? = null,
        temperature: Float? = null,
        sharpness: Float? = null,
        blur: Float? = null
    ) {
        _editorState.update { current ->
            current.copy(
                brightness = brightness ?: current.brightness,
                contrast = contrast ?: current.contrast,
                saturation = saturation ?: current.saturation,
                exposure = exposure ?: current.exposure,
                highlights = highlights ?: current.highlights,
                shadows = shadows ?: current.shadows,
                temperature = temperature ?: current.temperature,
                sharpness = sharpness ?: current.sharpness,
                blur = blur ?: current.blur
            )
        }
        triggerRender()
    }

    fun commitAdjustmentChange() {
        pushHistory()
    }

    // --- Crop, Rotate, Flip ---
    fun applyCrop(rect: RectF) {
        pushHistory()
        _editorState.update { it.copy(cropRect = rect) }
        triggerRender()
    }

    fun rotate90(clockwise: Boolean = true) {
        pushHistory()
        _editorState.update {
            val delta = if (clockwise) 90f else -90f
            val newRot = (it.rotationDegrees + delta) % 360f
            it.copy(rotationDegrees = if (newRot < 0f) newRot + 360f else newRot)
        }
        triggerRender()
    }

    fun flipHorizontal() {
        pushHistory()
        _editorState.update { it.copy(flipHorizontal = !it.flipHorizontal) }
        triggerRender()
    }

    fun flipVertical() {
        pushHistory()
        _editorState.update { it.copy(flipVertical = !it.flipVertical) }
        triggerRender()
    }

    // --- Filters ---
    fun setFilter(filter: FilterType, intensity: Float = 1.0f) {
        pushHistory()
        _editorState.update {
            it.copy(selectedFilter = filter, filterIntensity = intensity)
        }
        triggerRender()
    }

    fun setFilterIntensity(intensity: Float) {
        _editorState.update { it.copy(filterIntensity = intensity) }
        triggerRender()
    }

    // --- Effects ---
    fun toggleEffect(type: EffectType, intensity: Float = 0.6f) {
        pushHistory()
        _editorState.update { current ->
            val existing = current.activeEffects.find { it.type == type }
            val updated = if (existing != null) {
                current.activeEffects.filter { it.type != type }
            } else {
                current.activeEffects + EffectSetting(type, intensity)
            }
            current.copy(activeEffects = updated)
        }
        triggerRender()
    }

    // --- Text Layers ---
    fun addTextLayer(text: String = "Double tap to edit") {
        pushHistory()
        val newLayer = TextLayer(text = text)
        _editorState.update { it.copy(textLayers = it.textLayers + newLayer) }
        triggerRender()
    }

    fun updateTextLayer(layer: TextLayer) {
        _editorState.update { current ->
            val updated = current.textLayers.map { if (it.id == layer.id) layer else it }
            current.copy(textLayers = updated)
        }
        triggerRender()
    }

    fun removeTextLayer(layerId: String) {
        pushHistory()
        _editorState.update { current ->
            current.copy(textLayers = current.textLayers.filter { it.id != layerId })
        }
        triggerRender()
    }

    // --- Stickers ---
    fun addSticker(stickerCode: String) {
        pushHistory()
        val newSticker = StickerLayer(stickerCode = stickerCode)
        _editorState.update { it.copy(stickerLayers = it.stickerLayers + newSticker) }
        triggerRender()
    }

    // --- Drawing ---
    fun addDrawingStroke(stroke: DrawingStroke) {
        pushHistory()
        _editorState.update { it.copy(drawingPaths = it.drawingPaths + stroke) }
        triggerRender()
    }

    fun clearDrawings() {
        pushHistory()
        _editorState.update { it.copy(drawingPaths = emptyList()) }
        triggerRender()
    }

    // --- Frames ---
    fun setFrame(frame: FrameType, thickness: Float = 12f) {
        pushHistory()
        _editorState.update { it.copy(frame = frame, frameThickness = thickness) }
        triggerRender()
    }

    private fun triggerRender() {
        val original = _originalBitmap.value ?: return
        viewModelScope.launch {
            _isProcessing.value = true
            val rendered = ImageProcessor.processImage(original, _editorState.value)
            _previewBitmap.value = rendered
            _isProcessing.value = false
        }
    }
}
