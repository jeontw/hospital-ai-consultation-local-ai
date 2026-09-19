package com.hospital.consultation.service;

import com.hospital.consultation.repository.AiAnalysisRepository;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ExperimentResetServiceTest {

    @Test
    void clearsExperimentRecordsInForeignKeySafeOrder() {
        AppointmentRepository appointmentRepository = mock(AppointmentRepository.class);
        AiAnalysisRepository aiAnalysisRepository = mock(AiAnalysisRepository.class);
        ConsultationRepository consultationRepository = mock(ConsultationRepository.class);
        ExperimentResetService service = new ExperimentResetService(
                appointmentRepository,
                aiAnalysisRepository,
                consultationRepository
        );

        when(appointmentRepository.count()).thenReturn(7L);
        when(consultationRepository.count()).thenReturn(5L);
        when(aiAnalysisRepository.count()).thenReturn(5L);

        ExperimentResetService.ResetResult result = service.resetExperimentData();

        InOrder deletionOrder = inOrder(
                appointmentRepository,
                aiAnalysisRepository,
                consultationRepository
        );
        deletionOrder.verify(appointmentRepository).deleteAllInBatch();
        deletionOrder.verify(aiAnalysisRepository).deleteAllInBatch();
        deletionOrder.verify(consultationRepository).deleteAllInBatch();
        assertThat(result.deletedAppointments()).isEqualTo(7L);
        assertThat(result.deletedConsultations()).isEqualTo(5L);
        assertThat(result.deletedAiAnalyses()).isEqualTo(5L);
    }
}
