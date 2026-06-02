package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PatientCandidateDto {

    private Long id;

    private String name;

    private String phone;

    private String birth;
}
