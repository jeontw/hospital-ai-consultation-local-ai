package com.hospital.consultation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consultation.dto.AiAnalysisResultDto;
import com.hospital.consultation.dto.AiConsultationPreviewDto;
import com.hospital.consultation.dto.AiPatientExtractionDto;
import com.hospital.consultation.dto.AppointmentDraftDto;
import com.hospital.consultation.dto.ConsultationRequestDto;
import com.hospital.consultation.dto.PatientCandidateDto;
import com.hospital.consultation.entity.AiAnalysis;
import com.hospital.consultation.entity.Appointment;
import com.hospital.consultation.entity.Consultation;
import com.hospital.consultation.entity.Doctor;
import com.hospital.consultation.entity.Patient;
import com.hospital.consultation.repository.AiAnalysisRepository;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import com.hospital.consultation.repository.DoctorRepository;
import com.hospital.consultation.repository.PatientRepository;
import com.hospital.consultation.service.LocalWhisperService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.hospital.consultation.service.AudioConvertService;
import com.hospital.consultation.service.AiService;
import com.hospital.consultation.service.AppointmentService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/consultations")
public class ConsultationController {

    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final AiService aiService;
    private final LocalWhisperService localWhisperService;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final ObjectMapper objectMapper;
    private final AudioConvertService audioConvertService;
    private final AppointmentService appointmentService;

    @PostMapping("/{patientId}")
    public Consultation createConsultation(
            @PathVariable Long patientId,
            @RequestBody ConsultationRequestDto requestDto
    ) throws Exception {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

        String originalText = trimToNull(requestDto.getOriginalText());
        String nurseMemo = trimToNull(requestDto.getNurseMemo());
        String analysisInput = buildAnalysisInput(originalText, nurseMemo);

        if (analysisInput == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상담 내용 또는 간호사 메모가 필요합니다.");
        }

        String summary = aiService.summarize(analysisInput);


        Consultation consultation = new Consultation();
        consultation.setPatient(patient);
        consultation.setOriginalText(originalText);
        consultation.setNurseMemo(nurseMemo);
        consultation.setAudioPath(requestDto.getAudioPath());
        consultation.setSummary(summary);
        consultation.setCreatedAt(LocalDateTime.now());

        Consultation savedConsultation = consultationRepository.save(consultation);

        String analysisJson = aiService.analyze(analysisInput);

        AiAnalysisResultDto result =
                objectMapper.readValue(analysisJson, AiAnalysisResultDto.class);

        AiAnalysis aiAnalysis = new AiAnalysis();
        aiAnalysis.setConsultation(savedConsultation);
        aiAnalysis.setSymptoms(result.getSymptoms());
        aiAnalysis.setRiskLevel(result.getRiskLevel());
        aiAnalysis.setKeywords(result.getKeywords());

        aiAnalysisRepository.save(aiAnalysis);

        savedConsultation.setDoctorBriefing(createDoctorBriefing(
                originalText,
                nurseMemo,
                summary,
                result
        ));

        return consultationRepository.save(savedConsultation);
    }

    @GetMapping
    public List<Consultation> getConsultations() {
        return consultationRepository.findAll();
    }

    @GetMapping("/patient/{patientId}")
    public List<Consultation> getPatientConsultations(
            @PathVariable Long patientId
    ) {
        return consultationRepository.findByPatientId(patientId);
    }
    @GetMapping("/patient/{patientId}/insight")
    public String getPatientInsight(@PathVariable Long patientId) throws Exception {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

        List<Consultation> consultations =
                consultationRepository.findByPatientId(patientId);

        if (consultations.isEmpty()) {
            return "해당 환자의 상담 기록이 없습니다.";
        }

        StringBuilder prompt = new StringBuilder();

        prompt.append("다음은 한 환자의 과거 전화 상담 기록입니다.\n");
        prompt.append("의료진이 참고할 수 있도록 환자별 종합 인사이트를 작성해주세요.\n");
        prompt.append("진단을 내리지 말고, 상담 기록 기반의 주의점과 반복되는 증상 중심으로 정리해주세요.\n\n");

        prompt.append("환자명: ").append(patient.getName()).append("\n");
        prompt.append("전화번호: ").append(patient.getPhone()).append("\n\n");

        for (Consultation consultation : consultations) {
            prompt.append("- 상담일: ").append(consultation.getCreatedAt()).append("\n");
            prompt.append("상담 내용: ").append(consultation.getOriginalText()).append("\n");
            if (consultation.getNurseMemo() != null && !consultation.getNurseMemo().isBlank()) {
                prompt.append("간호사 메모: ").append(consultation.getNurseMemo()).append("\n");
            }
            prompt.append("AI 요약: ").append(consultation.getSummary()).append("\n");

            if (consultation.getAiAnalysis() != null) {
                prompt.append("증상: ").append(consultation.getAiAnalysis().getSymptoms()).append("\n");
                prompt.append("위험도: ").append(consultation.getAiAnalysis().getRiskLevel()).append("\n");
                prompt.append("키워드: ").append(consultation.getAiAnalysis().getKeywords()).append("\n");
            }

            prompt.append("\n");
        }

        prompt.append("""
출력은 반드시 아래 형식을 지켜주세요.

[환자 상담 요약]
- 핵심 내용 요약

[반복 증상]
- 반복된 증상들을 bullet 형식으로 정리

[주의 사항]
- 의료진이 주의할 점 정리

[추천 질문]
- 다음 상담 시 확인하면 좋은 질문들을 bullet 형식으로 작성

문장은 짧고 가독성 있게 작성해주세요.
진단하지 말고 상담 보조 형태로 작성해주세요.
""");

        return aiService.summarize(prompt.toString());
    }

    @GetMapping("/analysis")
    public List<AiAnalysis> getAiAnalyses() {
        return aiAnalysisRepository.findAll();
    }

    @PostMapping("/preview")
    public AiConsultationPreviewDto previewConsultation(
            @RequestParam(value = "audioFile", required = false) MultipartFile audioFile,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "nurseMemo", required = false) String nurseMemo,
            @RequestParam(value = "directText", required = false) String directText
    ) throws Exception {
        MultipartFile selectedFile = audioFile != null ? audioFile : file;
        String originalText = trimToNull(directText);
        String trimmedNurseMemo = trimToNull(nurseMemo);

        if (selectedFile != null && !selectedFile.isEmpty()) {
            String transcribedText = transcribeTemporaryAudio(selectedFile);
            originalText = joinNonBlank("\n\n", originalText, transcribedText);
        }

        String analysisInput = buildAnalysisInput(originalText, trimmedNurseMemo);

        if (analysisInput == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "?뚯꽦 ?뚯씪, ?곷떞 ?댁슜, 媛꾪샇??硫붾え 以??섎굹媛 ?꾩슂?⑸땲??");
        }

        String summary = aiService.summarize(analysisInput);
        AiAnalysisResultDto analysisResult =
                objectMapper.readValue(aiService.analyze(analysisInput), AiAnalysisResultDto.class);
        AiPatientExtractionDto patientExtraction =
                parsePatientExtraction(aiService.extractPatientProfile(analysisInput));
        AppointmentDraftDto appointmentDraft =
                appointmentService.createAppointmentDraftFromText(analysisInput);
        List<PatientCandidateDto> patientCandidates = findPatientCandidates(patientExtraction);
        DoctorRecommendation doctorRecommendation = recommendDoctor(
                analysisInput,
                analysisResult,
                appointmentDraft,
                patientCandidates
        );

        AiConsultationPreviewDto preview = new AiConsultationPreviewDto();
        preview.setOriginalText(originalText);
        preview.setNurseMemo(trimmedNurseMemo);
        preview.setSummary(summary);
        preview.setSymptoms(splitToList(analysisResult.getSymptoms()));
        preview.setRiskLevel(analysisResult.getRiskLevel());
        preview.setKeywords(splitToList(analysisResult.getKeywords()));
        preview.setExtractedPatientName(patientExtraction.getName());
        preview.setExtractedPhone(patientExtraction.getPhone());
        preview.setExtractedPhoneLast4(resolvePhoneLast4(patientExtraction));
        preview.setExtractedBirth(patientExtraction.getBirth());
        preview.setPatientCandidates(patientCandidates);
        preview.setAppointmentDate(firstNonBlank(
                appointmentDraft.getAppointmentDate(),
                appointmentDraft.getAppointmentDateTime()
        ));
        preview.setVisitReason(firstNonBlank(
                appointmentDraft.getMemo(),
                appointmentDraft.getPurpose(),
                appointmentDraft.getReason()
        ));
        preview.setStatus(appointmentDraft.getStatus());
        preview.setRecommendedDoctorId(doctorRecommendation.doctorId());
        preview.setRecommendedDoctorName(doctorRecommendation.doctorName());
        preview.setDoctorRecommendationReason(doctorRecommendation.reason());

        return preview;
    }

    @PostMapping("/upload/{patientId}")
    public Consultation uploadConsultation(
            @PathVariable Long patientId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "nurseMemo", required = false) String nurseMemo
    ) throws Exception {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

        String originalText = null;
        String audioPath = null;
        String trimmedNurseMemo = trimToNull(nurseMemo);

        if (file != null && !file.isEmpty()) {
            String uploadDir = System.getProperty("user.dir") + "/uploads/";

            java.io.File directory = new java.io.File(uploadDir);

            if (!directory.exists()) {
                directory.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

            String filePath = uploadDir + fileName;

            file.transferTo(new java.io.File(filePath));

            String convertedPath = filePath;

            if (fileName.toLowerCase().endsWith(".m4a")) {

                convertedPath = audioConvertService.convertToMp3(filePath);

                java.io.File originalFile = new java.io.File(filePath);

                if (originalFile.exists()) {
                    originalFile.delete();
                    System.out.println("원본 m4a 파일 삭제 완료: " + filePath);
                }

                fileName = new java.io.File(convertedPath).getName();
            }

            originalText =
                    trimToNull(localWhisperService.transcribe(
                            new java.io.File(convertedPath)
                    ));
            audioPath = "/uploads/" + fileName;
        }

        String analysisInput = buildAnalysisInput(originalText, trimmedNurseMemo);

        if (analysisInput == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "음성 파일 또는 간호사 메모가 필요합니다.");
        }

        String summary = aiService.summarize(analysisInput);

        Consultation consultation = new Consultation();
        consultation.setPatient(patient);
        consultation.setOriginalText(originalText);
        consultation.setNurseMemo(trimmedNurseMemo);
        consultation.setSummary(summary);
        consultation.setAudioPath(audioPath);
        consultation.setCreatedAt(LocalDateTime.now());

        Consultation savedConsultation = consultationRepository.save(consultation);

        String analysisJson = aiService.analyze(analysisInput);

        AiAnalysisResultDto result =
                objectMapper.readValue(analysisJson, AiAnalysisResultDto.class);

        AiAnalysis aiAnalysis = new AiAnalysis();
        aiAnalysis.setConsultation(savedConsultation);
        aiAnalysis.setSymptoms(result.getSymptoms());
        aiAnalysis.setRiskLevel(result.getRiskLevel());
        aiAnalysis.setKeywords(result.getKeywords());

        aiAnalysisRepository.save(aiAnalysis);

        savedConsultation.setDoctorBriefing(createDoctorBriefing(
                originalText,
                trimmedNurseMemo,
                summary,
                result
        ));

        return consultationRepository.save(savedConsultation);
    }

    @Transactional
    @PutMapping("/{consultationId}")
    public Consultation updateConsultation(
            @PathVariable Long consultationId,
            @RequestBody ConsultationRequestDto requestDto
    ) throws Exception {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다."));

        String originalText = trimToNull(requestDto.getOriginalText());
        String nurseMemo = requestDto.getNurseMemo() == null
                ? consultation.getNurseMemo()
                : trimToNull(requestDto.getNurseMemo());
        String analysisInput = buildAnalysisInput(originalText, nurseMemo);

        if (analysisInput == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상담 내용 또는 간호사 메모가 필요합니다.");
        }

        consultation.setOriginalText(originalText);
        consultation.setNurseMemo(nurseMemo);

        String summary = aiService.summarize(analysisInput);

        consultation.setSummary(summary);

        Consultation savedConsultation = consultationRepository.save(consultation);

        AiAnalysis aiAnalysis = savedConsultation.getAiAnalysis();

        if (aiAnalysis == null) {
            aiAnalysis = new AiAnalysis();
            aiAnalysis.setConsultation(savedConsultation);
        }

        String analysisJson = aiService.analyze(analysisInput);

        AiAnalysisResultDto result =
                objectMapper.readValue(analysisJson, AiAnalysisResultDto.class);

        aiAnalysis.setSymptoms(result.getSymptoms());
        aiAnalysis.setRiskLevel(result.getRiskLevel());
        aiAnalysis.setKeywords(result.getKeywords());

        aiAnalysisRepository.save(aiAnalysis);

        savedConsultation.setDoctorBriefing(createDoctorBriefing(
                originalText,
                nurseMemo,
                summary,
                result
        ));

        return consultationRepository.save(savedConsultation);
    }

    @Transactional
    @DeleteMapping("/{consultationId}")
    public void deleteConsultation(
            @PathVariable Long consultationId
    ) {

        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다."));

        String audioPath = consultation.getAudioPath();

        if (audioPath != null && !audioPath.isBlank()) {

            String fullPath =
                    System.getProperty("user.dir") + audioPath;

            java.io.File audioFile = new java.io.File(fullPath);

            if (audioFile.exists()) {
                audioFile.delete();
                System.out.println("음성 파일 삭제 완료: " + fullPath);
            }
        }

        appointmentRepository.deleteByConsultationId(consultationId);

        aiAnalysisRepository.deleteByConsultationId(consultationId);

        consultationRepository.delete(consultation);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String buildAnalysisInput(String originalText, String nurseMemo) {
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

    private String transcribeTemporaryAudio(MultipartFile file) throws Exception {
        String uploadDir = System.getProperty("user.dir") + "/uploads/";
        java.io.File directory = new java.io.File(uploadDir);

        if (!directory.exists()) {
            directory.mkdirs();
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        String filePath = uploadDir + fileName;
        String convertedPath = filePath;

        file.transferTo(new java.io.File(filePath));

        try {
            if (fileName.toLowerCase().endsWith(".m4a")) {
                convertedPath = audioConvertService.convertToMp3(filePath);
            }

            return trimToNull(localWhisperService.transcribe(new java.io.File(convertedPath)));
        } finally {
            deleteIfExists(filePath);
            if (!convertedPath.equals(filePath)) {
                deleteIfExists(convertedPath);
            }
        }
    }

    private void deleteIfExists(String path) {
        java.io.File target = new java.io.File(path);
        if (target.exists()) {
            target.delete();
        }
    }

    private AiPatientExtractionDto parsePatientExtraction(String patientJson) {
        try {
            AiPatientExtractionDto extraction =
                    objectMapper.readValue(patientJson, AiPatientExtractionDto.class);
            extraction.setName(trimToNull(extraction.getName()));
            extraction.setPhone(trimToNull(extraction.getPhone()));
            extraction.setPhoneLast4(trimToNull(extraction.getPhoneLast4()));
            extraction.setBirth(trimToNull(extraction.getBirth()));
            return extraction;
        } catch (Exception ignored) {
            return new AiPatientExtractionDto();
        }
    }

    private List<PatientCandidateDto> findPatientCandidates(AiPatientExtractionDto extraction) {
        Map<Long, PatientCandidateDto> candidates = new LinkedHashMap<>();

        if (extraction == null) {
            return List.of();
        }

        String phone = normalizePhone(extraction.getPhone());
        String phoneLast4 = resolvePhoneLast4(extraction);
        String name = normalizeText(extraction.getName());
        String birth = normalizeText(extraction.getBirth());
        List<Patient> patients = patientRepository.findAll();

        boolean hasFullPhone = phone != null && phone.length() > 4;

        if (hasFullPhone) {
            for (Patient patient : patients) {
                if (phone.equals(normalizePhone(patient.getPhone()))) {
                    candidates.put(patient.getId(), toPatientCandidate(patient));
                }
            }
        }

        if (!hasFullPhone && name != null && phoneLast4 != null) {
            for (Patient patient : patients) {
                if (
                        name.equals(normalizeText(patient.getName()))
                                && phoneEndsWith(patient.getPhone(), phoneLast4)
                ) {
                    candidates.put(patient.getId(), toPatientCandidate(patient));
                }
            }
        }

        if (!hasFullPhone && phoneLast4 != null) {
            for (Patient patient : patients) {
                if (phoneEndsWith(patient.getPhone(), phoneLast4)) {
                    candidates.put(patient.getId(), toPatientCandidate(patient));
                }
            }
        }

        if (name != null && birth != null) {
            for (Patient patient : patients) {
                if (
                        name.equals(normalizeText(patient.getName()))
                                && birth.equals(normalizeText(patient.getBirth()))
                ) {
                    candidates.put(patient.getId(), toPatientCandidate(patient));
                }
            }
        }

        if (name != null) {
            for (Patient patient : patients) {
                if (name.equals(normalizeText(patient.getName()))) {
                    candidates.put(patient.getId(), toPatientCandidate(patient));
                }
            }
        }

        return new ArrayList<>(candidates.values());
    }

    private PatientCandidateDto toPatientCandidate(Patient patient) {
        PatientCandidateDto candidate = new PatientCandidateDto();
        candidate.setId(patient.getId());
        candidate.setName(patient.getName());
        candidate.setPhone(patient.getPhone());
        candidate.setBirth(patient.getBirth());
        return candidate;
    }

    private DoctorRecommendation recommendDoctor(
            String analysisInput,
            AiAnalysisResultDto analysisResult,
            AppointmentDraftDto appointmentDraft,
            List<PatientCandidateDto> patientCandidates
    ) {
        List<Doctor> activeDoctors = doctorRepository.findAll().stream()
                .filter(doctor -> !Boolean.FALSE.equals(doctor.getActive()))
                .toList();

        if (activeDoctors.isEmpty()) {
            return new DoctorRecommendation(null, null, "등록된 활성 담당의사가 없습니다.");
        }

        String recommendationText = joinNonBlank(
                " ",
                analysisInput,
                analysisResult.getSymptoms(),
                analysisResult.getKeywords(),
                appointmentDraft.getMemo(),
                appointmentDraft.getPurpose(),
                appointmentDraft.getReason()
        );

        Doctor mentionedDoctor = findMentionedDoctor(recommendationText, activeDoctors);
        if (mentionedDoctor != null) {
            return new DoctorRecommendation(
                    mentionedDoctor.getId(),
                    mentionedDoctor.getName(),
                    "상담 내용에서 담당의사명이 직접 언급되었습니다."
            );
        }

        SpecialtyRecommendation specialtyRecommendation =
                recommendSpecialty(recommendationText);
        if (specialtyRecommendation.specialty() != null) {
            Doctor specialtyDoctor = findDoctorBySpecialty(
                    specialtyRecommendation.specialty(),
                    activeDoctors
            );

            if (specialtyDoctor != null) {
                return new DoctorRecommendation(
                        specialtyDoctor.getId(),
                        specialtyDoctor.getName(),
                        specialtyRecommendation.reason()
                );
            }
        }

        Doctor previousDoctor = findPreviousDoctor(patientCandidates, activeDoctors);
        if (previousDoctor != null) {
            return new DoctorRecommendation(
                    previousDoctor.getId(),
                    previousDoctor.getName(),
                    "현재 증상만으로 판단이 어려워 과거 예약 담당의사를 참고했습니다."
            );
        }

        return new DoctorRecommendation(null, null, "담당의사 추천 근거가 부족해 미지정으로 표시합니다.");
    }

    private Doctor findMentionedDoctor(String text, List<Doctor> doctors) {
        if (text == null || text.isBlank()) {
            return null;
        }

        String normalizedText = normalizeText(text);

        for (Doctor doctor : doctors) {
            String doctorName = normalizeText(doctor.getName());
            if (doctorName != null && normalizedText.contains(doctorName)) {
                return doctor;
            }
        }

        return null;
    }

    private SpecialtyRecommendation recommendSpecialty(String text) {
        String normalizedText = normalizeText(text);
        if (normalizedText == null) {
            return new SpecialtyRecommendation(null, null);
        }

        if (containsAny(normalizedText, "두통", "어지럼", "어지러", "편두통", "마비", "저림")) {
            return new SpecialtyRecommendation("신경과", "두통, 어지럼 등 신경과 관련 증상이 확인되었습니다.");
        }

        if (containsAny(normalizedText, "기침", "가래", "호흡곤란", "숨참", "발열", "감기")) {
            return new SpecialtyRecommendation("내과", "기침, 가래, 호흡곤란 등 내과 관련 증상이 확인되었습니다.");
        }

        if (containsAny(normalizedText, "허리", "무릎", "어깨", "관절", "통증", "삐끗", "골절")) {
            return new SpecialtyRecommendation("정형외과", "허리, 무릎, 어깨 통증 등 정형외과 관련 증상이 확인되었습니다.");
        }

        return new SpecialtyRecommendation(null, null);
    }

    private Doctor findDoctorBySpecialty(String specialty, List<Doctor> doctors) {
        String normalizedSpecialty = normalizeText(specialty);

        for (Doctor doctor : doctors) {
            String doctorSpecialty = normalizeText(doctor.getSpecialty());
            if (
                    doctorSpecialty != null
                            && normalizedSpecialty != null
                            && doctorSpecialty.contains(normalizedSpecialty)
            ) {
                return doctor;
            }
        }

        return null;
    }

    private Doctor findPreviousDoctor(
            List<PatientCandidateDto> patientCandidates,
            List<Doctor> activeDoctors
    ) {
        if (patientCandidates == null || patientCandidates.isEmpty()) {
            return null;
        }

        Map<Long, Doctor> activeDoctorMap = new LinkedHashMap<>();
        for (Doctor doctor : activeDoctors) {
            activeDoctorMap.put(doctor.getId(), doctor);
        }

        for (PatientCandidateDto candidate : patientCandidates) {
            List<Appointment> appointments = appointmentRepository.findByPatientId(candidate.getId());

            for (Appointment appointment : appointments) {
                Long doctorId = appointment.getDoctor() == null
                        ? null
                        : appointment.getDoctor().getId();

                if (doctorId != null && activeDoctorMap.containsKey(doctorId)) {
                    return activeDoctorMap.get(doctorId);
                }
            }
        }

        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null || text.isBlank()) {
            return false;
        }

        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private List<String> splitToList(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split("\\n|,"))
                .map(item -> item.replaceAll("^[-*]\\s*", "").trim())
                .filter(item -> !item.isBlank())
                .toList();
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

    private String normalizePhone(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String digits = value.replaceAll("\\D", "");
        return digits.isBlank() ? null : digits;
    }

    private String resolvePhoneLast4(AiPatientExtractionDto extraction) {
        if (extraction == null) {
            return null;
        }

        String last4 = normalizePhone(extraction.getPhoneLast4());
        if (last4 != null && last4.length() >= 4) {
            return last4.substring(last4.length() - 4);
        }

        String phone = normalizePhone(extraction.getPhone());
        if (phone != null && phone.length() >= 4) {
            return phone.substring(phone.length() - 4);
        }

        return null;
    }

    private boolean phoneEndsWith(String phone, String last4) {
        String normalizedPhone = normalizePhone(phone);
        String normalizedLast4 = normalizePhone(last4);

        return normalizedPhone != null
                && normalizedLast4 != null
                && normalizedLast4.length() == 4
                && normalizedPhone.endsWith(normalizedLast4);
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.replaceAll("\\s+", "").trim();
    }

    private record DoctorRecommendation(
            Long doctorId,
            String doctorName,
            String reason
    ) {
    }

    private record SpecialtyRecommendation(
            String specialty,
            String reason
    ) {
    }

    private String createDoctorBriefing(
            String originalText,
            String nurseMemo,
            String summary,
            AiAnalysisResultDto analysisResult
    ) {
        StringBuilder input = new StringBuilder();

        appendBriefingField(input, "originalText", originalText);
        appendBriefingField(input, "nurseMemo", nurseMemo);
        appendBriefingField(input, "summary", summary);

        if (analysisResult != null) {
            appendBriefingField(input, "symptoms", analysisResult.getSymptoms());
            appendBriefingField(input, "riskLevel", analysisResult.getRiskLevel());
            appendBriefingField(input, "keywords", analysisResult.getKeywords());
        }

        return aiService.createDoctorBriefing(input.toString());
    }

    private void appendBriefingField(StringBuilder input, String label, String value) {
        if (value == null || value.isBlank()) {
            return;
        }

        input.append(label).append(": ").append(value.trim()).append("\n");
    }
}
