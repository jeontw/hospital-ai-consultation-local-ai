import { useState } from "react";

function parseDoctorBriefing(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {
      visitReason: "",
      mainSymptoms: [],
      specialNotes: [String(value)],
      attentionLevel: "",
    };
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|,/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

function ConsultationDetail({
  selectedConsultation,
  consultationAppointments = [],
  getRiskColor,
  onGenerateDoctorBriefing,
  onUpdateDoctorBriefing,
  emptyMessage = "상담을 선택하면 상세 정보가 표시됩니다.",
}) {
  const [isDoctorSendOpen, setIsDoctorSendOpen] = useState(false);
  const [doctorSendText, setDoctorSendText] = useState("");
  const [isDoctorSendDone, setIsDoctorSendDone] = useState(false);
  const [isDoctorBriefingLoading, setIsDoctorBriefingLoading] = useState(false);
  const [doctorBriefingError, setDoctorBriefingError] = useState("");
  const [isDoctorBriefingEditing, setIsDoctorBriefingEditing] = useState(false);
  const [isDoctorBriefingSaving, setIsDoctorBriefingSaving] = useState(false);
  const [doctorBriefingForm, setDoctorBriefingForm] = useState({
    visitReason: "",
    mainSymptoms: "",
    specialNotes: "",
    attentionLevel: "",
  });

  if (!selectedConsultation) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">상담 상세</h2>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-base font-semibold text-slate-700">
            선택된 상담이 없습니다.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {emptyMessage}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-slate-500">
            <p>환자 인사이트의 전체 상담 목록에서 상세 보기를 누르면 표시됩니다.</p>
            <p>상담 원문, 간호사 메모, AI 요약, 의사용 브리핑을 확인할 수 있습니다.</p>
          </div>
        </div>
      </section>
    );
  }

  const audioPath = selectedConsultation.audioPath;
  const audioUrl = audioPath
    ? audioPath.startsWith("http")
      ? audioPath
      : `http://localhost:8080${audioPath.startsWith("/") ? audioPath : `/${audioPath}`}`
    : "";
  const doctorBriefing = parseDoctorBriefing(selectedConsultation.doctorBriefing);
  const mainSymptoms = normalizeList(doctorBriefing?.mainSymptoms);
  const specialNotes = normalizeList(doctorBriefing?.specialNotes);
  const attentionLevel =
    doctorBriefing?.attentionLevel ||
    selectedConsultation.aiAnalysis?.riskLevel ||
    "";
  const linkedAppointment = [...consultationAppointments].sort(
    (a, b) =>
      new Date(b.appointmentDate || b.appointmentDateTime || 0) -
      new Date(a.appointmentDate || a.appointmentDateTime || 0),
  )[0];
  const linkedAppointmentDate =
    linkedAppointment?.appointmentDate || linkedAppointment?.appointmentDateTime;
  const buildDoctorSendText = () => {
    return [
      "[환자]",
      `${selectedConsultation.patient?.name || "환자 정보 없음"} / ${
        selectedConsultation.patient?.phone || "전화번호 없음"
      } / ${selectedConsultation.patient?.birth || "생년월일 없음"}`,
      "",
      "[방문 사유]",
      doctorBriefing?.visitReason || "확인 필요",
      "",
      "[AI 요약]",
      selectedConsultation.summary || "요약 없음",
      "",
      "[주요 증상]",
      mainSymptoms.length
        ? mainSymptoms.join(", ")
        : selectedConsultation.aiAnalysis?.symptoms || "확인 필요",
      "",
      "[위험도]",
      attentionLevel || "확인 필요",
      "",
      "[키워드]",
      selectedConsultation.aiAnalysis?.keywords || "없음",
      "",
      "[특이사항]",
      specialNotes.length ? specialNotes.join("\n") : "확인 필요",
      "",
      "[간호사 메모]",
      selectedConsultation.nurseMemo || "메모 없음",
    ].join("\n");
  };

  const openDoctorSend = () => {
    setDoctorSendText(buildDoctorSendText());
    setIsDoctorSendOpen(true);
    setIsDoctorSendDone(false);
  };

  const sendDoctorBriefing = () => {
    console.log("상담 상세 의사용 브리핑 전송:", doctorSendText);
    setIsDoctorSendDone(true);
    alert("의사에게 브리핑 내용을 전송했습니다.");
  };

  const generateDoctorBriefing = async () => {
    setIsDoctorBriefingLoading(true);
    setDoctorBriefingError("");

    try {
      await onGenerateDoctorBriefing?.(selectedConsultation.id);
    } catch (error) {
      console.error("의사용 브리핑 작성 실패:", error);
      setDoctorBriefingError(
        error.response?.data?.message || "의사용 브리핑 작성에 실패했습니다.",
      );
    } finally {
      setIsDoctorBriefingLoading(false);
    }
  };

  const openDoctorBriefingEdit = () => {
    setDoctorBriefingForm({
      visitReason: doctorBriefing?.visitReason || "",
      mainSymptoms: mainSymptoms.join(", "),
      specialNotes: specialNotes.join("\n"),
      attentionLevel: doctorBriefing?.attentionLevel || "",
    });
    setDoctorBriefingError("");
    setIsDoctorBriefingEditing(true);
  };

  const changeDoctorBriefingField = (field) => (event) => {
    setDoctorBriefingForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const saveDoctorBriefing = async () => {
    setIsDoctorBriefingSaving(true);
    setDoctorBriefingError("");

    try {
      await onUpdateDoctorBriefing?.(
        selectedConsultation.id,
        doctorBriefingForm,
      );
      setIsDoctorBriefingEditing(false);
    } catch (error) {
      console.error("의사용 브리핑 수정 실패:", error);
      setDoctorBriefingError(
        error.response?.data?.message || "의사용 브리핑 수정에 실패했습니다.",
      );
    } finally {
      setIsDoctorBriefingSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">상담 상세</h2>
      </div>

      <div className="space-y-3">
        <div className="grid gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-slate-500">환자명</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {selectedConsultation.patient?.name || "환자 정보 없음"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">전화번호</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {selectedConsultation.patient?.phone || "전화번호 없음"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">상담 시간</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {new Date(selectedConsultation.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">생년월일</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {selectedConsultation.patient?.birth || "생년월일 없음"}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">원본 상담 내용</p>
          <p className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 p-3 text-base leading-7 text-slate-700">
            {selectedConsultation.originalText || "내용 없음"}
          </p>
        </div>

        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">간호사 메모</p>
          <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-base leading-7 text-slate-700">
            {selectedConsultation.nurseMemo || "메모 없음"}
          </p>
        </div>

        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold text-slate-900">상담 요약</p>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                linkedAppointment
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {linkedAppointment ? linkedAppointment.status || "예약됨" : "연결된 예약 없음"}
            </span>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-white p-3">
              <p className="text-xs font-bold text-slate-500">상담 날짜</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {new Date(selectedConsultation.createdAt).toLocaleString("ko-KR")}
              </p>
            </div>
            <div className="rounded-md bg-white p-3">
              <p className="text-xs font-bold text-slate-500">환자 정보</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                {selectedConsultation.patient?.name || "이름 없음"} · {selectedConsultation.patient?.phone || "전화번호 없음"}
              </p>
            </div>
            <div className="rounded-md bg-white p-3">
              <p className="text-xs font-bold text-slate-500">주요 증상</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                {selectedConsultation.aiAnalysis?.symptoms || "증상 정보 없음"}
              </p>
            </div>
            <div className="rounded-md bg-white p-3">
              <p className="text-xs font-bold text-slate-500">예약 일정</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                {linkedAppointmentDate
                  ? `${new Date(linkedAppointmentDate).toLocaleString("ko-KR")} · ${linkedAppointment.doctor?.name || "담당의 미지정"}`
                  : "예약 없음"}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-sky-100 bg-white p-3">
            <p className="mb-1 text-xs font-bold text-slate-500">AI 핵심 내용</p>
            <p className="max-h-48 overflow-auto whitespace-pre-wrap text-base leading-7 text-slate-800">
              {selectedConsultation.summary || "요약 없음"}
            </p>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-slate-900">의사용 브리핑</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={generateDoctorBriefing}
                disabled={isDoctorBriefingLoading}
                className="h-8 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isDoctorBriefingLoading
                  ? "브리핑 작성 중..."
                  : doctorBriefing
                    ? "브리핑 다시 작성"
                    : "의사용 브리핑 작성"}
              </button>
              {doctorBriefing && (
                <>
                  <button
                    type="button"
                    onClick={openDoctorBriefingEdit}
                    disabled={isDoctorBriefingEditing}
                    className="h-8 rounded-md border border-blue-300 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    브리핑 수정
                  </button>
                  <button
                    type="button"
                    onClick={openDoctorSend}
                    className="h-8 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    의사에게 전송
                  </button>
                </>
              )}
              <span
                className={`inline-block rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(
                  attentionLevel,
                )}`}
              >
                주의도: {attentionLevel || "분석 없음"}
              </span>
            </div>
          </div>

          {doctorBriefingError && (
            <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">
              {doctorBriefingError}
            </p>
          )}

          {isDoctorBriefingEditing ? (
            <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  방문 사유
                </span>
                <input
                  value={doctorBriefingForm.visitReason}
                  onChange={changeDoctorBriefingField("visitReason")}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  주요 증상 (쉼표 또는 줄바꿈으로 구분)
                </span>
                <textarea
                  value={doctorBriefingForm.mainSymptoms}
                  onChange={changeDoctorBriefingField("mainSymptoms")}
                  className="min-h-20 w-full rounded-md border border-slate-300 bg-white p-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  특이사항 (줄바꿈으로 구분)
                </span>
                <textarea
                  value={doctorBriefingForm.specialNotes}
                  onChange={changeDoctorBriefingField("specialNotes")}
                  className="min-h-24 w-full rounded-md border border-slate-300 bg-white p-3 text-base"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  주의도
                </span>
                <select
                  value={doctorBriefingForm.attentionLevel}
                  onChange={changeDoctorBriefingField("attentionLevel")}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-base"
                >
                  <option value="">미지정</option>
                  <option value="낮음">낮음</option>
                  <option value="보통">보통</option>
                  <option value="높음">높음</option>
                </select>
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDoctorBriefingEditing(false)}
                  disabled={isDoctorBriefingSaving}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={saveDoctorBriefing}
                  disabled={isDoctorBriefingSaving}
                  className="h-9 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white disabled:bg-slate-400"
                >
                  {isDoctorBriefingSaving ? "저장 중..." : "수정 내용 저장"}
                </button>
              </div>
            </div>
          ) : doctorBriefing ? (
            <div className="grid grid-cols-2 gap-3 text-base">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="mb-1 font-semibold text-slate-500">방문 사유</p>
                <p className="text-slate-800">
                  {doctorBriefing.visitReason || "확인 필요"}
                </p>
              </div>

              <div className="rounded-md bg-slate-50 p-3">
                <p className="mb-1 font-semibold text-slate-500">주요 증상</p>
                <ul className="list-disc space-y-1 pl-5 text-slate-800">
                  {(mainSymptoms.length ? mainSymptoms : ["확인 필요"]).map(
                    (symptom) => (
                      <li key={symptom}>{symptom}</li>
                    ),
                  )}
                </ul>
              </div>

              <div className="rounded-md bg-slate-50 p-3">
                <p className="mb-1 font-semibold text-slate-500">특이사항</p>
                <ul className="list-disc space-y-1 pl-5 text-slate-800">
                  {(specialNotes.length ? specialNotes : ["확인 필요"]).map(
                    (note) => (
                      <li key={note}>{note}</li>
                    ),
                  )}
                </ul>
              </div>

            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-base text-slate-500">
              아직 작성하지 않았습니다. 필요할 때 의사용 브리핑 작성을 눌러주세요.
            </p>
          )}

          {isDoctorSendOpen && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm font-semibold text-amber-800">
                아래 내용을 의사에게 전송할 예정입니다. 수정하시겠습니까?
              </p>
              <textarea
                value={doctorSendText}
                onChange={(event) => {
                  setDoctorSendText(event.target.value);
                  setIsDoctorSendDone(false);
                }}
                className="min-h-40 w-full rounded-md border border-slate-300 bg-white p-3 text-base leading-6"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDoctorSendOpen(false)}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={sendDoctorBriefing}
                  className="h-9 rounded-md bg-slate-800 px-3 text-sm font-semibold text-white"
                >
                  전송합니다
                </button>
              </div>
              {isDoctorSendDone && (
                <p className="mt-2 text-sm font-semibold text-green-700">
                  의사에게 전송 완료
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-1 text-sm font-medium text-slate-500">주요 증상</p>
            <p className="text-base text-slate-700">
              {selectedConsultation.aiAnalysis?.symptoms || "분석 없음"}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-1 text-sm font-medium text-slate-500">키워드</p>
            <p className="text-base text-slate-700">
              {selectedConsultation.aiAnalysis?.keywords || "분석 없음"}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="mb-2 text-sm font-medium text-slate-500">위험도</p>
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
            <p className="mb-2 text-lg font-bold text-slate-900">음성 파일</p>
            <p className="mb-2 break-all text-base text-slate-500">
              저장 경로: {audioPath}
            </p>
            <p className="mb-2 break-all text-base text-slate-500">
              재생 주소: {audioUrl}
            </p>
            <audio key={audioUrl} controls className="w-full" src={audioUrl} />
          </div>
        ) : (
          <p className="text-base text-slate-400">음성 파일 없음</p>
        )}
      </div>
    </section>
  );
}

export default ConsultationDetail;
