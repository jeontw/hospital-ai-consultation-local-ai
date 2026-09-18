package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiConsultationBundleDto {

    private String summary;

    private AiAnalysisResultDto analysis;

    private AiPatientExtractionDto patient;

    private AppointmentDraftDto appointment;
}
