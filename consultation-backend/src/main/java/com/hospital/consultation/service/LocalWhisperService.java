package com.hospital.consultation.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class LocalWhisperService {
    @Value("${whisper.exe-path}")
    private String whisperExePath;

    @Value("${whisper.model-path}")
    private String whisperModelPath;

    @Value("${whisper.language}")
    private String whisperLanguage;
    public String transcribe(java.io.File audioFile) {

        try {
            if (!new java.io.File(whisperExePath).exists()) {
                return "로컬 Whisper 실행 파일을 찾을 수 없습니다: " + whisperExePath;
            }

            if (!new java.io.File(whisperModelPath).exists()) {
                return "로컬 Whisper 모델 파일을 찾을 수 없습니다: " + whisperModelPath;
            }

            if (!audioFile.exists()) {
                return "음성 파일을 찾을 수 없습니다: " + audioFile.getAbsolutePath();
            }
            ProcessBuilder processBuilder = new ProcessBuilder(
                    whisperExePath,
                    "-m",
                    whisperModelPath,
                    "-l",
                    whisperLanguage,
                    "-f",
                    audioFile.getAbsolutePath(),
                    "--prompt",
                    "병원 전화 상담입니다. 증상, 기침, 두통, 발열, 복통, 어지러움, 약 처방, 진료 예약 같은 단어가 나올 수 있습니다."
            );

            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            StringBuilder result = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.contains("-->")) {
                    String text = line.replaceAll("\\[.*?\\]", "").trim();

                    if (!text.isBlank()) {
                        result.append(text).append(" ");
                    }
                }
            }

            process.waitFor();

            String text = result.toString().trim();

            if (text.isBlank()) {
                return "음성 인식 결과가 비어 있습니다. 음성 파일 길이, 언어 설정, 모델 파일을 확인해주세요.";
            }

            return text;

        } catch (Exception e) {
            return "로컬 Whisper 변환 실패: " + e.getMessage();
        }
    }
}