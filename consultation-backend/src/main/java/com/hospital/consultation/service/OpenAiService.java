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
}