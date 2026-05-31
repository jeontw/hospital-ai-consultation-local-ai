package com.hospital.consultation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "nurse_memo", columnDefinition = "TEXT")
    private String nurseMemo;

    @Column(columnDefinition = "LONGTEXT")
    @JsonIgnore
    private String speakerText;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "LONGTEXT")
    private String doctorBriefing;

    private String audioPath;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    @JsonIgnoreProperties({"consultations"})
    private Patient patient;

    @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL)
    @JsonIgnoreProperties({"consultation"})
    private AiAnalysis aiAnalysis;
}
