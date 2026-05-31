package com.hospital.consultation.config;

import com.hospital.consultation.entity.Doctor;
import com.hospital.consultation.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DoctorDataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;

    @Override
    public void run(String... args) {
        if (doctorRepository.count() > 0) {
            return;
        }

        doctorRepository.saveAll(List.of(
                createDoctor("김민수 원장", "내과"),
                createDoctor("이서연 원장", "정형외과"),
                createDoctor("박준호 원장", "신경과")
        ));
    }

    private Doctor createDoctor(String name, String specialty) {
        Doctor doctor = new Doctor();
        doctor.setName(name);
        doctor.setSpecialty(specialty);
        doctor.setCreatedAt(LocalDateTime.now());
        return doctor;
    }
}
