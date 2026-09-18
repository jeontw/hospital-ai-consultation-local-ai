package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoctorBriefingUpdateDto {

    private String visitReason;

    private String mainSymptoms;

    private String specialNotes;

    private String attentionLevel;
}
