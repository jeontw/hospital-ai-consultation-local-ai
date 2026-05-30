package com.hospital.consultation.repository;

import com.hospital.consultation.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByConsultationId(Long consultationId);

    void deleteByConsultationId(Long consultationId);
}
