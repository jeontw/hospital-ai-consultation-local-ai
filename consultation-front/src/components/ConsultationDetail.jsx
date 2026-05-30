import { useState } from "react";

function ConsultationDetail({
  selectedConsultation,
  getRiskColor,
  onOpenInsight,
  onGenerateAppointmentDraft,
  emptyMessage = "상담을 선택하면 상세 정보가 표시됩니다.",
  onBackToList,
}) {
  const [draftLoading, setDraftLoading] = useState(false);

  if (!selectedConsultation) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">상담 상세</h2>
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          {emptyMessage}
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

  const handleGenerateDraft = async () => {
    setDraftLoading(true);
    try {
      await onGenerateAppointmentDraft?.();
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">상담 상세</h2>

        <div className="flex gap-2">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              목록으로 돌아가기
            </button>
          )}

          <button
            onClick={handleGenerateDraft}
            disabled={draftLoading}
            className="h-9 rounded-md bg-slate-800 px-3 text-sm font-medium text-white disabled:bg-slate-300"
          >
            {draftLoading ? "초안 생성 중..." : "예약 초안 생성"}
          </button>

          <button
            onClick={() => onOpenInsight?.(selectedConsultation.patient)}
            disabled={!selectedConsultation.patient}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 disabled:bg-slate-200"
          >
            AI 인사이트
          </button>
        </div>
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
          <p className="mb-2 text-lg font-bold text-slate-900">화자 분리 결과</p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-base leading-7 text-slate-700">
            {selectedConsultation.speakerText || "화자 분리 결과 없음"}
          </pre>
        </div>

        <div>
          <p className="mb-2 text-lg font-bold text-slate-900">AI 요약</p>
          <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-base leading-7 text-slate-700">
            {selectedConsultation.summary || "요약 없음"}
          </p>
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
