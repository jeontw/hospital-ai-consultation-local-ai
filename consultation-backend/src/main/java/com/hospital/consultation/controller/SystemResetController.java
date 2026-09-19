package com.hospital.consultation.controller;

import com.hospital.consultation.service.ExperimentResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/system")
public class SystemResetController {

    private final ExperimentResetService experimentResetService;

    @DeleteMapping("/experiment-data")
    public Map<String, Object> resetExperimentData() {
        ExperimentResetService.ResetResult result = experimentResetService.resetExperimentData();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "실험 데이터가 초기화되었습니다. 환자와 의사 목록은 유지됩니다.");
        response.put("deletedAppointments", result.deletedAppointments());
        response.put("deletedConsultations", result.deletedConsultations());
        response.put("deletedAiAnalyses", result.deletedAiAnalyses());
        response.put("patientsPreserved", true);
        response.put("doctorsPreserved", true);
        return response;
    }
}
