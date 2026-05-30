package com.hospital.consultation.service;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

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
                당신은 병원 전화 상담 내용을 요약하는 AI입니다.
                반드시 한국어로만 답변하세요.
                진단하지 말고 상담 내용을 2줄 이내로 요약하세요.

                상담 내용:
                """ + text;

        return callOllama(prompt);
    }

    @Override
    public String analyze(String text) {
        String prompt = """
        당신은 병원 전화 상담 내용을 분석하는 AI입니다.
        반드시 한국어로만 답변하세요.

        아래 JSON 객체 하나만 출력하세요.
        JSON 앞뒤에 설명, 마크다운, 코드블럭을 절대 붙이지 마세요.
        riskLevel은 반드시 "낮음", "보통", "높음" 중 하나만 사용하세요.
        keywords는 쉼표로 구분된 문자열로 작성하세요.

        {
          "symptoms": "주요 증상",
          "riskLevel": "낮음",
          "keywords": "키워드1, 키워드2, 키워드3"
        }

        상담 내용:
        """ + text;

        return extractJson(callOllama(prompt));
    }

    @Override
    public String extractAppointmentDraft(String consultationText) {
        String prompt = """
        당신은 병원 예약 업무를 보조하는 AI입니다.
        진단, 의학적 판단, 치료 권고를 하지 마세요.
        상담 내용에서 실제로 예약 시간이 합의된 경우에만 예약 초안을 작성하세요.

        반드시 아래 JSON 객체 하나만 출력하세요.
        JSON 앞뒤에 설명, 마크다운, 코드블럭을 절대 붙이지 마세요.

        출력 필드:
        {
          "appointmentConfirmed": false,
          "appointmentDateTime": null,
          "purpose": "",
          "status": "예정",
          "memo": "",
          "reason": ""
        }

        판단 규칙:
        - 환자가 예약 시간에 명확히 동의한 경우만 appointmentConfirmed를 true로 설정하세요.
        - 상담사가 시간만 제안하고 환자가 동의하지 않았으면 appointmentConfirmed는 false입니다.
        - 예약 관련 대화가 없으면 appointmentConfirmed는 false입니다.
        - 날짜 또는 시간이 불명확하면 appointmentConfirmed는 false입니다.
        - appointmentDateTime은 확정된 경우에만 "yyyy-MM-dd'T'HH:mm:ss" 형식으로 작성하세요.
        - appointmentConfirmed가 false이면 appointmentDateTime은 반드시 null입니다.
        - status 기본값은 "예정"입니다.
        - purpose는 예약 목적만 짧게 작성하세요.
        - memo에는 예약 판단에 필요한 근거만 간단히 작성하세요.
        - reason에는 true/false 판단 이유를 한국어로 작성하세요.

        상담 내용:
        """ + consultationText;

        return extractAppointmentDraftJson(callOllama(prompt));
    }

    private String callOllama(String prompt) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> options = Map.of(
                    "temperature", 0,
                    "num_predict", 500,
                    "top_p", 0.1
            );

            Map<String, Object> body = Map.of(
                    "model", model,
                    "prompt", prompt,
                    "stream", false,
                    "options", options
            );

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(body, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(
                            ollamaUrl,
                            request,
                            Map.class
                    );

            return (String) response.getBody().get("response");

        } catch (Exception e) {
            return "로컬 AI 연결 실패: Ollama 앱이 실행 중인지 확인하고, 모델이 설치되어 있는지 확인해주세요. 현재 모델: " + model;
        }
    }
    private String extractJson(String response) {

        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");

        if (start != -1 && end != -1 && end > start) {
            return response.substring(start, end + 1);
        }

        return """
            {
              "symptoms": "분석 실패",
              "riskLevel": "보통",
              "keywords": "없음"
            }
            """;
    }

    private String extractAppointmentDraftJson(String response) {

        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");

        if (start != -1 && end != -1 && end > start) {
            return response.substring(start, end + 1);
        }

        return """
            {
              "appointmentConfirmed": false,
              "appointmentDateTime": null,
              "purpose": "",
              "status": "예정",
              "memo": "",
              "reason": "AI 응답에서 예약 초안 JSON을 추출하지 못했습니다."
            }
            """;
    }

    @Override
    public String separateSpeakers(String text) {
        String prompt = """
            당신은 병원 전화 상담 STT 결과에 화자 라벨을 붙이는 AI입니다.

            매우 중요한 규칙:
            - 출력 라벨은 반드시 "상담사:" 또는 "환자:" 두 개만 사용하세요.
            - "환자분:" 이라는 라벨은 절대 사용하지 마세요.
            - 원문 문장의 순서를 절대 바꾸지 마세요.
            - 원문에 있는 문장을 삭제하지 마세요.
            - 원문에 없는 문장을 추가하지 마세요.
            - 문장 내용을 새로 만들지 마세요.
            - 각 발화 앞에 라벨만 붙이세요.
            - "환자분 어서 오세요"는 반드시 상담사 발화입니다.
            - "약을 처방해 드리겠습니다", "운동을 하시면 됩니다", "비타민 D가 중요합니다"는 상담사 발화입니다.
            - 검사 결과, 불편함, 생활 습관 설명은 환자 발화입니다.
            - 설명, 제목, 분석은 쓰지 마세요.

            상담 내용:
            """ + text;

        return callOllama(prompt);
    }
}
