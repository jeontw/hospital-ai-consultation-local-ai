package com.hospital.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AppointmentDraftDto {

    private Boolean needReservation;

    private String appointmentDate;

    private String appointmentDateTime;

    private String dateText;

    private String timeText;

    private String memo;

    private String status;

    private Boolean appointmentConfirmed;

    private String reason;

    private String purpose;
}
