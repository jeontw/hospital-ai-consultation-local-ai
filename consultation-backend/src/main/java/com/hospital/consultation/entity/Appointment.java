package com.hospital.consultation.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    @JsonIgnoreProperties({"consultations"})
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "consultation_id")
    @JsonIgnoreProperties({"patient", "aiAnalysis"})
    private Consultation consultation;

    private LocalDateTime appointmentDateTime;

    private String purpose;

    private String status;

    @Column(columnDefinition = "TEXT")
    private String memo;

    private LocalDateTime createdAt;

    @JsonProperty("appointmentDate")
    public LocalDateTime getAppointmentDate() {
        return appointmentDateTime;
    }

    @JsonProperty("appointmentDate")
    public void setAppointmentDate(LocalDateTime appointmentDate) {
        this.appointmentDateTime = appointmentDate;
    }
}
