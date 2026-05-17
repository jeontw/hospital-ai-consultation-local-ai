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
            ProcessBuilder processBuilder = new ProcessBuilder(
                    whisperExePath,
                    "-m",
                    whisperModelPath,
                    "-l",
                    whisperLanguage,
                    "-f",
                    audioFile.getAbsolutePath()
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
                    result.append(text).append(" ");
                }
            }

            process.waitFor();

            return result.toString().trim();

        } catch (Exception e) {
            return "로컬 Whisper 변환 실패: " + e.getMessage();
        }
    }
}