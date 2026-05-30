import { useEffect, useRef, useState } from "react";

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
  getAppointmentsByConsultation,
  getAppointmentsByPatient,
} from "./api/appointmentApi";

import Dashboard from "./components/Dashboard";
import PatientForm from "./components/PatientForm";
import ConsultationForm from "./components/ConsultationForm";
import PatientList from "./components/PatientList";
import ConsultationDetail from "./components/ConsultationDetail";
import ConsultationList from "./components/ConsultationList";
import PatientInsight from "./components/PatientInsight";

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

  const fileInputRef = useRef(null);

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
    } catch (error) {
      console.error("상담 조회 실패:", error);
    }
  };
  const fetchPatientConsultations = async (patientId) => {
    try {
      const response = await getConsultationsByPatient(patientId);
      setConsultations(response.data);
    } catch (error) {
      console.error("환자 상담 조회 실패:", error);
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
  const selectConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    fetchAppointmentsForConsultation(consultation);
  };

  useEffect(() => {
    setTimeout(() => {
      fetchPatients();
      fetchConsultations();
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

      fetchPatients();
      fetchConsultations();
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

    if (registrationMode === "audio" && !audioFile) {
      alert("음성 파일을 선택하세요");
      return;
    }

    if (registrationMode === "text" && !consultationText.trim()) {
      alert("상담 내용을 입력하세요");
      return;
    }

    setIsLoading(true);

    try {
      let response;

      if (registrationMode === "audio") {
        setLoadingMessage("음성 파일 업로드 중...");

        const formData = new FormData();
        formData.append("file", audioFile);
        setLoadingMessage("음성 변환 및 STT 분석 중...");

        response = await uploadConsultationAudio(selectedPatientId, formData);
      } else {
        setLoadingMessage("상담 내용 AI 분석 및 저장 중...");

        response = await createTextConsultation(selectedPatientId, {
          originalText: consultationText.trim(),
          audioPath: null,
        });
      }

      setLoadingMessage("AI 상담 내용 분석 및 저장 중...");

      alert("상담 등록 성공");

      selectConsultation(response.data);

      setSelectedPatientId("");
      setAudioFile(null);
      setConsultationText("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchConsultations();
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
      fetchConsultations();
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

      fetchConsultations();
    } catch (error) {
      console.error("상담 수정 실패:", error);
      alert("상담 수정 실패");
    }
  };
  const addAppointment = async (appointment) => {
    if (!selectedConsultation) {
      alert("상담을 먼저 선택하세요.");
      return;
    }

    const patientId = selectedConsultation.patient?.id;

    if (!patientId) {
      alert("선택된 상담의 환자 정보가 없습니다.");
      return;
    }

    try {
      await createAppointment({
        ...appointment,
        patientId,
        consultationId: selectedConsultation.id,
      });

      alert("예약 등록 성공");
      fetchAppointmentsForConsultation(selectedConsultation);
      return true;
    } catch (error) {
      console.error("예약 등록 실패:", error);
      alert("예약 등록 실패");
      return false;
    }
  };
  const generateAppointmentDraft = async () => {
    if (!selectedConsultation) {
      alert("상담을 먼저 선택하세요.");
      return null;
    }

    try {
      const response = await createAppointmentDraft(selectedConsultation.id);
      return response.data;
    } catch (error) {
      console.error("AI 예약 초안 생성 실패:", error);
      alert("AI 예약 초안 생성 실패");
      return null;
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
    (consultation) => consultation.aiAnalysis?.riskLevel === "주의",
  ).length;

  const recentConsultations = consultations.filter((consultation) => {
    const createdAt = new Date(consultation.createdAt);
    const today = new Date();

    const diffTime = today - createdAt;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold tracking-tight">
          병원 상담 관리 시스템
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          환자 상담 기록, AI 분석, 예약 정보를 한 화면에서 관리합니다.
        </p>
      </div>

      <Dashboard
        totalPatients={totalPatients}
        totalConsultations={totalConsultations}
        warningConsultations={warningConsultations}
        recentConsultations={recentConsultations}
      />

      <div className="mb-6 grid grid-cols-2 gap-6">
        <PatientForm
          name={name}
          phone={phone}
          birth={birth}
          setName={setName}
          setPhone={setPhone}
          setBirth={setBirth}
          addPatient={addPatient}
        />

        <ConsultationForm
          patients={patients}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
          registrationMode={registrationMode}
          setRegistrationMode={setRegistrationMode}
          setAudioFile={setAudioFile}
          consultationText={consultationText}
          setConsultationText={setConsultationText}
          addConsultation={addConsultation}
          fileInputRef={fileInputRef}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        />
      </div>

      <div className="grid grid-cols-[minmax(420px,1fr)_minmax(520px,1.25fr)] gap-6">
        <div className="space-y-6">
          <PatientList
            patients={patients}
            selectedViewPatientId={selectedViewPatientId}
            onSelectPatient={(patientId) => {
              setSelectedViewPatientId(patientId);
              setSelectedConsultation(null);
              setConsultationAppointments([]);
              setPatientAppointments([]);

              const patient = patients.find(
                (patient) => String(patient.id) === String(patientId),
              );

              setSelectedPatient(patient || null);

              if (patientId === "") {
                fetchConsultations();
              } else {
                fetchPatientConsultations(patientId);
              }
            }}
            deletePatient={deletePatient}
            updatePatient={updatePatient}
          />

          <select
            value={selectedViewPatientId}
            onChange={(e) => {
              const patientId = e.target.value;

              setSelectedViewPatientId(patientId);
              setSelectedConsultation(null);
              setConsultationAppointments([]);
              setPatientAppointments([]);

              const patient = patients.find(
                (patient) => String(patient.id) === String(patientId),
              );

              setSelectedPatient(patient || null);

              if (patientId === "") {
                fetchConsultations();
              } else {
                fetchPatientConsultations(patientId);
              }
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">전체 상담 보기</option>

            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>

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
        </div>

        <div className="space-y-6">
          <PatientInsight
            selectedPatient={selectedPatient}
            consultations={consultations}
            getRiskColor={getRiskColor}
          />

          <ConsultationDetail
            key={selectedConsultation?.id || "empty-consultation"}
            selectedConsultation={selectedConsultation}
            getRiskColor={getRiskColor}
            addAppointment={addAppointment}
            generateAppointmentDraft={generateAppointmentDraft}
            consultationAppointments={consultationAppointments}
            patientAppointments={patientAppointments}
            onOpenInsight={(patient) => {
              setSelectedPatient(patient);
              setSelectedViewPatientId(patient.id);
              fetchPatientConsultations(patient.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
