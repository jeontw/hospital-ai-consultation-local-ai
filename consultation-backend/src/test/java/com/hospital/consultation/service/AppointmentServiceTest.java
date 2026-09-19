package com.hospital.consultation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.consultation.dto.AppointmentDraftDto;
import com.hospital.consultation.dto.AppointmentRequestDto;
import com.hospital.consultation.entity.Doctor;
import com.hospital.consultation.entity.Patient;
import com.hospital.consultation.repository.AppointmentRepository;
import com.hospital.consultation.repository.ConsultationRepository;
import com.hospital.consultation.repository.DoctorRepository;
import com.hospital.consultation.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AppointmentServiceTest {

    private AppointmentService appointmentService;
    private AppointmentRepository appointmentRepository;
    private PatientRepository patientRepository;
    private DoctorRepository doctorRepository;

    @BeforeEach
    void setUp() {
        appointmentRepository = mock(AppointmentRepository.class);
        patientRepository = mock(PatientRepository.class);
        doctorRepository = mock(DoctorRepository.class);
        appointmentService = new AppointmentService(
                appointmentRepository,
                patientRepository,
                mock(ConsultationRepository.class),
                doctorRepository,
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
    void resolvesSpacedMonthDayUsingTheCurrentYear() {
        AppointmentDraftDto aiDraft = new AppointmentDraftDto();
        aiDraft.setNeedReservation(true);
        aiDraft.setDateText("9월 19일");
        aiDraft.setTimeText("오후 2시");
        LocalDate expectedDate = LocalDate.of(LocalDate.now().getYear(), 9, 19);
        if (expectedDate.isBefore(LocalDate.now())) {
            expectedDate = expectedDate.plusYears(1);
        }

        AppointmentDraftDto result = appointmentService.normalizeAppointmentDraft(
                aiDraft,
                "9월 19일 오후 2시로 예약해주세요."
        );

        assertThat(result.getAppointmentDate()).isEqualTo(expectedDate + "T14:00:00");
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

    @Test
    void allowsAnotherFutureReservationAtADifferentTime() {
        LocalDateTime appointmentDate = LocalDateTime.now().plusDays(3).withSecond(0).withNano(0);
        Patient patient = new Patient();
        patient.setId(1L);
        Doctor doctor = new Doctor();
        doctor.setId(2L);
        doctor.setActive(true);
        AppointmentRequestDto request = new AppointmentRequestDto();
        request.setPatientId(patient.getId());
        request.setDoctorId(doctor.getId());
        request.setAppointmentDate(appointmentDate);
        request.setStatus("예약됨");

        when(patientRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));

        appointmentService.createAppointment(request);

        verify(appointmentRepository).existsByPatientIdAndAppointmentDateTimeAndStatus(
                patient.getId(),
                appointmentDate,
                "예약됨"
        );
        verify(appointmentRepository).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void rejectsOnlyTheSamePatientAtTheSameTime() {
        LocalDateTime appointmentDate = LocalDateTime.now().plusDays(3).withSecond(0).withNano(0);
        Patient patient = new Patient();
        patient.setId(1L);
        Doctor doctor = new Doctor();
        doctor.setId(2L);
        doctor.setActive(true);
        AppointmentRequestDto request = new AppointmentRequestDto();
        request.setPatientId(patient.getId());
        request.setDoctorId(doctor.getId());
        request.setAppointmentDate(appointmentDate);

        when(patientRepository.findById(patient.getId())).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(doctor.getId())).thenReturn(Optional.of(doctor));
        when(appointmentRepository.existsByPatientIdAndAppointmentDateTimeAndStatus(
                patient.getId(),
                appointmentDate,
                "예약됨"
        )).thenReturn(true);

        assertThatThrownBy(() -> appointmentService.createAppointment(request))
                .hasMessage("해당 환자는 같은 시간에 이미 예약되어 있습니다.");
    }
}
