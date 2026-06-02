package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiPatientExtractionDto {

    private String name;

    private String phone;

    private String phoneLast4;

    private String birth;
}
