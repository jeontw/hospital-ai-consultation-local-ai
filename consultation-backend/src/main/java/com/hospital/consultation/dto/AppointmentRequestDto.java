package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AppointmentRequestDto {

    private Long patientId;

    private Long consultationId;

    private Long doctorId;

    private LocalDateTime appointmentDate;

    private LocalDateTime appointmentDateTime;

    private String purpose;

    private String status;

    private String memo;
}
