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
      recommendedQuestions: [],
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
  getRiskColor,
  emptyMessage = "상담을 선택하면 상세 정보가 표시됩니다.",
  onBackToList,
}) {
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
  const recommendedQuestions = normalizeList(
    doctorBriefing?.recommendedQuestions,
  );
  const attentionLevel =
    doctorBriefing?.attentionLevel ||
    selectedConsultation.aiAnalysis?.riskLevel ||
    "";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">상담 상세</h2>

        {onBackToList && (
          <button
            onClick={onBackToList}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            목록으로 돌아가기
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-3">
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

        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">AI 요약</p>
          <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-base leading-7 text-slate-700">
            {selectedConsultation.summary || "요약 없음"}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-slate-900">의사용 브리핑</p>
            <span
              className={`inline-block rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(
                attentionLevel,
              )}`}
            >
              주의도: {attentionLevel || "분석 없음"}
            </span>
          </div>

          {doctorBriefing ? (
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

              <div className="rounded-md bg-slate-50 p-3">
                <p className="mb-1 font-semibold text-slate-500">
                  추천 확인 질문
                </p>
                <ul className="list-disc space-y-1 pl-5 text-slate-800">
                  {(
                    recommendedQuestions.length
                      ? recommendedQuestions
                      : ["증상은 언제부터 시작되었나요?"]
                  ).map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-3 text-base text-slate-500">
              브리핑 없음
            </p>
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
