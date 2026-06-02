package com.hospital.consultation.service;

public interface AiService {

    String summarize(String text);

    String analyze(String text);

    String extractPatientProfile(String consultationText);

    String extractAppointmentDraft(String consultationText);

    String createDoctorBriefing(String briefingInput);
}
