package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AiConsultationConfirmRequestDto {

    private Long patientId;

    private Long doctorId;

    private String originalText;

    private String nurseMemo;

    private String summary;

    private String symptoms;

    private String riskLevel;

    private String keywords;

    private LocalDateTime appointmentDate;

    private LocalDateTime appointmentDateTime;

    private String visitReason;

    private String status;
}
