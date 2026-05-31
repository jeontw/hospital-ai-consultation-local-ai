import { useEffect } from "react";

function formatDateTimeValue(value) {
  if (!value) {
    return "";
  }

  const normalized = String(value).replace(" ", "T");

  if (normalized.length >= 16) {
    return normalized.slice(0, 16);
  }

  return normalized;
}

function AppointmentForm({
  selectedPatient,
  selectedConsultation,
  doctors = [],
  draft,
  onChangeDraft,
  onCreateAppointment,
  isSaving,
}) {
  useEffect(() => {
    if (!selectedPatient) {
      return;
    }

    const normalizedAppointmentDate = formatDateTimeValue(
      draft?.appointmentDate || draft?.appointmentDateTime || "",
    );

    if (
      normalizedAppointmentDate &&
      draft?.appointmentDate !== normalizedAppointmentDate
    ) {
      onChangeDraft("appointmentDate", normalizedAppointmentDate);
    }

    if (
      normalizedAppointmentDate &&
      draft?.appointmentDateTime !== normalizedAppointmentDate
    ) {
      onChangeDraft("appointmentDateTime", normalizedAppointmentDate);
    }

    if (!draft?.status) {
      onChangeDraft("status", "예약됨");
    }
  }, [
    draft?.appointmentDate,
    draft?.appointmentDateTime,
    draft?.status,
    onChangeDraft,
    selectedPatient,
  ]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;

    onChangeDraft(field, value);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">예약 등록</h2>

      {!selectedPatient ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          환자를 선택하면 예약을 등록할 수 있습니다.
        </p>
      ) : (
        <form onSubmit={onCreateAppointment} className="space-y-3">
          <p className="rounded-md bg-slate-50 px-3 py-2 text-base font-medium text-slate-700">
            예약 대상: {selectedPatient.name} / {selectedPatient.phone}
          </p>

          <div>
            <label className="mb-1 block text-base font-medium text-slate-700">
              담당 의사
            </label>
            <select
              value={draft?.doctorId || ""}
              onChange={handleFieldChange("doctorId")}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              required
            >
              <option value="">담당 의사 선택</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} ({doctor.specialty})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-base font-medium text-slate-700">
              예약 일시
            </label>
            <input
              type="datetime-local"
              value={formatDateTimeValue(
                draft?.appointmentDate || draft?.appointmentDateTime || "",
              )}
              onChange={handleFieldChange("appointmentDate")}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-base"
              required
            />
            <p className="mt-1 text-sm text-slate-500">
              추출 표현: {draft?.dateText || "없음"}
              {draft?.timeText ? ` / ${draft.timeText}` : ""}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-base font-medium text-slate-700">
              상태
            </label>
            <select
              value={draft?.status || "예약됨"}
              onChange={handleFieldChange("status")}
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-base"
            >
              <option value="예약됨">예약됨</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-base font-medium text-slate-700">
              방문 사유
            </label>
            <textarea
              value={draft?.memo || ""}
              onChange={handleFieldChange("memo")}
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
              placeholder="환자의 방문 사유를 입력하세요."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="h-10 rounded-md bg-slate-800 px-4 text-base font-semibold text-white hover:bg-slate-700 disabled:bg-slate-400"
          >
            {isSaving ? "저장 중..." : "예약 등록"}
          </button>

          {selectedConsultation && (
            <p className="text-sm text-slate-500">
              상담에서 추출한 초안을 확인하고 필요하면 수정한 뒤 등록하세요.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

export default AppointmentForm;
