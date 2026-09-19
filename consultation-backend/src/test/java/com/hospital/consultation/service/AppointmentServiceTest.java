package com.hospital.consultation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consultation.dto.AppointmentDraftDto;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import com.hospital.consultation.repository.DoctorRepository;
import com.hospital.consultation.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class AppointmentServiceTest {

    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        appointmentService = new AppointmentService(
                mock(AppointmentRepository.class),
                mock(PatientRepository.class),
                mock(ConsultationRepository.class),
                mock(DoctorRepository.class),
                mock(AiService.class),
                new ObjectMapper()
        );
    }

    @Test
    void restoresReservationIntentAndDateTimeWhenAiMissesIt() {
        AppointmentDraftDto aiDraft = new AppointmentDraftDto();
        aiDraft.setNeedReservation(false);

        AppointmentDraftDto result = appointmentService.normalizeAppointmentDraft(
                aiDraft,
                "기침이 3일째입니다. 내일 오전 10시로 예약 부탁드립니다."
        );

        assertThat(result.getNeedReservation()).isTrue();
        assertThat(result.getAppointmentDate())
                .isEqualTo(LocalDate.now().plusDays(1) + "T10:00:00");
        assertThat(result.getStatus()).isEqualTo("예약됨");
    }

    @Test
    void understandsKoreanWeekdayAndHalfHourExpressions() {
        AppointmentDraftDto aiDraft = new AppointmentDraftDto();
        aiDraft.setNeedReservation(false);
        LocalDate expectedDate = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .plusWeeks(1)
                .with(TemporalAdjusters.nextOrSame(DayOfWeek.WEDNESDAY));

        AppointmentDraftDto result = appointmentService.normalizeAppointmentDraft(
                aiDraft,
                "다음 주 수요일 오후 두 시 반으로 예약해주세요."
        );

        assertThat(result.getNeedReservation()).isTrue();
        assertThat(result.getAppointmentDate()).isEqualTo(expectedDate + "T14:30:00");
    }

    @Test
    void doesNotCreateReservationWithoutReservationIntent() {
        AppointmentDraftDto aiDraft = new AppointmentDraftDto();
        aiDraft.setNeedReservation(false);

        AppointmentDraftDto result = appointmentService.normalizeAppointmentDraft(
                aiDraft,
                "기침이 3일째라서 상담하고 싶습니다."
        );

        assertThat(result.getNeedReservation()).isFalse();
        assertThat(result.getAppointmentDate()).isNull();
    }

    @Test
    void recognizesReservationIntentEvenWhenScheduleIsMissing() {
        AppointmentDraftDto aiDraft = new AppointmentDraftDto();
        aiDraft.setNeedReservation(false);

        AppointmentDraftDto result = appointmentService.normalizeAppointmentDraft(
                aiDraft,
                "진료 예약을 해주세요."
        );

        assertThat(result.getNeedReservation()).isTrue();
        assertThat(result.getAppointmentDate()).isNull();
        assertThat(result.getStatus()).isEqualTo("예약됨");
    }
}
