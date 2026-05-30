package com.hospital.consultation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consultation.dto.AppointmentDraftDto;
import com.hospital.consultation.dto.AppointmentRequestDto;
import com.hospital.consultation.entity.Appointment;
import com.hospital.consultation.entity.Consultation;
import com.hospital.consultation.entity.Patient;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import com.hospital.consultation.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public Appointment createAppointment(AppointmentRequestDto requestDto) {
        Patient patient = getPatient(requestDto.getPatientId());
        Consultation consultation = getConsultation(requestDto.getConsultationId());

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setConsultation(consultation);
        appointment.setAppointmentDateTime(requestDto.getAppointmentDateTime());
        appointment.setPurpose(requestDto.getPurpose());
        appointment.setStatus(requestDto.getStatus());
        appointment.setMemo(requestDto.getMemo());
        appointment.setCreatedAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByConsultation(Long consultationId) {
        return appointmentRepository.findByConsultationId(consultationId);
    }

    public AppointmentDraftDto createAppointmentDraft(Long consultationId) {
        Consultation consultation = getConsultation(consultationId);
        String consultationText = consultation.getSpeakerText();

        if (consultationText == null || consultationText.isBlank()) {
            consultationText = consultation.getOriginalText();
        }

        if (consultationText == null || consultationText.isBlank()) {
            AppointmentDraftDto draft = new AppointmentDraftDto();
            draft.setAppointmentConfirmed(false);
            draft.setAppointmentDateTime(null);
            draft.setPurpose("");
            draft.setStatus("예정");
            draft.setMemo("");
            draft.setReason("상담 내용이 없어 예약 초안을 만들 수 없습니다.");
            return draft;
        }

        try {
            String draftJson = aiService.extractAppointmentDraft(consultationText);
            AppointmentDraftDto draft = objectMapper.readValue(draftJson, AppointmentDraftDto.class);

            if (!draft.isAppointmentConfirmed()) {
                draft.setAppointmentDateTime(null);
            } else {
                calculateAppointmentDateTime(consultation, draft)
                        .ifPresent(dateTime -> draft.setAppointmentDateTime(dateTime.toString()));
            }

            if (draft.getStatus() == null || draft.getStatus().isBlank()) {
                draft.setStatus("예정");
            }

            return draft;
        } catch (Exception e) {
            AppointmentDraftDto draft = new AppointmentDraftDto();
            draft.setAppointmentConfirmed(false);
            draft.setAppointmentDateTime(null);
            draft.setPurpose("");
            draft.setStatus("예정");
            draft.setMemo("");
            draft.setReason("예약 초안 분석에 실패했습니다.");
            return draft;
        }
    }

    private Optional<LocalDateTime> calculateAppointmentDateTime(
            Consultation consultation,
            AppointmentDraftDto draft
    ) {
        LocalDateTime baseDateTime = consultation.getCreatedAt();

        if (baseDateTime == null) {
            return Optional.empty();
        }

        Optional<LocalDate> date = calculateDate(baseDateTime.toLocalDate(), draft.getDateExpression());
        Optional<LocalTime> time = calculateTime(draft.getTimeExpression());

        if (date.isEmpty() || time.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(LocalDateTime.of(date.get(), time.get()));
    }

    private Optional<LocalDate> calculateDate(LocalDate baseDate, String dateExpression) {
        if (dateExpression == null || dateExpression.isBlank()) {
            return Optional.empty();
        }

        String normalized = dateExpression.replaceAll("\\s+", "");

        if (normalized.contains("내일")) {
            return Optional.of(baseDate.plusDays(1));
        }

        if (normalized.contains("모레")) {
            return Optional.of(baseDate.plusDays(2));
        }

        Matcher weekMatcher = Pattern.compile("([123])주뒤").matcher(normalized);

        if (weekMatcher.find()) {
            int weeks = Integer.parseInt(weekMatcher.group(1));
            return Optional.of(baseDate.plusDays(weeks * 7L));
        }

        if (normalized.contains("한달뒤")) {
            return Optional.of(baseDate.plusMonths(1));
        }

        Matcher monthMatcher = Pattern.compile("([12])달뒤").matcher(normalized);

        if (monthMatcher.find()) {
            int months = Integer.parseInt(monthMatcher.group(1));
            return Optional.of(baseDate.plusMonths(months));
        }

        return Optional.empty();
    }

    private Optional<LocalTime> calculateTime(String timeExpression) {
        if (timeExpression == null || timeExpression.isBlank()) {
            return Optional.empty();
        }

        String normalized = timeExpression.replaceAll("\\s+", "");
        Matcher matcher = Pattern.compile("(오전|오후)(\\d{1,2})시").matcher(normalized);

        if (!matcher.find()) {
            return Optional.empty();
        }

        String meridiem = matcher.group(1);
        int hour = Integer.parseInt(matcher.group(2));

        if (hour < 1 || hour > 12) {
            return Optional.empty();
        }

        if ("오후".equals(meridiem) && hour < 12) {
            hour += 12;
        }

        if ("오전".equals(meridiem) && hour == 12) {
            hour = 0;
        }

        return Optional.of(LocalTime.of(hour, 0));
    }

    public Appointment updateAppointment(Long appointmentId, AppointmentRequestDto requestDto) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));

        if (requestDto.getPatientId() != null) {
            appointment.setPatient(getPatient(requestDto.getPatientId()));
        }

        if (requestDto.getConsultationId() != null) {
            appointment.setConsultation(getConsultation(requestDto.getConsultationId()));
        }

        appointment.setAppointmentDateTime(requestDto.getAppointmentDateTime());
        appointment.setPurpose(requestDto.getPurpose());
        appointment.setStatus(requestDto.getStatus());
        appointment.setMemo(requestDto.getMemo());

        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));

        appointmentRepository.delete(appointment);
    }

    private Patient getPatient(Long patientId) {
        if (patientId == null) {
            throw new RuntimeException("환자 ID가 필요합니다.");
        }

        return patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));
    }

    private Consultation getConsultation(Long consultationId) {
        if (consultationId == null) {
            throw new RuntimeException("상담 ID가 필요합니다.");
        }

        return consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다."));
    }
}
