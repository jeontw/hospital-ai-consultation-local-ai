package com.hospital.consultation.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConsultationRequestDto {

    private String originalText;

    private String nurseMemo;

    private String audioPath;

}
