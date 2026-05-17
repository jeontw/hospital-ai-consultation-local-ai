package com.hospital.consultation.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "openai")
@RequiredArgsConstructor
public class OpenAiService implements AiService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Override
    public String summarize(String text) {

        String url = "https://api.openai.com/v1/chat/completions";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", "gpt-4.1-mini",
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content",
                                "당신은 병원 전화 상담 내용을 요약하는 AI입니다."
                        ),
                        Map.of(
                                "role", "user",
                                "content",
                                "다음 상담 내용을 2줄 이내로 요약하세요:\n" + text
                        )
                )
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        url,
                        request,
                        Map.class
                );

        List choices =
                (List) response.getBody().get("choices");

        Map firstChoice = (Map) choices.get(0);

        Map message = (Map) firstChoice.get("message");

        return (String) message.get("content");
    }
    public String analyze(String text) {

        String url = "https://api.openai.com/v1/chat/completions";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", "gpt-4.1-mini",
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content",
                                """
                                당신은 병원 전화 상담 내용을 분석하는 AI입니다.
                                반드시 JSON 형식으로만 응답하세요.
                                설명 문장, 마크다운, 코드블럭은 절대 쓰지 마세요.
    
                                JSON 형식:
                                {
                                  "symptoms": "주요 증상",
                                  "riskLevel": "낮음 또는 보통 또는 높음",
                                  "keywords": "키워드1, 키워드2, 키워드3"
                                }
                                """
                        ),
                        Map.of(
                                "role", "user",
                                "content",
                                "다음 상담 내용을 분석하세요:\n" + text
                        )
                )
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        url,
                        request,
                        Map.class
                );

        List choices =
                (List) response.getBody().get("choices");

        Map firstChoice = (Map) choices.get(0);
        Map message = (Map) firstChoice.get("message");

        return (String) message.get("content");
    }
    @Override
    public String separateSpeakers(String text) {

        String url = "https://api.openai.com/v1/chat/completions";

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "model", "gpt-4.1-mini",
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content",
                                """
                                당신은 병원 전화 상담 내용을 정리하는 AI입니다.
                                상담사와 환자의 발화를 구분하는 것이 목표입니다.
                                """
                        ),
                        Map.of(
                                "role", "user",
                                "content",
                                """
                                다음 병원 전화 상담 내용을 상담사와 환자 발화로 나누어 정리하세요.
    
                                규칙:
                                - 반드시 "상담사:" 또는 "환자:" 형식으로 작성하세요.
                                - 상담사의 질문, 확인, 안내는 "상담사:"로 작성하세요.
                                - 환자의 증상, 통증, 기간, 복용약, 상태 설명은 "환자:"로 작성하세요.
                                - 원문에 없는 의학적 판단이나 내용을 추가하지 마세요.
                                - 대화 흐름이 자연스럽도록 짧게 나누세요.
    
                                상담 내용:
                                """ + text
                        )
                )
        );

        HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        url,
                        request,
                        Map.class
                );

        List choices =
                (List) response.getBody().get("choices");

        Map firstChoice = (Map) choices.get(0);
        Map message = (Map) firstChoice.get("message");

        return (String) message.get("content");
    }

}