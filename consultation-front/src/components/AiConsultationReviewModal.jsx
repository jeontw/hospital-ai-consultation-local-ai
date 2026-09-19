import { useState } from "react";

function toInputList(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";
}

function toDateTimeLocal(value) {
  return value ? String(value).slice(0, 16) : "";
}

function formatDateTime(value) {
  if (!value) {
    return "날짜·시간 확인 필요";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR");
}

function AiConsultationReviewModal({
  preview,
  doctors = [],
  onConfirm,
  isConfirming,
  onClose,
  evaluationMode = false,
  expectedPatient = null,
}) {
  const patientCandidates = preview.patientCandidates || [];
  const [selectedPatientId, setSelectedPatientId] = useState(
    preview.recommendedPatientId
      ? String(preview.recommendedPatientId)
      : patientCandidates.length === 1
        ? String(patientCandidates[0].id)
        : "",
  );
  const [form, setForm] = useState({
    extractedPatientName: preview.extractedPatientName || "",
    extractedPhone: preview.extractedPhone || "",
    extractedPhoneLast4: preview.extractedPhoneLast4 || "",
    extractedBirth: preview.extractedBirth || "",
    originalText: preview.originalText || "",
    nurseMemo: preview.nurseMemo || "",
    summary: preview.summary || "",
    symptoms: toInputList(preview.symptoms),
    riskLevel: preview.riskLevel || "",
    keywords: toInputList(preview.keywords),
    createAppointment: Boolean(preview.needReservation),
    appointmentDate: toDateTimeLocal(preview.appointmentDate),
    visitReason: preview.visitReason || "",
    doctorId: preview.recommendedDoctorId ? String(preview.recommendedDoctorId) : "",
  });
  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const confirm = () => {
    if (patientCandidates.length === 0) {
      alert("기존 환자를 찾을 수 없습니다. 환자를 먼저 등록해주세요.");
      return;
    }

    if (!selectedPatientId) {
      alert("환자를 선택해주세요.");
      return;
    }


    if (form.createAppointment && !form.appointmentDate) {
      alert("예약 날짜와 시간을 확인해주세요. 추출된 일시를 수정하거나 예약 생성을 해제할 수 있습니다.");
      return;
    }

    if (form.createAppointment && !form.doctorId) {
      alert("예약을 처리하려면 담당의사를 선택해주세요.");
      return;
    }

    console.log("AI 미리보기 확정 등록:", {
      selectedPatientId,
      selectedDoctorId: form.doctorId,
      appointmentDate: form.appointmentDate,
      visitReason: form.visitReason,
    });

    onConfirm?.({
      patientId: Number(selectedPatientId),
      doctorId: form.doctorId ? Number(form.doctorId) : null,
      originalText: form.originalText,
      nurseMemo: form.nurseMemo,
      summary: form.summary,
      symptoms: form.symptoms,
      riskLevel: form.riskLevel,
      keywords: form.keywords,
      createAppointment: form.createAppointment,
      appointmentDate: form.createAppointment ? form.appointmentDate : null,
      visitReason: form.visitReason,
      status: form.createAppointment ? "예약됨" : null,
      audioPath: preview.audioPath || "",
    });
  };

  const selectedPatient = patientCandidates.find(
    (patient) => String(patient.id) === String(selectedPatientId),
  );
  const patientSummary = selectedPatient
    ? `${selectedPatient.name || "이름 없음"} · ${selectedPatient.phone || "전화번호 없음"} · ${selectedPatient.birth || "생년월일 없음"}`
    : `${form.extractedPatientName || "환자 확인 필요"} · ${form.extractedPhone || (form.extractedPhoneLast4 ? `전화번호 끝 ${form.extractedPhoneLast4}` : "전화번호 확인 필요")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <section className="max-h-[94vh] w-full max-w-6xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {evaluationMode ? "성능평가 분석 결과" : "AI 상담 등록 확인"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

        {evaluationMode && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-900">
            <p className="font-bold">이 결과는 성능평가 공간에 자동 저장되었습니다.</p>
            <p>
              비교용 선택 환자: {expectedPatient?.name || "선택 안 함"} · 시스템 추천 환자: {preview.recommendedPatientName || "추천 없음"}
            </p>
            <p>AI가 반환한 추출값과 시스템의 변환·추천 여부만 기록했습니다.</p>
            <p className="font-semibold">실제 상담·예약 DB에는 반영하지 않았습니다.</p>
          </div>
        )}

        <div className="mb-4 rounded-lg border border-slate-300 bg-slate-50 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-950">상담 요약</h3>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                form.createAppointment
                  ? form.appointmentDate
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {evaluationMode
                ? form.createAppointment
                  ? form.appointmentDate
                    ? "예약 등록값 추출됨"
                    : "예약 일시 확인 필요"
                  : "예약 의도 없음"
                : form.createAppointment
                  ? form.appointmentDate
                    ? "예약 생성 예정"
                    : "예약 일시 확인 필요"
                  : "예약 생성 안 함"}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">환자</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{patientSummary}</p>
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">주요 증상</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{form.symptoms || "증상 확인 필요"}</p>
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">예약 일시</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                {form.createAppointment ? formatDateTime(form.appointmentDate) : "예약 요청 없음"}
              </p>
              {!form.appointmentDate && preview.needReservation && (
                <p className="mt-1 text-xs text-amber-700">
                  추출값: {[preview.appointmentDateText, preview.appointmentTimeText].filter(Boolean).join(" ") || "없음"}
                </p>
              )}
            </div>
            <div className="rounded-md bg-white p-3 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">위험도 · 담당의</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                {form.riskLevel || "미분석"} · {doctors.find((doctor) => String(doctor.id) === String(form.doctorId))?.name || "미지정"}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">AI 핵심 내용</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{form.summary || "요약 없음"}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-slate-700 sm:grid-cols-5">
          <div>
            <p className="font-semibold text-slate-900">Whisper</p>
            <p>{((preview.whisperProcessingMs || 0) / 1000).toFixed(2)}초</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">로컬 LLM</p>
            <p>{((preview.llmProcessingMs || 0) / 1000).toFixed(2)}초</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">전체 처리</p>
            <p>{((preview.totalProcessingMs || 0) / 1000).toFixed(2)}초</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">사용 모델</p>
            <p>{preview.aiModel || "확인 불가"}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">JSON 구조</p>
            <p className={preview.jsonSuccess === false ? "font-bold text-red-700" : "font-bold text-emerald-700"}>
              {preview.jsonSuccess === false ? "실패" : "성공"}
            </p>
            {preview.jsonError && <p className="mt-1 text-xs text-red-700">{preview.jsonError}</p>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-base font-bold text-slate-900">환자 정보</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.extractedPatientName}
                  onChange={(event) =>
                    updateField("extractedPatientName", event.target.value)
                  }
                  placeholder="추출된 환자명"
                  className="h-10 rounded-md border border-slate-300 px-3 text-base"
                />
                <input
                  value={form.extractedPhoneLast4}
                  onChange={(event) =>
                    updateField("extractedPhoneLast4", event.target.value)
                  }
                  placeholder="추출된 전화번호 뒷자리"
                  className="h-10 rounded-md border border-slate-300 px-3 text-base"
                />
                <input
                  value={form.extractedBirth}
                  onChange={(event) =>
                    updateField("extractedBirth", event.target.value)
                  }
                  placeholder="생년월일"
                  className="h-10 rounded-md border border-slate-300 px-3 text-base"
                />
              </div>

              <p className="mt-3 mb-2 text-sm font-semibold text-slate-600">
                환자 후보
              </p>
              {preview.recommendedPatientId && (
                <p className="mb-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  추천 환자: {preview.recommendedPatientName || "확인 필요"} ·{" "}
                  {preview.patientRecommendationReason || "가장 가까운 후보입니다."}
                </p>
              )}
              <div className="space-y-1">
                {patientCandidates.length ? (
                  patientCandidates.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatientId(String(patient.id))}
                      className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${
                        String(selectedPatientId) === String(patient.id)
                          ? "border-slate-800 bg-slate-100 text-slate-900"
                          : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span>{patient.name} | {patient.phone} | {patient.birth}</span>
                      {String(selectedPatientId) === String(patient.id) && (
                        <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs font-semibold text-white">
                          선택됨
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    기존 환자를 찾을 수 없습니다. 환자를 먼저 등록해주세요.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-base font-bold text-slate-900">예약 정보</h3>
              <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-300 bg-white p-3">
                <span>
                  <span className="block text-sm font-bold text-slate-900">상담 확정과 함께 예약 생성</span>
                  <span className="mt-0.5 block text-xs text-slate-500">켜져 있으면 예약 누락 없이 함께 등록됩니다.</span>
                </span>
                <input
                  type="checkbox"
                  checked={form.createAppointment}
                  onChange={(event) => updateField("createAppointment", event.target.checked)}
                  className="h-5 w-5 accent-slate-800"
                />
              </label>
              <div className="mb-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  추천 담당의사: {preview.recommendedDoctorName || "미지정"}
                </p>
                <p className="mt-1">
                  추천 이유: {preview.doctorRecommendationReason || "추천 근거 없음"}
                </p>
              </div>
              <select
                value={form.doctorId}
                onChange={(event) => updateField("doctorId", event.target.value)}
                className="mb-2 h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              >
                <option value="">담당의사 직접 선택</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialty ? `(${doctor.specialty})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(event) =>
                  updateField("appointmentDate", event.target.value)
                }
                disabled={!form.createAppointment}
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-base disabled:bg-slate-100 disabled:text-slate-400"
              />
              {form.createAppointment && !form.appointmentDate && (
                <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  예약 의도는 찾았지만 정확한 날짜 또는 시간이 없습니다. 일시를 입력해야 예약됩니다.
                </p>
              )}
              {!evaluationMode && form.createAppointment && form.appointmentDate && form.doctorId && (
                <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  확정 등록을 누르면 추출된 날짜·시간과 담당의로 실제 예약이 함께 생성됩니다.
                </p>
              )}
              <input
                value={form.visitReason}
                onChange={(event) => updateField("visitReason", event.target.value)}
                placeholder="방문 사유"
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-base font-bold text-slate-900">상담 정보</h3>
              <textarea
                value={form.originalText}
                onChange={(event) => updateField("originalText", event.target.value)}
                placeholder="STT 원문"
                className="min-h-28 w-full rounded-md border border-slate-300 p-3 text-base leading-6"
              />
              <textarea
                value={form.nurseMemo}
                onChange={(event) => updateField("nurseMemo", event.target.value)}
                placeholder="간호사 메모"
                className="mt-2 min-h-20 w-full rounded-md border border-slate-300 p-3 text-base leading-6"
              />
              <textarea
                value={form.summary}
                onChange={(event) => updateField("summary", event.target.value)}
                placeholder="AI 요약"
                className="mt-2 min-h-20 w-full rounded-md border border-slate-300 p-3 text-base leading-6"
              />
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-base font-bold text-slate-900">AI 분석</h3>
              <input
                value={form.symptoms}
                onChange={(event) => updateField("symptoms", event.target.value)}
                placeholder="주요 증상"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              />
              <input
                value={form.riskLevel}
                onChange={(event) => updateField("riskLevel", event.target.value)}
                placeholder="위험도"
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              />
              <input
                value={form.keywords}
                onChange={(event) => updateField("keywords", event.target.value)}
                placeholder="키워드"
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              />
            </div>

          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {!evaluationMode && (
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              className="h-10 rounded-md border border-slate-300 px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              취소
            </button>
          )}
          {evaluationMode ? (
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md bg-emerald-700 px-4 text-base font-semibold text-white hover:bg-emerald-600"
            >
              결과 확인 완료
            </button>
          ) : (
            <button
              type="button"
              onClick={confirm}
              disabled={isConfirming}
              className="h-10 rounded-md bg-slate-800 px-4 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isConfirming ? "등록 중..." : "확정 등록"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default AiConsultationReviewModal;
