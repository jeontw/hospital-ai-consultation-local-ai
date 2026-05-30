package com.hospital.consultation.service;

import lombok.RequiredArgsConstructor;
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
    private final String model = "qwen2.5:3b";

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

                Required schema:
                {
                  "needReservation": true,
                  "dateText": "다음 주 수요일",
                  "timeText": "오후 2시",
                  "memo": "혈압 상태 확인 및 추가 상담",
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
                - memo should briefly summarize the reason for the reservation.
                - status should be "예약됨" when needReservation is true.

                Examples:
                - "2026년 6월 10일 오후 2시에 방문 예약을 원합니다." -> dateText "2026년 6월 10일", timeText "오후 2시"
                - "다음 주 수요일 오후 2시로 예약 부탁드립니다." -> dateText "다음 주 수요일", timeText "오후 2시"
                - "내일 오전 10시로 예약 부탁드립니다." -> dateText "내일", timeText "오전 10시"

                Consultation:
                """ + consultationText;

        return extractJsonObject(callOllama(prompt));
    }

    @Override
    public String separateSpeakers(String text) {
        String prompt = """
                You are a speaker separation assistant for hospital consultation audio transcripts.
                Respond in Korean only.
                Separate the dialogue into speaker-labeled lines.

                Transcript:
                """ + text;
        return callOllama(prompt);
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
