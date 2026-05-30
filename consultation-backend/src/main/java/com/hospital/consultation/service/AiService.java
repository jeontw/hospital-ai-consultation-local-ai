package com.hospital.consultation.service;

public interface AiService {

    String summarize(String text);

    String analyze(String text);

    String separateSpeakers(String text);

    String extractAppointmentDraft(String consultationText);
}
