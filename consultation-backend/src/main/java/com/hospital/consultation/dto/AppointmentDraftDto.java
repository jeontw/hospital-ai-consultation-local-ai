package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppointmentDraftDto {

    private boolean appointmentConfirmed;

    private String appointmentDateTime;

    private String purpose;

    private String status;

    private String memo;

    private String reason;
}
