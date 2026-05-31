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

import Dashboard from "./components/Dashboard";
import PatientForm from "./components/PatientForm";
import ConsultationForm from "./components/ConsultationForm";
import PatientList from "./components/PatientList";
import ConsultationDetail from "./components/ConsultationDetail";
import ConsultationList from "./components/ConsultationList";
import PatientInsight from "./components/PatientInsight";
import AppointmentForm from "./components/AppointmentForm";
import AppointmentList from "./components/AppointmentList";
import AppointmentCalendar from "./components/AppointmentCalendar";

function App() {
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [registrationMode, setRegistrationMode] = useState("audio");
  const [consultationText, setConsultationText] = useState("");
  const [nurseMemo, setNurseMemo] = useState("");
  const [selectedViewPatientId, setSelectedViewPatientId] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [consultationAppointments, setConsultationAppointments] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedPatientAppointments, setSelectedPatientAppointments] = useState([]);
  const [isAppointmentSaving, setIsAppointmentSaving] = useState(false);
  const [appointmentDraft, setAppointmentDraft] = useState({
    appointmentDate: "",
    dateText: "",
    timeText: "",
    memo: "",
    status: "예약됨",
  });
  const [viewMode, setViewMode] = useState("list");

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

    setIsAppointmentSaving(true);

    try {
      await createAppointment({
        patientId: selectedPatient.id,
        consultationId: selectedConsultation?.id || null,
        appointmentDate: appointmentDraft.appointmentDate,
        status: appointmentDraft.status || "예약됨",
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

  const warningConsultations = consultations.filter(
    (consultation) =>
      consultation.aiAnalysis?.riskLevel === "주의" ||
      consultation.aiAnalysis?.riskLevel === "MEDIUM",
  ).length;

  const recentConsultations = consultations.filter((consultation) => {
    const createdAt = new Date(consultation.createdAt);
    const today = new Date();

    const diffTime = today - createdAt;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <div className="mb-3 border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">
          병원 상담 관리 시스템
        </h1>
        <p className="mt-0.5 text-base text-slate-500">
          환자 상담 기록, AI 분석, 예약 정보를 한 화면에서 관리합니다.
        </p>
      </div>

      <Dashboard
        totalPatients={totalPatients}
        totalConsultations={totalConsultations}
        warningConsultations={warningConsultations}
        recentConsultations={recentConsultations}
      />

      <section className="mb-3">
        <h2 className="mb-2 text-lg font-bold text-slate-700">
          환자 업무 영역
        </h2>

        <div className="grid grid-cols-[minmax(520px,1fr)_minmax(520px,0.95fr)] gap-3">
          <PatientList
            patients={patients}
            selectedViewPatientId={selectedViewPatientId}
            selectedPatientId={selectedPatientId}
            onSelectPatient={selectPatientForView}
            deletePatient={deletePatient}
            updatePatient={updatePatient}
          />

          <div className="space-y-3">
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
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-700">
          선택 환자 업무 영역
        </h2>

        <div className="grid grid-cols-[minmax(520px,1fr)_minmax(640px,1.25fr)] gap-3">
          {viewMode === "detail" && selectedConsultation ? (
            <ConsultationDetail
              key={selectedConsultation.id}
              selectedConsultation={selectedConsultation}
              getRiskColor={getRiskColor}
              onBackToList={() => setViewMode("list")}
              onOpenInsight={(patient) => {
                setSelectedPatient(patient);
                setSelectedViewPatientId(patient.id);
                setSelectedPatientId(patient.id);
                fetchPatientConsultations(patient.id);
                fetchSelectedPatientAppointments(patient.id);
                clearAppointmentDraft();
              }}
            />
          ) : (
            <ConsultationList
              consultations={consultations}
              searchKeyword={searchKeyword}
              setSearchKeyword={setSearchKeyword}
              editingId={editingId}
              editText={editText}
              setEditText={setEditText}
              updateConsultation={updateConsultation}
              deleteConsultation={deleteConsultation}
              setEditingId={setEditingId}
              setSelectedConsultation={selectConsultation}
              getRiskColor={getRiskColor}
            />
          )}

          <PatientInsight
            selectedPatient={selectedPatient}
            consultations={consultations}
            getRiskColor={getRiskColor}
          />
        </div>
      </section>

      <section className="mt-3">
        <h2 className="mb-2 text-lg font-bold text-slate-700">
          예약 관리
        </h2>
        <p className="mb-2 text-sm text-slate-500">
          선택 상담 예약 {consultationAppointments.length}건 / 환자 예약 {patientAppointments.length}건
        </p>

        <div className="grid grid-cols-[minmax(420px,0.8fr)_minmax(560px,1.2fr)] gap-3">
          <div className="space-y-3">
            <AppointmentForm
              selectedPatient={selectedPatient}
              selectedConsultation={selectedConsultation}
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
            />
          </div>

          <AppointmentCalendar appointments={allAppointments} />
        </div>
      </section>
    </div>
  );
}

export default App;
