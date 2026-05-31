package com.hospital.consultation.controller;

import com.hospital.consultation.entity.Doctor;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/doctors")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    @GetMapping
    public List<Doctor> getDoctors() {
        List<Doctor> doctors = doctorRepository.findAll();

        doctors.stream()
                .filter(doctor -> doctor.getActive() == null)
                .forEach(doctor -> doctor.setActive(true));

        return doctorRepository.saveAll(doctors);
    }

    @PostMapping
    public Doctor createDoctor(@RequestBody Doctor request) {
        validateDoctor(request);

        Doctor doctor = new Doctor();
        doctor.setName(request.getName().trim());
        doctor.setSpecialty(request.getSpecialty().trim());
        doctor.setActive(request.getActive() == null || request.getActive());
        doctor.setCreatedAt(LocalDateTime.now());

        return doctorRepository.save(doctor);
    }

    @PutMapping("/{doctorId}")
    public Doctor updateDoctor(
            @PathVariable Long doctorId,
            @RequestBody Doctor request
    ) {
        validateDoctor(request);

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("의사를 찾을 수 없습니다."));

        doctor.setName(request.getName().trim());
        doctor.setSpecialty(request.getSpecialty().trim());
        doctor.setActive(request.getActive() == null || request.getActive());

        return doctorRepository.save(doctor);
    }

    @DeleteMapping("/{doctorId}")
    public void deleteDoctor(@PathVariable Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("의사를 찾을 수 없습니다."));

        if (appointmentRepository.existsByDoctorId(doctorId)) {
            doctor.setActive(false);
            doctorRepository.save(doctor);
            return;
        }

        doctorRepository.delete(doctor);
    }

    private void validateDoctor(Doctor doctor) {
        if (doctor.getName() == null || doctor.getName().trim().isEmpty()) {
            throw new RuntimeException("의사명을 입력하세요.");
        }

        if (doctor.getSpecialty() == null || doctor.getSpecialty().trim().isEmpty()) {
            throw new RuntimeException("진료과를 입력하세요.");
        }
    }
}
