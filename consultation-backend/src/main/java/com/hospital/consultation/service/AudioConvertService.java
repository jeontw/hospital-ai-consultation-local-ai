package com.hospital.consultation.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;

@Service
public class AudioConvertService {

    public String convertToMp3(String inputPath) {
        try {
            File inputFile = new File(inputPath);

            if (!inputFile.exists()) {
                throw new RuntimeException("입력 파일이 존재하지 않습니다: " + inputPath);
            }

            String outputPath = inputPath.substring(0, inputPath.lastIndexOf(".")) + ".mp3";

            ProcessBuilder processBuilder = new ProcessBuilder(
                    "C:/dev/tools/ffmpeg/bin/ffmpeg.exe",
                    "-y",
                    "-i", inputPath,
                    "-vn",
                    "-ar", "44100",
                    "-ac", "2",
                    "-b:a", "192k",
                    outputPath
            );

            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("[FFmpeg] " + line);
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("mp3 변환 실패, exitCode: " + exitCode);
            }

            return outputPath;

        } catch (Exception e) {
            throw new RuntimeException("오디오 변환 중 오류 발생", e);
        }
    }
}