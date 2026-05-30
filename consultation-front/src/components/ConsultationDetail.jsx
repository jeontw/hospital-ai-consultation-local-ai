import { useState } from "react";

function ConsultationDetail({
  selectedConsultation,
  getRiskColor,
  onOpenInsight,
  addAppointment,
  generateAppointmentDraft,
  consultationAppointments,
  patientAppointments,
}) {
  const [appointmentDateTime, setAppointmentDateTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("예정");
  const [memo, setMemo] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");

  if (!selectedConsultation) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
          상담 상세
        </h2>
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          상담을 선택하면 상세 정보가 표시됩니다.
        </p>
      </section>
    );
  }

  const audioPath = selectedConsultation.audioPath;

  const audioUrl = audioPath
    ? audioPath.startsWith("http")
      ? audioPath
      : `http://localhost:8080${audioPath.startsWith("/") ? audioPath : `/${audioPath}`}`
    : "";

  const openPatientInsight = () => {
    if (!selectedConsultation.patient) {
      return;
    }

    onOpenInsight(selectedConsultation.patient);
  };

  const submitAppointment = async (event) => {
    event.preventDefault();

    const saved = await addAppointment({
      appointmentDateTime,
      purpose,
      status,
      memo,
    });

    if (!saved) {
      return;
    }

    setAppointmentDateTime("");
    setPurpose("");
    setStatus("예정");
    setMemo("");
    setDraftMessage("");
  };

  const normalizeDateTimeForInput = (dateTime) => {
    if (!dateTime) {
      return "";
    }

    return dateTime.slice(0, 16);
  };

  const handleGenerateDraft = async () => {
    setDraftLoading(true);
    setDraftMessage("");

    try {
      const draft = await generateAppointmentDraft();

      if (!draft) {
        setDraftMessage("AI 예약 초안 생성에 실패했습니다.");
        return;
      }

      if (!draft.appointmentConfirmed) {
        setDraftMessage("상담 내용에서 확정된 예약 정보를 찾지 못했습니다.");
        return;
      }

      setAppointmentDateTime(
        normalizeDateTimeForInput(draft.appointmentDateTime),
      );
      setPurpose(draft.purpose || "");
      setStatus(draft.status || "예정");
      setMemo(draft.memo || "");
      setDraftMessage(draft.reason || "AI 예약 초안을 폼에 입력했습니다.");
    } finally {
      setDraftLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      return "일정 없음";
    }

    return new Date(dateTime).toLocaleString();
  };

  const renderAppointments = (appointments, emptyMessage) => {
    if (!appointments || appointments.length === 0) {
      return <p className="text-gray-400">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-3">
        {[...appointments]
          .sort(
            (a, b) =>
              new Date(a.appointmentDateTime || 0) -
              new Date(b.appointmentDateTime || 0),
          )
          .map((appointment) => (
            <div key={appointment.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {formatDateTime(appointment.appointmentDateTime)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appointment.purpose || "목적 없음"}
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-700">
                  {appointment.status || "예정"}
                </span>
              </div>

              {appointment.memo && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {appointment.memo}
                </p>
              )}
            </div>
          ))}
      </div>
    );
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold text-slate-900">상담 상세</h2>

        <button
          onClick={openPatientInsight}
          disabled={!selectedConsultation.patient}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white disabled:bg-slate-300"
        >
          AI 인사이트
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 rounded-md bg-slate-50 p-4">
          <div>
            <p className="text-xs font-medium text-slate-500">환자명</p>
            <p className="mt-1 font-semibold text-slate-900">
              {selectedConsultation.patient?.name || "환자 정보 없음"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">전화번호</p>
            <p className="mt-1 font-semibold text-slate-900">
              {selectedConsultation.patient?.phone || "전화번호 없음"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">상담 시간</p>
            <p className="mt-1 font-semibold text-slate-900">
              {new Date(selectedConsultation.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 font-bold text-slate-900">원본 상담 내용</p>
          <p className="whitespace-pre-wrap rounded-md border border-slate-200 p-4 text-sm leading-6 text-slate-700">
            {selectedConsultation.originalText || "내용 없음"}
          </p>
        </div>

        <div>
          <p className="mb-2 font-bold text-slate-900">화자 분리 결과</p>
          <pre className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {selectedConsultation.speakerText || "화자 분리 결과 없음"}
          </pre>
        </div>

        <div>
          <p className="mb-2 font-bold text-slate-900">AI 요약</p>
          <p className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {selectedConsultation.summary || "요약 없음"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-1 text-xs font-medium text-slate-500">주요 증상</p>
            <p className="text-sm text-slate-700">
              {selectedConsultation.aiAnalysis?.symptoms || "분석 없음"}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-1 text-xs font-medium text-slate-500">키워드</p>
            <p className="text-sm text-slate-700">
              {selectedConsultation.aiAnalysis?.keywords || "분석 없음"}
            </p>
          </div>

          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">위험도</p>
            <span
              className={`inline-block rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(
                selectedConsultation.aiAnalysis?.riskLevel,
              )}`}
            >
              {selectedConsultation.aiAnalysis?.riskLevel || "분석 없음"}
            </span>
          </div>
        </div>

        {audioPath ? (
          <div>
            <p className="mb-2 font-bold text-slate-900">음성 파일</p>

            <p className="mb-2 break-all text-sm text-slate-500">
              저장 경로: {audioPath}
            </p>

            <p className="mb-2 break-all text-sm text-slate-500">
              재생 주소: {audioUrl}
            </p>

            <audio key={audioUrl} controls className="w-full" src={audioUrl} />
          </div>
        ) : (
          <p className="text-sm text-slate-400">음성 파일 없음</p>
        )}

        <form
          onSubmit={submitAppointment}
          className="mt-6 border-t border-gray-200 pt-6 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">예약 등록</h3>

            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={draftLoading}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:bg-slate-100"
            >
              {draftLoading ? "초안 생성 중..." : "AI 예약 초안 생성"}
            </button>
          </div>

          {draftMessage && (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              {draftMessage}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">예약 일시</label>
            <input
              type="datetime-local"
              value={appointmentDateTime}
              onChange={(event) => setAppointmentDateTime(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">목적</label>
            <input
              type="text"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="예: 재진 상담"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">상태</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="예정">예정</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">메모</label>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="예약 관련 메모"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            예약 등록
          </button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="mb-3 text-lg font-bold text-slate-900">현재 상담 예약 목록</h3>
          {renderAppointments(
            consultationAppointments,
            "현재 상담에 등록된 예약이 없습니다.",
          )}
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="mb-3 text-lg font-bold text-slate-900">환자 전체 예약 목록</h3>
          {renderAppointments(
            patientAppointments,
            "이 환자에게 등록된 예약이 없습니다.",
          )}
        </div>
      </div>
    </section>
  );
}

export default ConsultationDetail;
