package com.hospital.consultation.service;

import com.hospital.consultation.repository.AiAnalysisRepository;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExperimentResetService {

    private final AppointmentRepository appointmentRepository;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final ConsultationRepository consultationRepository;

    @Transactional
    public ResetResult resetExperimentData() {
        long appointmentCount = appointmentRepository.count();
        long analysisCount = aiAnalysisRepository.count();
        long consultationCount = consultationRepository.count();

        appointmentRepository.deleteAllInBatch();
        aiAnalysisRepository.deleteAllInBatch();
        consultationRepository.deleteAllInBatch();

        return new ResetResult(appointmentCount, consultationCount, analysisCount);
    }

    public record ResetResult(
            long deletedAppointments,
            long deletedConsultations,
            long deletedAiAnalyses
    ) {
    }
}
