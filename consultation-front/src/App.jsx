import { useCallback, useEffect, useRef, useState } from "react";

import {
  getPatients,
  createPatient,
  deletePatientById,
  updatePatientById,
} from "./api/patientApi";
import {
  getConsultations,
  getConsultationsByPatient,
  createTextConsultation,
  uploadConsultationAudio,
  deleteConsultationById,
  updateConsultationById,
} from "./api/consultationApi";
import {
  createAppointment,
  createAppointmentDraft,
  deleteAppointmentById,
  getAppointments,
  getAppointmentsByConsultation,
  getAppointmentsByPatient,
  updateAppointmentStatus,
} from "./api/appointmentApi";
import { getAiModel, updateAiModel } from "./api/aiModelApi";
import {
  createDoctor,
  deleteDoctorById,
  getDoctors,
  updateDoctorById,
} from "./api/doctorApi";

import PatientForm from "./components/PatientForm";
import ConsultationForm from "./components/ConsultationForm";
import PatientList from "./components/PatientList";
import ConsultationDetail from "./components/ConsultationDetail";
import PatientInsight from "./components/PatientInsight";
import AppointmentForm from "./components/AppointmentForm";
import AppointmentList from "./components/AppointmentList";
import DoctorWeeklyCalendar from "./components/DoctorWeeklyCalendar";
import DoctorManagement from "./components/DoctorManagement";

function getTodayDateInputValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function App() {
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [aiModel, setAiModel] = useState("");
  const [aiModelOptions, setAiModelOptions] = useState([
    "qwen2.5:3b",
    "qwen2.5:7b",
    "exaone3.5:7.8b",
  ]);
  const [isAiModelSaving, setIsAiModelSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [registrationMode, setRegistrationMode] = useState("audio");
  const [consultationText, setConsultationText] = useState("");
  const [nurseMemo, setNurseMemo] = useState("");
  const [selectedViewPatientId, setSelectedViewPatientId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [, setConsultationAppointments] = useState([]);
  const [, setPatientAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedPatientAppointments, setSelectedPatientAppointments] = useState([]);
  const [isAppointmentSaving, setIsAppointmentSaving] = useState(false);
  const [appointmentDraft, setAppointmentDraft] = useState({
    appointmentDate: "",
    dateText: "",
    timeText: "",
    memo: "",
    status: "예약됨",
    doctorId: "",
  });
  const [selectedWeek, setSelectedWeek] = useState(getTodayDateInputValue());
  const [, setViewMode] = useState("list");

  const fileInputRef = useRef(null);
  const appointmentDraftCacheRef = useRef(new Map());
  const appointmentDraftInFlightRef = useRef(new Map());
  const lastAutoDraftConsultationIdRef = useRef(null);

  const fetchPatients = async () => {
    try {
      const response = await getPatients();
      console.log("환자 목록:", response.data);
      setPatients(response.data);
    } catch (error) {
      console.error("환자 조회 실패:", error);
    }
  };

  const fetchConsultations = async () => {
    try {
      const response = await getConsultations();
      console.log("상담 목록:", response.data);
      setConsultations(response.data);
      return response.data;
    } catch (error) {
      console.error("상담 조회 실패:", error);
      return [];
    }
  };
  const fetchPatientConsultations = async (patientId) => {
    try {
      const response = await getConsultationsByPatient(patientId);
      setConsultations(response.data);
      return response.data;
    } catch (error) {
      console.error("환자 상담 조회 실패:", error);
      return [];
    }
  };
  const fetchAppointmentsForConsultation = async (consultation) => {
    if (!consultation) {
      setConsultationAppointments([]);
      setPatientAppointments([]);
      return;
    }

    try {
      const consultationResponse = await getAppointmentsByConsultation(
        consultation.id,
      );
      setConsultationAppointments(consultationResponse.data);

      const patientId = consultation.patient?.id;

      if (patientId) {
        const patientResponse = await getAppointmentsByPatient(patientId);
        setPatientAppointments(patientResponse.data);
      } else {
        setPatientAppointments([]);
      }
    } catch (error) {
      console.error("예약 목록 조회 실패:", error);
    }
  };
  const fetchAllAppointments = async () => {
    try {
      const response = await getAppointments();
      setAllAppointments(response.data);
      return response.data;
    } catch (error) {
      console.error("예약 목록 조회 실패:", error);
      return [];
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await getDoctors();
      setDoctors(response.data);
      return response.data;
    } catch (error) {
      console.error("의사 목록 조회 실패:", error);
      return [];
    }
  };

  const fetchAiModel = async () => {
    try {
      const response = await getAiModel();
      setAiModel(response.data.model || "");
      if (Array.isArray(response.data.allowedModels)) {
        setAiModelOptions(response.data.allowedModels);
      }
      return response.data;
    } catch (error) {
      console.error("AI 모델 조회 실패:", error);
      return null;
    }
  };

  const changeAiModel = async (event) => {
    const nextModel = event.target.value;
    setAiModel(nextModel);
    setIsAiModelSaving(true);

    try {
      const response = await updateAiModel(nextModel);
      setAiModel(response.data.model || nextModel);
      if (Array.isArray(response.data.allowedModels)) {
        setAiModelOptions(response.data.allowedModels);
      }
    } catch (error) {
      console.error("AI 모델 변경 실패:", error);
      alert(error.response?.data?.message || "AI 모델 변경 실패");
      fetchAiModel();
    } finally {
      setIsAiModelSaving(false);
    }
  };

  const addDoctor = async (doctor) => {
    try {
      await createDoctor({
        name: doctor.name.trim(),
        specialty: doctor.specialty.trim(),
        active: true,
      });
      alert("의사 등록 성공");
      fetchDoctors();
      return true;
    } catch (error) {
      console.error("의사 등록 실패:", error);
      alert(error.response?.data?.message || "의사 등록 실패");
      return false;
    }
  };

  const updateDoctor = async (doctorId, doctor) => {
    try {
      await updateDoctorById(doctorId, {
        name: doctor.name.trim(),
        specialty: doctor.specialty.trim(),
        active: doctor.active,
      });
      alert("의사 수정 성공");
      fetchDoctors();
      return true;
    } catch (error) {
      console.error("의사 수정 실패:", error);
      alert(error.response?.data?.message || "의사 수정 실패");
      return false;
    }
  };

  const deleteDoctor = async (doctorId) => {
    const confirmDelete = confirm(
      "의사를 삭제할까요? 예약이 연결된 의사는 비활성화됩니다.",
    );

    if (!confirmDelete) {
      return false;
    }

    try {
      await deleteDoctorById(doctorId);
      alert("의사 삭제 처리 완료");
      const nextDoctors = await fetchDoctors();

      const deletedDoctor = nextDoctors.find(
        (doctor) => String(doctor.id) === String(doctorId),
      );

      if (!deletedDoctor || deletedDoctor.active === false) {
        setAppointmentDraft((current) =>
          String(current.doctorId) === String(doctorId)
            ? { ...current, doctorId: "" }
            : current,
        );
      }

      return true;
    } catch (error) {
      console.error("의사 삭제 실패:", error);
      alert(error.response?.data?.message || "의사 삭제 실패");
      return false;
    }
  };

  const fetchSelectedPatientAppointments = async (patientId) => {
    if (!patientId) {
      setSelectedPatientAppointments([]);
      return [];
    }

    try {
      const response = await getAppointmentsByPatient(patientId);
      setSelectedPatientAppointments(response.data);
      return response.data;
    } catch (error) {
      console.error("환자 예약 목록 조회 실패:", error);
      return [];
    }
  };
  const clearAppointmentDraft = () => {
    setAppointmentDraft({
      appointmentDate: "",
      dateText: "",
      timeText: "",
      memo: "",
      status: "예약됨",
      doctorId: "",
    });
  };

  const applyAppointmentDraft = useCallback((draft) => {
    if (!draft) {
      return;
    }

    setAppointmentDraft({
      appointmentDate: draft.appointmentDate || draft.appointmentDateTime || "",
      dateText: draft.dateText || draft.dateExpression || "",
      timeText: draft.timeText || draft.timeExpression || "",
      memo: draft.memo || "",
      status: draft.status || "예약됨",
      doctorId: "",
    });
  }, []);

  const hasAppointmentIntent = useCallback((draft) => {
    return Boolean(draft?.needReservation || draft?.appointmentConfirmed);
  }, []);

  const selectConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    setSelectedPatient(consultation?.patient || null);
    setViewMode("detail");
    fetchAppointmentsForConsultation(consultation);
    fetchSelectedPatientAppointments(consultation?.patient?.id);
  };

  const selectPatientForView = async (patientId) => {
    setSelectedViewPatientId(patientId);
    setSelectedPatientId(patientId);
    setSelectedConsultation(null);
    setViewMode("list");
    setConsultationAppointments([]);
    setPatientAppointments([]);
    setSelectedPatientAppointments([]);
    clearAppointmentDraft();

    const patient = patients.find(
      (patient) => String(patient.id) === String(patientId),
    );

    setSelectedPatient(patient || null);

    if (patientId === "") {
      fetchConsultations();
    } else {
      fetchPatientConsultations(patientId);
      fetchSelectedPatientAppointments(patientId);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchPatients();
      fetchConsultations();
      fetchAllAppointments();
      fetchDoctors();
      fetchAiModel();
    }, 0);
  }, []);

  const addPatient = async () => {
    try {
      await createPatient({
        name,
        phone,
        birth,
      });

      alert("환자 등록 성공");

      setName("");
      setPhone("");
      setBirth("");

      fetchPatients();
    } catch (error) {
      console.error("환자 등록 실패:", error);
      alert("환자 등록 실패");
    }
  };
  const deletePatient = async (patientId) => {
    console.log("App에서 받은 환자 ID:", patientId);

    if (!patientId) {
      alert("삭제할 환자 ID가 없습니다.");
      return;
    }

    const confirmDelete = confirm(`정말 ${patientId}번 환자를 삭제할까요?`);

    if (!confirmDelete) {
      return;
    }

    try {
      await deletePatientById(patientId);
      alert("환자 삭제 완료");

      setSelectedViewPatientId("");
      setSelectedConsultation(null);
      setSelectedPatient(null);
      setSelectedPatientId("");
      setViewMode("list");
      setSelectedPatientAppointments([]);
      clearAppointmentDraft();

      fetchPatients();
      fetchConsultations();
      fetchAllAppointments();
    } catch (error) {
      console.error("환자 삭제 실패:", error);
      alert(
        "상담 기록이 있는 환자는 삭제할 수 없습니다. 환자 정보 수정 기능을 사용하세요.",
      );
    }
  };
  const updatePatient = async (patientId, updatedPatient) => {
    try {
      await updatePatientById(patientId, updatedPatient);

      alert("환자 정보 수정 완료");

      fetchPatients();
    } catch (error) {
      console.error("환자 수정 실패:", error);
      alert("환자 수정 실패");
    }
  };
  const addConsultation = async () => {
    if (!selectedPatientId) {
      alert("환자를 선택하세요");
      return;
    }

    const trimmedConsultationText = consultationText.trim();
    const trimmedNurseMemo = nurseMemo.trim();

    if (!audioFile && !trimmedConsultationText && !trimmedNurseMemo) {
      alert("음성 파일 또는 간호사 메모를 입력하세요");
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (audioFile) {
        setLoadingMessage("음성 파일 업로드 중...");

        const formData = new FormData();
        formData.append("file", audioFile);
        formData.append("nurseMemo", trimmedNurseMemo);
        setLoadingMessage("음성 변환 및 STT 분석 중...");

        response = await uploadConsultationAudio(selectedPatientId, formData);
      } else {
        setLoadingMessage("상담 내용 AI 분석 및 저장 중...");

        response = await createTextConsultation(selectedPatientId, {
          originalText: trimmedConsultationText,
          nurseMemo: trimmedNurseMemo,
          audioPath: null,
        });
      }

      setLoadingMessage("AI 상담 내용 분석 및 저장 중...");

      alert("상담 등록 성공");

      selectConsultation(response.data);

      setAudioFile(null);
      setConsultationText("");
      setNurseMemo("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (selectedViewPatientId) {
        fetchPatientConsultations(selectedViewPatientId);
      } else {
        fetchConsultations();
      }
    } catch (error) {
      console.error("상담 등록 실패:", error);
      alert("상담 등록 실패");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };
  const deleteConsultation = async (consultationId) => {
    const confirmDelete = confirm("정말 이 상담 기록을 삭제할까요?");

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteConsultationById(consultationId);
      alert("상담 삭제 완료");

      if (selectedConsultation?.id === consultationId) {
        setSelectedConsultation(null);
        setViewMode("list");
        setConsultationAppointments([]);
      }

      if (selectedViewPatientId) {
        fetchPatientConsultations(selectedViewPatientId);
      } else {
        fetchConsultations();
      }
    } catch (error) {
      console.error("상담 삭제 실패:", error);
      alert("상담 삭제 실패");
    }
  };
  const updateConsultation = async (consultationId) => {
    try {
      await updateConsultationById(consultationId, {
        originalText: editText,
      });

      alert("상담 수정 완료");

      setEditingId(null);
      setEditText("");

      if (selectedViewPatientId) {
        fetchPatientConsultations(selectedViewPatientId);
      } else {
        fetchConsultations();
      }
    } catch (error) {
      console.error("상담 수정 실패:", error);
      alert("상담 수정 실패");
    }
  };
  const generateAppointmentDraft = useCallback(
    async (consultation = selectedConsultation, { silent = false } = {}) => {
      if (!consultation) {
        if (!silent) {
          alert("상담을 먼저 선택하세요.");
        }
        return null;
      }

      if (!consultation.originalText?.trim() && !consultation.nurseMemo?.trim()) {
        return null;
      }

      const consultationId = consultation.id;

      if (appointmentDraftCacheRef.current.has(consultationId)) {
        return appointmentDraftCacheRef.current.get(consultationId);
      }

      if (appointmentDraftInFlightRef.current.has(consultationId)) {
        return appointmentDraftInFlightRef.current.get(consultationId);
      }

      const request = createAppointmentDraft(consultationId)
        .then((response) => {
          appointmentDraftCacheRef.current.set(consultationId, response.data);
          return response.data;
        })
        .catch((error) => {
          console.error("AI 예약 초안 생성 실패:", error);
          if (!silent) {
            alert("AI 예약 초안 생성 실패");
          }
          return null;
        })
        .finally(() => {
          appointmentDraftInFlightRef.current.delete(consultationId);
        });

      appointmentDraftInFlightRef.current.set(consultationId, request);
      return request;
    },
    [selectedConsultation],
  );

  useEffect(() => {
    const consultation = selectedConsultation;
    const consultationId = consultation?.id;

    if (
      !consultationId ||
      (!consultation.originalText?.trim() && !consultation.nurseMemo?.trim())
    ) {
      return;
    }

    if (lastAutoDraftConsultationIdRef.current === consultationId) {
      return;
    }

    lastAutoDraftConsultationIdRef.current = consultationId;

    let canceled = false;

    const autoFillAppointmentDraft = async () => {
      const draft = await generateAppointmentDraft(consultation, {
        silent: true,
      });

      if (canceled || !hasAppointmentIntent(draft)) {
        return;
      }

      applyAppointmentDraft(draft);
    };

    autoFillAppointmentDraft();

    return () => {
      canceled = true;
    };
  }, [
    applyAppointmentDraft,
    generateAppointmentDraft,
    hasAppointmentIntent,
    selectedConsultation,
  ]);

  const selectScheduleSlot = ({ doctorId, appointmentDate, date, time }) => {
    setAppointmentDraft((current) => ({
      ...current,
      appointmentDate,
      appointmentDateTime: appointmentDate,
      dateText: date,
      timeText: time,
        status: "예약됨",
        doctorId: String(doctorId),
      }));
  };

  const hasActivePatientAppointment = () => {
    const now = new Date();

    return selectedPatientAppointments.some((appointment) => {
      const appointmentDate = new Date(
        appointment.appointmentDate || appointment.appointmentDateTime || 0,
      );

      return appointment.status !== "취소" && appointmentDate >= now;
    });
  };

  const addPatientAppointment = async (event) => {
    event.preventDefault();

    if (!selectedPatient) {
      alert("환자를 선택하세요.");
      return false;
    }

    if (!appointmentDraft.appointmentDate) {
      alert("예약 일시를 입력하세요.");
      return false;
    }

    if (!appointmentDraft.doctorId) {
      alert("담당 의사를 선택하세요.");
      return false;
    }

    if (hasActivePatientAppointment()) {
      alert("환자당 예약은 1개만 등록할 수 있습니다.");
      return false;
    }

    setIsAppointmentSaving(true);

    try {
      await createAppointment({
        patientId: selectedPatient.id,
        consultationId: selectedConsultation?.id || null,
        doctorId: Number(appointmentDraft.doctorId),
        appointmentDate: appointmentDraft.appointmentDate,
        status: "예약됨",
        memo: appointmentDraft.memo,
      });
      alert("예약 등록 성공");
      fetchAllAppointments();
      fetchSelectedPatientAppointments(selectedPatient.id);
      if (selectedConsultation) {
        fetchAppointmentsForConsultation(selectedConsultation);
      }
      clearAppointmentDraft();
      return true;
    } catch (error) {
      console.error("예약 등록 실패:", error);
      alert(error.response?.data?.message || "예약 등록 실패");
      return false;
    } finally {
      setIsAppointmentSaving(false);
    }
  };

  const changePatientAppointmentStatus = async (appointmentId, status) => {
    try {
      await updateAppointmentStatus(appointmentId, status);
      fetchAllAppointments();
      fetchSelectedPatientAppointments(selectedPatient?.id);
    } catch (error) {
      console.error("예약 상태 변경 실패:", error);
      alert(error.response?.data?.message || "예약 상태 변경 실패");
    }
  };

  const removePatientAppointment = async (appointmentId) => {
    const confirmDelete = confirm("예약을 삭제할까요?");

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteAppointmentById(appointmentId);
      fetchAllAppointments();
      fetchSelectedPatientAppointments(selectedPatient?.id);
    } catch (error) {
      console.error("예약 삭제 실패:", error);
      alert("예약 삭제 실패");
    }
  };
  const getRiskColor = (riskLevel) => {
    if (riskLevel === "높음" || riskLevel === "HIGH") {
      return "bg-red-100 text-red-700 border-red-300";
    }

    if (riskLevel === "주의" || riskLevel === "MEDIUM") {
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    }

    if (riskLevel === "낮음" || riskLevel === "LOW") {
      return "bg-green-100 text-green-700 border-green-300";
    }

    return "bg-gray-100 text-gray-700 border-gray-300";
  };
  const totalPatients = patients.length;

  const totalConsultations = consultations.length;

  const todayAppointmentCount = allAppointments.filter((appointment) => {
    if (appointment.status === "취소") {
      return false;
    }

    const appointmentDate = new Date(
      appointment.appointmentDate || appointment.appointmentDateTime,
    );
    const today = new Date();

    return (
      appointmentDate.getFullYear() === today.getFullYear() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getDate() === today.getDate()
    );
  }).length;

  const activeDoctors = doctors.filter((doctor) => doctor.active === true);

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            병원 상담 관리 시스템
          </h1>
          <p className="mt-0.5 text-base text-slate-500">
            환자 상담 기록, AI 분석, 예약 정보를 한 화면에서 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-sm">
            <span>환자 {totalPatients}명</span>
            <span className="text-slate-300">|</span>
            <span>상담 {totalConsultations}건</span>
            <span className="text-slate-300">|</span>
            <span>오늘 예약 {todayAppointmentCount}건</span>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 shadow-sm">
            <label htmlFor="ai-model-select" className="font-semibold">
              AI 모델
            </label>
            <select
              id="ai-model-select"
              value={aiModel}
              onChange={changeAiModel}
              disabled={isAiModelSaving}
              className="h-7 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 disabled:bg-slate-100"
            >
              {aiModelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section className="mb-3">
        <h2 className="mb-2 text-lg font-bold text-slate-700">
          주요 업무
        </h2>

        <div className="grid items-stretch grid-cols-[minmax(360px,1fr)_minmax(360px,1fr)_minmax(420px,1.1fr)] gap-3">
          <div className="flex h-full min-h-0 flex-col gap-3">
            <PatientForm
              name={name}
              phone={phone}
              birth={birth}
              setName={setName}
              setPhone={setPhone}
              setBirth={setBirth}
              addPatient={addPatient}
              compact
            />

            <PatientList
              patients={patients}
              selectedViewPatientId={selectedViewPatientId}
              selectedPatientId={selectedPatientId}
              selectedPatient={selectedPatient}
              onSelectPatient={selectPatientForView}
              deletePatient={deletePatient}
              updatePatient={updatePatient}
            />
          </div>

          <div className="h-full">
            <ConsultationForm
              patients={patients}
              selectedPatientId={selectedPatientId}
              setSelectedPatientId={setSelectedPatientId}
              registrationMode={registrationMode}
              setRegistrationMode={setRegistrationMode}
              audioFile={audioFile}
              setAudioFile={setAudioFile}
              consultationText={consultationText}
              setConsultationText={setConsultationText}
              nurseMemo={nurseMemo}
              setNurseMemo={setNurseMemo}
              addConsultation={addConsultation}
              fileInputRef={fileInputRef}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
            />
          </div>

          <div className="flex h-full flex-col gap-3">
            <AppointmentForm
              selectedPatient={selectedPatient}
              selectedConsultation={selectedConsultation}
              doctors={activeDoctors}
              draft={appointmentDraft}
              onChangeDraft={(field, value) => {
                setAppointmentDraft((current) => ({
                  ...current,
                  [field]: value,
                }));
              }}
              onCreateAppointment={addPatientAppointment}
              isSaving={isAppointmentSaving}
            />

            <AppointmentList
              selectedPatient={selectedPatient}
              appointments={selectedPatientAppointments}
              onUpdateStatus={changePatientAppointmentStatus}
              onDeleteAppointment={removePatientAppointment}
              compact
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-700">
          조회 영역
        </h2>

        <div className="grid grid-cols-[minmax(360px,1fr)_minmax(440px,1.15fr)_minmax(420px,1.1fr)] gap-3">
          <PatientInsight
            selectedPatient={selectedPatient}
            consultations={consultations}
            appointments={selectedPatientAppointments}
            getRiskColor={getRiskColor}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            updateConsultation={updateConsultation}
            deleteConsultation={deleteConsultation}
            setEditingId={setEditingId}
            onSelectConsultation={selectConsultation}
            onDeleteAppointment={removePatientAppointment}
          />

          <ConsultationDetail
            key={selectedConsultation?.id || "empty-detail"}
            selectedConsultation={selectedConsultation}
            getRiskColor={getRiskColor}
            emptyMessage={
              selectedPatient
                ? "왼쪽 환자 인사이트의 전체 상담 목록에서 상세 보기를 선택하세요."
                : "환자를 선택하면 상담 상세를 확인할 수 있습니다."
            }
            onBackToList={() => {
              setSelectedConsultation(null);
              setViewMode("list");
            }}
            onOpenInsight={(patient) => {
              setSelectedPatient(patient);
              setSelectedViewPatientId(patient.id);
              setSelectedPatientId(patient.id);
              fetchPatientConsultations(patient.id);
              fetchSelectedPatientAppointments(patient.id);
              clearAppointmentDraft();
            }}
          />

          <DoctorWeeklyCalendar
            doctors={activeDoctors}
            appointments={allAppointments}
            selectedWeek={selectedWeek}
            selectedDoctorId={appointmentDraft.doctorId}
            onChangeWeek={setSelectedWeek}
            onChangeDoctor={(doctorId) => {
              setAppointmentDraft((current) => ({
                ...current,
                doctorId,
              }));
            }}
            onSelectSlot={selectScheduleSlot}
            onSelectAppointmentPatient={(patientId) => {
              if (patientId) {
                selectPatientForView(patientId);
              }
            }}
            doctorManagement={
              <DoctorManagement
                doctors={doctors}
                onCreateDoctor={addDoctor}
                onUpdateDoctor={updateDoctor}
                onDeleteDoctor={deleteDoctor}
                embedded
              />
            }
          />
        </div>
      </section>

    </div>
  );
}

export default App;
