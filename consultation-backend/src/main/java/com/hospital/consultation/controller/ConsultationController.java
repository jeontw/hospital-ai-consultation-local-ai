package com.hospital.consultation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consultation.dto.AiAnalysisResultDto;
import com.hospital.consultation.dto.ConsultationRequestDto;
import com.hospital.consultation.entity.AiAnalysis;
import com.hospital.consultation.entity.Consultation;
import com.hospital.consultation.entity.Patient;
import com.hospital.consultation.repository.AiAnalysisRepository;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
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

import java.time.LocalDateTime;
import java.util.List;

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
    private final ObjectMapper objectMapper;
    private final AudioConvertService audioConvertService;

    @PostMapping("/{patientId}")
    public Consultation createConsultation(
            @PathVariable Long patientId,
            @RequestBody ConsultationRequestDto requestDto
    ) throws Exception {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

        String originalText = requestDto.getOriginalText();

        if (originalText == null || originalText.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "상담 내용은 비어 있을 수 없습니다.");
        }

        String speakerText =
                aiService.separateSpeakers(originalText);

        String summary = aiService.summarize(originalText);


        Consultation consultation = new Consultation();
        consultation.setPatient(patient);
        consultation.setOriginalText(originalText);
        consultation.setAudioPath(requestDto.getAudioPath());
        consultation.setSummary(summary);
        consultation.setCreatedAt(LocalDateTime.now());
        consultation.setSpeakerText(speakerText);

        Consultation savedConsultation = consultationRepository.save(consultation);

        String analysisJson = aiService.analyze(originalText);

        AiAnalysisResultDto result =
                objectMapper.readValue(analysisJson, AiAnalysisResultDto.class);

        AiAnalysis aiAnalysis = new AiAnalysis();
        aiAnalysis.setConsultation(savedConsultation);
        aiAnalysis.setSymptoms(result.getSymptoms());
        aiAnalysis.setRiskLevel(result.getRiskLevel());
        aiAnalysis.setKeywords(result.getKeywords());

        aiAnalysisRepository.save(aiAnalysis);

        return savedConsultation;
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

    @PostMapping("/upload/{patientId}")
    public Consultation uploadConsultation(
            @PathVariable Long patientId,
            @RequestParam("file") MultipartFile file
    ) throws Exception {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("환자를 찾을 수 없습니다."));

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

        String originalText =
                localWhisperService.transcribe(
                        new java.io.File(convertedPath)
                );

        String speakerText =
                aiService.separateSpeakers(originalText);

        String summary = aiService.summarize(originalText);

        Consultation consultation = new Consultation();
        consultation.setPatient(patient);
        consultation.setOriginalText(originalText);
        consultation.setSummary(summary);
        consultation.setAudioPath("/uploads/" + fileName);
        consultation.setCreatedAt(LocalDateTime.now());
        consultation.setSpeakerText(speakerText);

        Consultation savedConsultation = consultationRepository.save(consultation);

        String analysisJson = aiService.analyze(originalText);

        AiAnalysisResultDto result =
                objectMapper.readValue(analysisJson, AiAnalysisResultDto.class);

        AiAnalysis aiAnalysis = new AiAnalysis();
        aiAnalysis.setConsultation(savedConsultation);
        aiAnalysis.setSymptoms(result.getSymptoms());
        aiAnalysis.setRiskLevel(result.getRiskLevel());
        aiAnalysis.setKeywords(result.getKeywords());

        aiAnalysisRepository.save(aiAnalysis);

        return savedConsultation;
    }

    @Transactional
    @PutMapping("/{consultationId}")
    public Consultation updateConsultation(
            @PathVariable Long consultationId,
            @RequestBody ConsultationRequestDto requestDto
    ) throws Exception {
        Consultation consultation = consultationRepository.findById(consultationId)
                .orElseThrow(() -> new RuntimeException("상담을 찾을 수 없습니다."));

        String originalText = requestDto.getOriginalText();

        consultation.setOriginalText(originalText);

        String speakerText =
                aiService.separateSpeakers(originalText);

        consultation.setSpeakerText(speakerText);

        String summary = aiService.summarize(originalText);

        consultation.setSummary(summary);

        Consultation savedConsultation = consultationRepository.save(consultation);

        AiAnalysis aiAnalysis = savedConsultation.getAiAnalysis();

        if (aiAnalysis == null) {
            aiAnalysis = new AiAnalysis();
            aiAnalysis.setConsultation(savedConsultation);
        }

        String analysisJson = aiService.analyze(originalText);

        AiAnalysisResultDto result =
                objectMapper.readValue(analysisJson, AiAnalysisResultDto.class);

        aiAnalysis.setSymptoms(result.getSymptoms());
        aiAnalysis.setRiskLevel(result.getRiskLevel());
        aiAnalysis.setKeywords(result.getKeywords());

        aiAnalysisRepository.save(aiAnalysis);

        return savedConsultation;
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
}
