package com.hospital.consultation.controller;

import com.hospital.consultation.entity.Patient;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import com.hospital.consultation.repository.PatientRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;

    @PostMapping
    public Patient createPatient(@RequestBody Patient patient) {
        patient.setCreatedAt(LocalDateTime.now());
        return patientRepository.save(patient);
    }

    @GetMapping
    public List<Patient> getPatients() {
        return patientRepository.findAll();
    }

    @PutMapping("/{patientId}")
    public Patient updatePatient(
            @PathVariable Long patientId,
            @RequestBody Patient requestPatient
    ) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

        patient.setName(requestPatient.getName());
        patient.setPhone(requestPatient.getPhone());
        patient.setBirth(requestPatient.getBirth());

        return patientRepository.save(patient);
    }
    @DeleteMapping("/{patientId}")
    @Transactional
    public void deletePatient(@PathVariable Long patientId) {

        System.out.println("삭제 요청 환자 ID: " + patientId);

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

        appointmentRepository.deleteByPatientId(patientId);
        consultationRepository.deleteByPatientId(patientId);
        patientRepository.delete(patient);
    }
}
