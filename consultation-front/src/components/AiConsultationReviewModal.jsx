import { useState } from "react";

function toInputList(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value || "";
}

function AiConsultationReviewModal({ preview, doctors = [], onClose }) {
  const [form, setForm] = useState({
    extractedPatientName: preview.extractedPatientName || "",
    extractedPhoneLast4: preview.extractedPhoneLast4 || "",
    extractedBirth: preview.extractedBirth || "",
    originalText: preview.originalText || "",
    nurseMemo: preview.nurseMemo || "",
    summary: preview.summary || "",
    symptoms: toInputList(preview.symptoms),
    riskLevel: preview.riskLevel || "",
    keywords: toInputList(preview.keywords),
    appointmentDate: preview.appointmentDate || "",
    visitReason: preview.visitReason || "",
    status: preview.status || "예약됨",
    doctorId: preview.recommendedDoctorId ? String(preview.recommendedDoctorId) : "",
  });

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">AI 상담 등록 확인</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            닫기
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1">
                {preview.patientCandidates?.length ? (
                  preview.patientCandidates.map((patient) => (
                    <p
                      key={patient.id}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                    >
                      {patient.name} | {patient.phone} | {patient.birth}
                    </p>
                  ))
                ) : (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    기존 환자 후보가 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <h3 className="mb-2 text-base font-bold text-slate-900">예약 정보</h3>
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
                value={form.appointmentDate}
                onChange={(event) =>
                  updateField("appointmentDate", event.target.value)
                }
                placeholder="예약 날짜/시간"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              />
              <input
                value={form.visitReason}
                onChange={(event) => updateField("visitReason", event.target.value)}
                placeholder="방문 사유"
                className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              />
              <input
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                placeholder="예약 상태"
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
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-300 px-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled
            className="h-10 cursor-not-allowed rounded-md bg-slate-300 px-4 text-base font-semibold text-white"
          >
            다음 단계에서 구현
          </button>
        </div>
      </section>
    </div>
  );
}

export default AiConsultationReviewModal;
