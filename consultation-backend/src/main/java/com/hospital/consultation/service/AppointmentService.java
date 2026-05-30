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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private static final String RESERVED_STATUS = "예약됨";
    private static final String DRAFT_FAILURE_MESSAGE = "예약 초안 생성 실패";
    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public Appointment createAppointment(AppointmentRequestDto requestDto) {
        LocalDateTime appointmentDateTime = getAppointmentDateTime(requestDto);
        validateDuplicateReservation(appointmentDateTime, null);

        Appointment appointment = new Appointment();
        appointment.setPatient(getPatient(requestDto.getPatientId()));
        appointment.setConsultation(getOptionalConsultation(requestDto.getConsultationId()));
        appointment.setAppointmentDateTime(appointmentDateTime);
        appointment.setPurpose(requestDto.getPurpose());
        appointment.setStatus(normalizeStatus(requestDto.getStatus()));
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

    public Appointment updateAppointment(Long appointmentId, AppointmentRequestDto requestDto) {
        Appointment appointment = getAppointment(appointmentId);
        LocalDateTime appointmentDateTime = getAppointmentDateTime(requestDto);
        String status = normalizeStatus(requestDto.getStatus());

        if (RESERVED_STATUS.equals(status)) {
            validateDuplicateReservation(appointmentDateTime, appointmentId);
        }

        appointment.setPatient(getPatient(requestDto.getPatientId()));
        appointment.setConsultation(getOptionalConsultation(requestDto.getConsultationId()));
        appointment.setAppointmentDateTime(appointmentDateTime);
        appointment.setPurpose(requestDto.getPurpose());
        appointment.setStatus(status);
        appointment.setMemo(requestDto.getMemo());

        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentStatus(Long appointmentId, String status) {
        Appointment appointment = getAppointment(appointmentId);
        String normalizedStatus = normalizeStatus(status);

        if (RESERVED_STATUS.equals(normalizedStatus)) {
            validateDuplicateReservation(appointment.getAppointmentDateTime(), appointmentId);
        }

        appointment.setStatus(normalizedStatus);
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long appointmentId) {
        appointmentRepository.delete(getAppointment(appointmentId));
    }

    public AppointmentDraftDto createAppointmentDraft(Long consultationId) {
        Consultation consultation = getConsultation(consultationId);
        String consultationText = firstNonBlank(
                consultation.getSpeakerText(),
                consultation.getOriginalText()
        );

        if (consultationText == null) {
            return fallbackDraft();
        }

        try {
            String response = aiService.extractAppointmentDraft(consultationText);
            AppointmentDraftDto draft = parseDraft(response);
            return normalizeDraft(draft, consultationText);
        } catch (Exception e) {
            return fallbackDraft();
        }
    }

    private AppointmentDraftDto parseDraft(String response) {
        String cleaned = cleanJsonResponse(response);
        if (cleaned.isBlank()) {
            return fallbackDraft();
        }

        try {
            return objectMapper.readValue(cleaned, AppointmentDraftDto.class);
        } catch (Exception firstParseFailure) {
            String extracted = extractJsonFragment(cleaned);
            if (extracted == null || extracted.isBlank()) {
                throw new IllegalArgumentException("Unable to parse appointment draft", firstParseFailure);
            }

            try {
                return objectMapper.readValue(extracted, AppointmentDraftDto.class);
            } catch (Exception secondParseFailure) {
                throw new IllegalArgumentException("Unable to parse appointment draft", secondParseFailure);
            }
        }
    }

    private AppointmentDraftDto normalizeDraft(AppointmentDraftDto draft, String consultationText) {
        if (draft == null) {
            return fallbackDraft();
        }

        Boolean needReservation = firstNonNull(draft.getNeedReservation(), draft.getAppointmentConfirmed());
        draft.setNeedReservation(Boolean.TRUE.equals(needReservation));
        draft.setAppointmentConfirmed(Boolean.TRUE.equals(needReservation));

        if (!Boolean.TRUE.equals(needReservation)) {
            draft.setAppointmentDate(null);
            draft.setAppointmentDateTime(null);
            draft.setDateText(null);
            draft.setTimeText(null);
            draft.setMemo(null);
            draft.setStatus(null);
            draft.setPurpose(null);
            draft.setReason(null);
            return draft;
        }

        String dateText = firstNonBlank(draft.getDateText(), extractDateText(consultationText));
        String timeText = firstNonBlank(draft.getTimeText(), extractTimeText(consultationText));

        if (timeText == null && dateText != null) {
            timeText = extractTimeText(dateText);
        }

        if (dateText == null && timeText != null) {
            dateText = extractDateText(joinNonBlank(" ", consultationText, timeText));
        }

        draft.setDateText(dateText);
        draft.setTimeText(timeText);

        String appointmentDateTime = resolveAppointmentDateTime(
                dateText,
                timeText,
                consultationText
        );

        draft.setAppointmentDate(appointmentDateTime);
        draft.setAppointmentDateTime(appointmentDateTime);

        if (draft.getStatus() == null || draft.getStatus().isBlank()) {
            draft.setStatus(RESERVED_STATUS);
        }

        if (draft.getMemo() == null || draft.getMemo().isBlank()) {
            draft.setMemo(buildMemoFromConsultation(consultationText));
        }

        if (appointmentDateTime == null && shouldFlagRelativeDate(dateText, timeText, consultationText)) {
            draft.setMemo(appendNeedConfirmation(draft.getMemo(), dateText, timeText));
        }

        return draft;
    }

    private AppointmentDraftDto fallbackDraft() {
        AppointmentDraftDto draft = new AppointmentDraftDto();
        draft.setNeedReservation(Boolean.FALSE);
        draft.setAppointmentConfirmed(Boolean.FALSE);
        draft.setAppointmentDate(null);
        draft.setAppointmentDateTime(null);
        draft.setDateText(null);
        draft.setTimeText(null);
        draft.setMemo(DRAFT_FAILURE_MESSAGE);
        draft.setStatus(null);
        draft.setReason(null);
        draft.setPurpose(null);
        return draft;
    }

    private String cleanJsonResponse(String response) {
        if (response == null) {
            return "";
        }

        return response
                .replace("```json", "")
                .replace("```", "")
                .trim();
    }

    private String extractJsonFragment(String response) {
        if (response == null || response.isBlank()) {
            return "";
        }

        int start = response.indexOf('{');
        int end = response.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        return response;
    }

    private String resolveAppointmentDateTime(String dateText, String timeText, String consultationText) {
        String combinedText = joinNonBlank(" ", dateText, timeText, consultationText);
        LocalDate date = resolveDate(firstNonBlank(dateText, combinedText), combinedText);
        LocalTime time = resolveTime(firstNonBlank(timeText, combinedText), combinedText);

        if (date == null || time == null) {
            return null;
        }

        return LocalDateTime.of(date, time).format(ISO_FORMATTER);
    }

    private LocalDate resolveDate(String dateText, String fallbackText) {
        if (dateText == null || dateText.isBlank()) {
            dateText = fallbackText;
        }

        if (dateText == null || dateText.isBlank()) {
            return null;
        }

        String normalized = collapseWhitespace(dateText);
        String compact = normalized.replace(" ", "");
        LocalDate today = LocalDate.now();

        if (compact.contains("오늘")) {
            return today;
        }

        if (compact.contains("내일")) {
            return today.plusDays(1);
        }

        if (compact.contains("모레")) {
            return today.plusDays(2);
        }

        LocalDate absolute = parseAbsoluteDate(normalized, today.getYear());
        if (absolute != null) {
            return absolute;
        }

        LocalDate relativeWeekday = parseWeekdayExpression(normalized, today);
        if (relativeWeekday != null) {
            return relativeWeekday;
        }

        return null;
    }

    private LocalDate parseAbsoluteDate(String normalized, int defaultYear) {
        try {
            Matcher isoMatcher = Pattern.compile("(\\d{4})-(\\d{1,2})-(\\d{1,2})").matcher(normalized);
            if (isoMatcher.find()) {
                int year = Integer.parseInt(isoMatcher.group(1));
                int month = Integer.parseInt(isoMatcher.group(2));
                int day = Integer.parseInt(isoMatcher.group(3));
                return LocalDate.of(year, month, day);
            }

            Matcher yearMatcher = Pattern.compile("(\\d{4})년?(\\d{1,2})월(\\d{1,2})일?").matcher(normalized);
            if (yearMatcher.find()) {
                int year = Integer.parseInt(yearMatcher.group(1));
                int month = Integer.parseInt(yearMatcher.group(2));
                int day = Integer.parseInt(yearMatcher.group(3));
                return LocalDate.of(year, month, day);
            }

            Matcher monthDayMatcher = Pattern.compile("(\\d{1,2})월(\\d{1,2})일?").matcher(normalized);
            if (monthDayMatcher.find()) {
                int month = Integer.parseInt(monthDayMatcher.group(1));
                int day = Integer.parseInt(monthDayMatcher.group(2));
                return LocalDate.of(defaultYear, month, day);
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private LocalDate parseWeekdayExpression(String normalized, LocalDate today) {
        DayOfWeek targetDay = parseDayOfWeek(normalized);
        if (targetDay == null) {
            return null;
        }

        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        int offset = targetDay.getValue() - DayOfWeek.MONDAY.getValue();
        String compact = normalized.replace(" ", "");

        if (compact.contains("이번주")) {
            return weekStart.plusDays(offset);
        }

        if (compact.contains("다음주")) {
            return weekStart.plusWeeks(1).plusDays(offset);
        }

        if (compact.contains("주")) {
            return weekStart.plusDays(offset);
        }

        return null;
    }

    private DayOfWeek parseDayOfWeek(String normalized) {
        if (normalized.contains("월요일")) return DayOfWeek.MONDAY;
        if (normalized.contains("화요일")) return DayOfWeek.TUESDAY;
        if (normalized.contains("수요일")) return DayOfWeek.WEDNESDAY;
        if (normalized.contains("목요일")) return DayOfWeek.THURSDAY;
        if (normalized.contains("금요일")) return DayOfWeek.FRIDAY;
        if (normalized.contains("토요일")) return DayOfWeek.SATURDAY;
        if (normalized.contains("일요일")) return DayOfWeek.SUNDAY;
        return null;
    }

    private LocalTime resolveTime(String timeText, String fallbackText) {
        if (timeText == null || timeText.isBlank()) {
            timeText = fallbackText;
        }

        if (timeText == null || timeText.isBlank()) {
            return null;
        }

        String normalized = collapseWhitespace(timeText);
        String compact = normalized.replace(" ", "");

        try {
            Matcher colonMatcher = Pattern.compile("(\\d{1,2}):(\\d{2})").matcher(compact);
            if (colonMatcher.find()) {
                int hour = Integer.parseInt(colonMatcher.group(1));
                int minute = Integer.parseInt(colonMatcher.group(2));
                return LocalTime.of(hour, minute);
            }

            Matcher ampmMinuteMatcher = Pattern.compile("(오전|오후)\\s*(\\d{1,2})시\\s*(\\d{1,2})분?").matcher(normalized);
            if (ampmMinuteMatcher.find()) {
                int hour = Integer.parseInt(ampmMinuteMatcher.group(2));
                int minute = Integer.parseInt(ampmMinuteMatcher.group(3));
                if ("오후".equals(ampmMinuteMatcher.group(1)) && hour < 12) {
                    hour += 12;
                }
                if ("오전".equals(ampmMinuteMatcher.group(1)) && hour == 12) {
                    hour = 0;
                }
                return LocalTime.of(hour, minute);
            }

            Matcher ampmHourMatcher = Pattern.compile("(오전|오후)\\s*(\\d{1,2})시").matcher(normalized);
            if (ampmHourMatcher.find()) {
                int hour = Integer.parseInt(ampmHourMatcher.group(2));
                if ("오후".equals(ampmHourMatcher.group(1)) && hour < 12) {
                    hour += 12;
                }
                if ("오전".equals(ampmHourMatcher.group(1)) && hour == 12) {
                    hour = 0;
                }
                return LocalTime.of(hour, 0);
            }

            Matcher hourMinuteMatcher = Pattern.compile("(\\d{1,2})시\\s*(\\d{1,2})분?").matcher(normalized);
            if (hourMinuteMatcher.find()) {
                int hour = Integer.parseInt(hourMinuteMatcher.group(1));
                int minute = Integer.parseInt(hourMinuteMatcher.group(2));
                return LocalTime.of(hour, minute);
            }

            Matcher plainHourMatcher = Pattern.compile("(\\d{1,2})시").matcher(normalized);
            if (plainHourMatcher.find()) {
                int hour = Integer.parseInt(plainHourMatcher.group(1));
                return LocalTime.of(hour, 0);
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private String extractDateText(String consultationText) {
        if (consultationText == null || consultationText.isBlank()) {
            return null;
        }

        String[] patterns = {
                "\\d{4}\\s*년\\s*\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일",
                "\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일",
                "이번\\s*주\\s*[월화수목금토일]요일",
                "다음\\s*주\\s*[월화수목금토일]요일",
                "오늘",
                "내일",
                "모레"
        };

        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(consultationText);
            if (matcher.find()) {
                return matcher.group().replaceAll("\\s+", " ").trim();
            }
        }

        return null;
    }

    private String extractTimeText(String consultationText) {
        if (consultationText == null || consultationText.isBlank()) {
            return null;
        }

        String[] patterns = {
                "(오전|오후)\\s*\\d{1,2}시\\s*\\d{1,2}분",
                "(오전|오후)\\s*\\d{1,2}시",
                "\\d{1,2}:\\d{2}",
                "\\d{1,2}시\\s*\\d{1,2}분",
                "\\d{1,2}시"
        };

        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(consultationText);
            if (matcher.find()) {
                return matcher.group().replaceAll("\\s+", " ").trim();
            }
        }

        return null;
    }

    private boolean shouldFlagRelativeDate(String dateText, String timeText, String consultationText) {
        String normalized = joinNonBlank(" ", dateText, timeText, consultationText);
        if (normalized == null) {
            return false;
        }

        String compact = normalized.replace(" ", "");
        return compact.contains("내일")
                || compact.contains("모레")
                || compact.contains("다음주")
                || compact.contains("이번주")
                || compact.contains("다음달")
                || compact.contains("오늘")
                || compact.contains("요일");
    }

    private String buildMemoFromConsultation(String consultationText) {
        if (consultationText == null || consultationText.isBlank()) {
            return null;
        }

        String firstLine = consultationText.split("\\R", 2)[0].trim();
        return firstLine;
    }

    private String appendNeedConfirmation(String memo, String dateText, String timeText) {
        StringBuilder builder = new StringBuilder();
        if (memo != null && !memo.isBlank()) {
            builder.append(memo.trim());
        }

        if (dateText != null && !dateText.isBlank()) {
            if (builder.length() > 0) {
                builder.append(". ");
            }
            builder.append(dateText.trim());
        }

        if (timeText != null && !timeText.isBlank()) {
            builder.append(" ").append(timeText.trim());
        }

        if (builder.length() > 0) {
            builder.append(". 정확한 날짜 확인 필요");
            return builder.toString();
        }

        return "정확한 날짜 확인 필요";
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return RESERVED_STATUS;
        }

        return status;
    }

    private LocalDateTime getAppointmentDateTime(AppointmentRequestDto requestDto) {
        LocalDateTime appointmentDateTime = requestDto.getAppointmentDate();
        if (appointmentDateTime == null) {
            appointmentDateTime = requestDto.getAppointmentDateTime();
        }

        if (appointmentDateTime == null) {
            throw new RuntimeException("예약 일시가 필요합니다.");
        }

        return appointmentDateTime;
    }

    private void validateDuplicateReservation(LocalDateTime appointmentDateTime, Long appointmentId) {
        boolean duplicated = appointmentId == null
                ? appointmentRepository.existsByAppointmentDateTimeAndStatus(appointmentDateTime, RESERVED_STATUS)
                : appointmentRepository.existsByAppointmentDateTimeAndStatusAndIdNot(
                        appointmentDateTime,
                        RESERVED_STATUS,
                        appointmentId
                );

        if (duplicated) {
            throw new RuntimeException("이미 해당 시간에 예약이 있습니다.");
        }
    }

    private Appointment getAppointment(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("예약을 찾을 수 없습니다."));
    }

    private Patient getPatient(Long patientId) {
        if (patientId == null) {
            throw new RuntimeException("환자 ID가 필요합니다.");
        }

        return patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));
    }

    private Consultation getOptionalConsultation(Long consultationId) {
        if (consultationId == null) {
            return null;
        }

        return getConsultation(consultationId);
    }

    private Consultation getConsultation(Long consultationId) {
        return consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다."));
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }

        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return null;
    }

    private <T> T firstNonNull(T first, T second) {
        return first != null ? first : second;
    }

    private String joinNonBlank(String delimiter, String... values) {
        StringBuilder builder = new StringBuilder();

        for (String value : values) {
            if (value == null || value.isBlank()) {
                continue;
            }

            if (builder.length() > 0) {
                builder.append(delimiter);
            }

            builder.append(value.trim());
        }

        return builder.length() > 0 ? builder.toString() : null;
    }

    private String collapseWhitespace(String value) {
        return value == null ? null : value.replaceAll("\\s+", " ").trim();
    }
}
