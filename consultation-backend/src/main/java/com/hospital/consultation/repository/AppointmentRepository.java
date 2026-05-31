package com.hospital.consultation.repository;

import com.hospital.consultation.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByConsultationId(Long consultationId);

    boolean existsByDoctorIdAndAppointmentDateTimeAndStatus(
            Long doctorId,
            LocalDateTime appointmentDateTime,
            String status
    );

    boolean existsByDoctorIdAndAppointmentDateTimeAndStatusAndIdNot(
            Long doctorId,
            LocalDateTime appointmentDateTime,
            String status,
            Long id
    );

    boolean existsByDoctorId(Long doctorId);

    void deleteByConsultationId(Long consultationId);
}
