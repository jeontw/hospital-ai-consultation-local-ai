package com.hospital.consultation.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiModelSettingsService {

    private static final List<String> ALLOWED_MODELS = List.of(
            "qwen2.5:3b",
            "qwen2.5:7b",
            "exaone3.5:7.8b"
    );

    private String currentModel;

    public AiModelSettingsService(@Value("${ollama.model:qwen2.5:7b}") String defaultModel) {
        if (!ALLOWED_MODELS.contains(defaultModel)) {
            throw new IllegalArgumentException("Unsupported Ollama model: " + defaultModel);
        }

        this.currentModel = defaultModel;
    }

    public String getCurrentModel() {
        return currentModel;
    }

    public List<String> getAllowedModels() {
        return ALLOWED_MODELS;
    }

    public void changeModel(String model) {
        if (!ALLOWED_MODELS.contains(model)) {
            throw new IllegalArgumentException("허용되지 않은 AI 모델입니다.");
        }

        currentModel = model;
    }
}
