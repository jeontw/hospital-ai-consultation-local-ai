package com.hospital.consultation.dto;

import com.hospital.consultation.entity.Appointment;
import com.hospital.consultation.entity.Consultation;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiConsultationConfirmResponseDto {

    private Consultation consultation;

    private Appointment appointment;
}
