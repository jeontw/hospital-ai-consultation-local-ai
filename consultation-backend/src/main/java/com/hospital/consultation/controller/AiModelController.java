package com.hospital.consultation.controller;

import com.hospital.consultation.service.AiModelSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ai/model")
public class AiModelController {

    private final AiModelSettingsService aiModelSettingsService;

    @GetMapping
    public Map<String, Object> getCurrentModel() {
        return Map.of(
                "model", aiModelSettingsService.getCurrentModel(),
                "allowedModels", aiModelSettingsService.getAllowedModels()
        );
    }

    @PostMapping
    public Map<String, Object> changeModel(@RequestBody Map<String, String> request) {
        try {
            aiModelSettingsService.changeModel(request.get("model"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        return getCurrentModel();
    }
}
