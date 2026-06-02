package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AiConsultationPreviewDto {

    private String originalText;

    private String nurseMemo;

    private String summary;

    private String audioPath;

    private List<String> symptoms;

    private String riskLevel;

    private List<String> keywords;

    private String extractedPatientName;

    private String extractedPhone;

    private String extractedPhoneLast4;

    private String extractedBirth;

    private List<PatientCandidateDto> patientCandidates;

    private Long recommendedPatientId;

    private String recommendedPatientName;

    private String patientRecommendationReason;

    private String appointmentDate;

    private String visitReason;

    private String status;

    private Long recommendedDoctorId;

    private String recommendedDoctorName;

    private String doctorRecommendationReason;
}
