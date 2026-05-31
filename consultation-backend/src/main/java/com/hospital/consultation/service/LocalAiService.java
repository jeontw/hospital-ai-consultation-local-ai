package com.hospital.consultation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "local")
@RequiredArgsConstructor
public class LocalAiService implements AiService {

    private final String ollamaUrl = "http://localhost:11434/api/generate";

    @Value("${ollama.model:qwen2.5:7b}")
    private String model;

    @Override
    public String summarize(String text) {
        String prompt = """
                You are a hospital consultation summarization assistant.
                Respond in Korean only.
                Summarize the consultation in 2 short sentences.

                Consultation:
                """ + text;
        return callOllama(prompt);
    }

    @Override
    public String analyze(String text) {
        String prompt = """
                You are a hospital consultation analysis assistant.
                Respond with JSON only.
                Do not include markdown, code fences, backticks, or any explanation.

                Output schema:
                {
                  "symptoms": "short symptom summary",
                  "riskLevel": "낮음 | 보통 | 높음",
                  "keywords": "comma separated keywords"
                }

                Consultation:
                """ + text;
        return extractJsonObject(callOllama(prompt));
    }

    @Override
    public String extractAppointmentDraft(String consultationText) {
        String prompt = """
                You are a hospital appointment draft extraction assistant.
                Respond with JSON only.
                Do not include markdown, code fences, backticks, explanations, or any extra text.
                Return exactly one JSON object and nothing else.

                Common rules:
                - Use Korean only for all string values.
                - Do not copy raw dialogue lines into output fields.
                - Do not include speaker labels, greetings, thanks, nurse guidance, reservation confirmations, or conversational filler in output fields.
                - Keep each extracted value concise and task-specific.

                Required schema:
                {
                  "needReservation": true,
                  "dateText": "다음 주 수요일",
                  "timeText": "오후 2시",
                  "memo": "혈압 상승과 두통 증상으로 진료 희망",
                  "status": "예약됨"
                }

                If there is no reservation intent, return:
                {
                  "needReservation": false,
                  "dateText": null,
                  "timeText": null,
                  "memo": null,
                  "status": null
                }

                Rules:
                - Set needReservation to true only when the patient clearly wants a reservation or appointment.
                - If the text does not mention reservation intent, set needReservation to false.
                - Extract date and time as separate fields.
                - Do not calculate the final appointment date in the AI response.
                - Preserve relative expressions such as "내일", "모레", "다음 주 수요일", "이번 주 금요일" in dateText.
                - Preserve time expressions such as "오전 10시", "오후 2시", "14시", "14:30", "오후 3시 30분" in timeText.
                - If only a date is mentioned, set timeText to null.
                - If only a time is mentioned, set dateText to null.
                - memo is the visit reason field, not a reservation note field.
                - memo must contain only the patient's visit reason in one Korean sentence.
                - memo format must be "[주요 증상]으로 진료 희망" or "[주요 증상]으로 상담 희망".
                - Do not copy dialogue, speaker labels, greetings, nurse guidance, reservation confirmations, dates, or times into memo.
                - Derive memo from the patient's symptoms or reason for wanting care.
                - memo must never include: "안녕하세요", "감사합니다", "예약 부탁드립니다", "예약 가능합니다", "예약해드리겠습니다", "방문 가능한 시간이 있으실까요", "그 시간으로 진행해드릴까요", "증상이 지속되면 진료를 받아보시는 것이 좋겠습니다", "알겠습니다", "네", "환자", "선생님", "상담사", "간호사", speaker names, date expressions, or time expressions.
                - Good memo examples: "수면장애와 피로감으로 진료 희망", "혈압 상승과 두통으로 진료 희망", "기침과 가래 지속으로 진료 희망", "불안감과 수면 저하로 상담 희망".
                - Bad memo examples: "안녕하세요. 증상이 지속되면 진료를 받아보시는 것이 좋겠습니다.", "내일 오전 10시 예약 가능합니다.", "네, 그 시간으로 예약 부탁드립니다."
                - status should be "예약됨" when needReservation is true.

                Examples:
                - "2026년 6월 10일 오후 2시에 방문 예약을 원합니다." -> dateText "2026년 6월 10일", timeText "오후 2시"
                - "다음 주 수요일 오후 2시로 예약 부탁드립니다." -> dateText "다음 주 수요일", timeText "오후 2시"
                - "내일 오전 10시로 예약 부탁드립니다." -> dateText "내일", timeText "오전 10시"
                - "수면장애와 피로감이 있어서 다음 주 수요일 오후 2시에 방문 예약을 원합니다." -> memo "수면장애와 피로감으로 진료 희망"
                - "요즘 잠을 잘 못 자고 새벽에 자주 깨요. 내일 오전 10시 예약 부탁드립니다." -> memo "수면장애와 피로감으로 진료 희망"
                - "혈압이 오르고 머리가 아픕니다. 다음 주 수요일 예약 원합니다." -> memo "혈압 상승과 두통으로 진료 희망"

                Consultation:
                """ + consultationText;

        return extractJsonObject(callOllama(prompt));
    }

    @Override
    public String createDoctorBriefing(String briefingInput) {
        String prompt = """
                You are a clinical briefing assistant for doctors.
                Respond with JSON only.
                Do not include markdown, code fences, backticks, explanations, or any extra text.
                Return exactly one JSON object and nothing else.

                Important rules:
                - Write in Korean only.
                - This is a pre-visit reference note for a doctor, not a diagnosis.
                - Do not diagnose, do not state certainty, and do not recommend treatment.
                - Keep the content short, factual, and based only on the provided consultation data.
                - Use patient symptoms, nurse memo, summary, symptoms, riskLevel, and keywords when available.
                - If information is missing, write a confirmation-needed item instead of inventing facts.

                Required schema:
                {
                  "visitReason": "수면장애와 피로감으로 진료 희망",
                  "mainSymptoms": ["수면장애", "피로감", "새벽 각성"],
                  "specialNotes": ["하루 평균 수면시간 확인 필요", "증상 지속 기간 확인 필요"],
                  "attentionLevel": "낮음 | 보통 | 높음",
                  "recommendedQuestions": [
                    "증상은 언제부터 시작되었나요?",
                    "복용 중인 약이 있나요?",
                    "일상생활에 지장이 있나요?"
                  ]
                }

                Field rules:
                - visitReason must be one sentence in the format "[주요 증상]으로 진료 희망" or "[주요 증상]으로 상담 희망".
                - mainSymptoms must contain 2 to 5 concise symptom keywords.
                - specialNotes must contain 1 to 4 factual notes or confirmation-needed items.
                - attentionLevel must be one of "낮음", "보통", "높음"; map similar risk values into these labels.
                - recommendedQuestions must contain 2 to 5 questions the doctor can ask before or during the visit.

                Consultation data:
                """ + briefingInput;

        return extractJsonObject(callOllama(prompt));
    }

    private String callOllama(String prompt) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> options = Map.of(
                    "temperature", 0,
                    "num_predict", 512,
                    "top_p", 0.1
            );

            Map<String, Object> body = Map.of(
                    "model", model,
                    "prompt", prompt,
                    "stream", false,
                    "options", options
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(ollamaUrl, request, Map.class);

            Object responseText = response.getBody() == null ? null : response.getBody().get("response");
            return responseText == null ? "" : responseText.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String extractJsonObject(String response) {
        if (response == null || response.isBlank()) {
            return "{}";
        }

        String cleaned = response
                .replace("```json", "")
                .replace("```", "")
                .trim();

        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');

        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }

        return cleaned;
    }
}
