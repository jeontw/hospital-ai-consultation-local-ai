package com.hospital.consultation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consultation.dto.AppointmentDraftDto;
import com.hospital.consultation.dto.AppointmentRequestDto;
import com.hospital.consultation.entity.Appointment;
import com.hospital.consultation.entity.Consultation;
import com.hospital.consultation.entity.Doctor;
import com.hospital.consultation.entity.Patient;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import com.hospital.consultation.repository.DoctorRepository;
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
    private final DoctorRepository doctorRepository;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public Appointment createAppointment(AppointmentRequestDto requestDto) {
        LocalDateTime appointmentDateTime = getAppointmentDateTime(requestDto);
        Doctor doctor = getDoctor(requestDto.getDoctorId());
        validateDuplicateReservation(doctor.getId(), appointmentDateTime, null);

        Appointment appointment = new Appointment();
        appointment.setPatient(getPatient(requestDto.getPatientId()));
        appointment.setConsultation(getOptionalConsultation(requestDto.getConsultationId()));
        appointment.setDoctor(doctor);
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
        Doctor doctor = getDoctor(requestDto.getDoctorId());
        String status = normalizeStatus(requestDto.getStatus());

        if (RESERVED_STATUS.equals(status)) {
            validateDuplicateReservation(doctor.getId(), appointmentDateTime, appointmentId);
        }

        appointment.setPatient(getPatient(requestDto.getPatientId()));
        appointment.setConsultation(getOptionalConsultation(requestDto.getConsultationId()));
        appointment.setDoctor(doctor);
        appointment.setAppointmentDateTime(appointmentDateTime);
        appointment.setPurpose(requestDto.getPurpose());
        appointment.setStatus(status);
        appointment.setMemo(requestDto.getMemo());

        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointmentStatus(Long appointmentId, String status) {
        Appointment appointment = getAppointment(appointmentId);
        String normalizedStatus = normalizeStatus(status);

        if (RESERVED_STATUS.equals(normalizedStatus) && appointment.getDoctor() != null) {
            validateDuplicateReservation(
                    appointment.getDoctor().getId(),
                    appointment.getAppointmentDateTime(),
                    appointmentId
            );
        }

        appointment.setStatus(normalizedStatus);
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long appointmentId) {
        appointmentRepository.delete(getAppointment(appointmentId));
    }

    public AppointmentDraftDto createAppointmentDraft(Long consultationId) {
        Consultation consultation = getConsultation(consultationId);
        String consultationText = buildConsultationText(
                consultation.getOriginalText(),
                consultation.getNurseMemo()
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

        draft.setMemo(resolveVisitReason(draft, consultationText, dateText, timeText));

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

    private String resolveVisitReason(
            AppointmentDraftDto draft,
            String consultationText,
            String dateText,
            String timeText
    ) {
        String aiVisitReason = firstNonBlank(
                draft.getMemo(),
                draft.getReason(),
                draft.getPurpose()
        );

        if (!containsInvalidMemoTerm(aiVisitReason)) {
            String sanitized = sanitizeVisitReason(aiVisitReason, dateText, timeText);
            if (sanitized != null && !containsInvalidMemoTerm(sanitized)) {
                return normalizeVisitReasonSentence(sanitized);
            }
        }

        return buildFallbackVisitReason(consultationText);
    }

    private String sanitizeVisitReason(String value, String dateText, String timeText) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String sanitized = collapseWhitespace(value);
        sanitized = removeLiteral(sanitized, dateText);
        sanitized = removeLiteral(sanitized, timeText);

        String[] removalPatterns = {
                "\\d{4}\\s*년\\s*\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일",
                "\\d{1,2}\\s*월\\s*\\d{1,2}\\s*일",
                "이번\\s*주\\s*[월화수목금토일]요일",
                "다음\\s*주\\s*[월화수목금토일]요일",
                "오늘|내일|모레",
                "(오전|오후)\\s*\\d{1,2}시\\s*\\d{1,2}분",
                "(오전|오후)\\s*\\d{1,2}시",
                "\\d{1,2}:\\d{2}",
                "\\d{1,2}시\\s*\\d{1,2}분",
                "\\d{1,2}시",
                "방문\\s*예약\\s*(부탁드립니다|부탁드려요|원합니다|가능합니다|해드리겠습니다)?",
                "방문\\s*(원합니다|하고\\s*싶습니다|하려고\\s*합니다)",
                "예약\\s*(부탁드립니다|부탁드려요|원합니다|하고\\s*싶습니다|하려고\\s*합니다|가능합니다|가능할까요|해드리겠습니다|해주세요|해\\s*주세요)?",
                "증상이\\s*지속되면\\s*진료를\\s*받아보시는\\s*것이\\s*좋겠습니다",
                "증상이\\s*계속되면\\s*진료를\\s*받아보시는\\s*것이\\s*좋겠습니다",
                "방문\\s*가능한\\s*시간이\\s*있으실까요",
                "그\\s*시간으로\\s*진행해드릴까요",
                "안녕하세요|감사합니다|알겠습니다",
                "\\b(네|환자|선생님|상담사|간호사|화자명)\\b",
                "\\b(부탁드립니다|부탁드려요|가능합니다|해드리겠습니다)\\b",
                "화자\\s*\\d+\\s*[:：]",
                "[가-힣A-Za-z0-9_ ]{1,12}\\s*[:：]"
        };

        for (String pattern : removalPatterns) {
            sanitized = sanitized.replaceAll(pattern, " ");
        }

        sanitized = sanitized
                .replaceAll("[,./]+\\s*$", "")
                .replaceAll("\\s+", " ")
                .trim();

        if (sanitized.isBlank()) {
            return null;
        }

        return sanitized;
    }

    private boolean containsInvalidMemoTerm(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }

        String compact = value.replaceAll("\\s+", "");
        String[] invalidTerms = {
                "안녕하세요",
                "예약",
                "가능합니다",
                "해드리겠습니다",
                "알겠습니다",
                "선생님",
                "환자",
                "상담사",
                "간호사",
                "감사합니다",
                "네",
                "화자명",
                "방문가능한시간이있으실까요",
                "그시간으로진행해드릴까요",
                "증상이지속되면진료를받아보시는것이좋겠습니다",
                "증상이계속되면진료를받아보시는것이좋겠습니다"
        };

        for (String invalidTerm : invalidTerms) {
            if (compact.contains(invalidTerm)) {
                return true;
            }
        }

        return Pattern.compile("화자\\s*\\d+\\s*[:：]").matcher(value).find()
                || Pattern.compile("(환자|상담사|간호사|선생님)\\s*[:：]").matcher(value).find();
    }

    private String normalizeVisitReasonSentence(String visitReason) {
        if (visitReason == null || visitReason.isBlank()) {
            return null;
        }

        String normalized = collapseWhitespace(visitReason)
                .replaceAll("[.!?。]+$", "")
                .trim();

        normalized = normalized.split("[.!?。]", 2)[0].trim();

        if (normalized.contains("상담 희망") || normalized.contains("진료 희망")) {
            return normalized;
        }

        if (normalized.endsWith("으로") || normalized.endsWith("로")) {
            return normalized + " 진료 희망";
        }

        return normalized + "으로 진료 희망";
    }

    private String buildFallbackVisitReason(String consultationText) {
        if (consultationText == null || consultationText.isBlank()) {
            return null;
        }

        String compact = consultationText.replaceAll("\\s+", "");

        if (containsAny(compact, "잠", "수면", "새벽", "피곤")) {
            return "수면장애와 피로감으로 진료 희망";
        }

        if (containsAny(compact, "혈압", "두통", "머리")) {
            return "혈압 상승과 두통으로 진료 희망";
        }

        if (containsAny(compact, "기침", "가래", "숨", "호흡")) {
            return "기침과 가래 증상으로 진료 희망";
        }

        if (containsAny(compact, "불안", "가슴답답", "스트레스")) {
            return "불안감 및 가슴 답답함으로 상담 희망";
        }

        if (containsAny(compact, "어지럼", "어지러움", "눈", "시야")) {
            return "어지럼증 및 시야 불편으로 진료 희망";
        }

        return "증상 상담으로 진료 희망";
    }

    private boolean containsAny(String value, String... keywords) {
        if (value == null || value.isBlank()) {
            return false;
        }

        for (String keyword : keywords) {
            if (value.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private String removeLiteral(String value, String target) {
        if (value == null || target == null || target.isBlank()) {
            return value;
        }

        return value.replace(target, " ");
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

    private void validateDuplicateReservation(Long doctorId, LocalDateTime appointmentDateTime, Long appointmentId) {
        boolean duplicated = appointmentId == null
                ? appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatus(
                        doctorId,
                        appointmentDateTime,
                        RESERVED_STATUS
                )
                : appointmentRepository.existsByDoctorIdAndAppointmentDateTimeAndStatusAndIdNot(
                        doctorId,
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

    private Doctor getDoctor(Long doctorId) {
        if (doctorId == null) {
            throw new RuntimeException("담당 의사를 선택하세요.");
        }

        return doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("담당 의사를 찾을 수 없습니다."));
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

    private String buildConsultationText(String originalText, String nurseMemo) {
        StringBuilder builder = new StringBuilder();

        if (originalText != null && !originalText.isBlank()) {
            builder.append(originalText.trim());
        }

        if (nurseMemo != null && !nurseMemo.isBlank()) {
            if (builder.length() > 0) {
                builder.append("\n\n");
            }
            builder.append("간호사 메모:\n").append(nurseMemo.trim());
        }

        return builder.length() > 0 ? builder.toString() : null;
    }

}
