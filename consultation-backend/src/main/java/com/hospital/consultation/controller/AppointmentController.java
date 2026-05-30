package com.hospital.consultation.controller;

import com.hospital.consultation.dto.AppointmentDraftDto;
import com.hospital.consultation.dto.AppointmentRequestDto;
import com.hospital.consultation.entity.Appointment;
import com.hospital.consultation.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public Appointment createAppointment(@RequestBody AppointmentRequestDto requestDto) {
        return appointmentService.createAppointment(requestDto);
    }

    @GetMapping
    public List<Appointment> getAppointments() {
        return appointmentService.getAppointments();
    }

    @GetMapping("/patient/{patientId}")
    public List<Appointment> getAppointmentsByPatient(@PathVariable Long patientId) {
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    @GetMapping("/consultation/{consultationId}")
    public List<Appointment> getAppointmentsByConsultation(@PathVariable Long consultationId) {
        return appointmentService.getAppointmentsByConsultation(consultationId);
    }

    @PostMapping("/draft/{consultationId}")
    public AppointmentDraftDto createAppointmentDraft(@PathVariable Long consultationId) {
        return appointmentService.createAppointmentDraft(consultationId);
    }

    @PutMapping("/{appointmentId}")
    public Appointment updateAppointment(
            @PathVariable Long appointmentId,
            @RequestBody AppointmentRequestDto requestDto
    ) {
        return appointmentService.updateAppointment(appointmentId, requestDto);
    }

    @PatchMapping("/{appointmentId}/status")
    public Appointment updateAppointmentStatus(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> request
    ) {
        return appointmentService.updateAppointmentStatus(appointmentId, request.get("status"));
    }

    @DeleteMapping("/{appointmentId}")
    public void deleteAppointment(@PathVariable Long appointmentId) {
        appointmentService.deleteAppointment(appointmentId);
    }
}
