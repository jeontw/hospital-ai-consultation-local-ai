function ConsultationForm({
  patients,
  selectedPatientId,
  audioFile,
  setAudioFile,
  nurseMemo,
  setNurseMemo,
  previewAiConsultation,
  fileInputRef,
  isPreviewLoading,
  evaluationMode = false,
}) {
  const selectedPatient = patients.find(
    (patient) => String(patient.id) === String(selectedPatientId),
  );

  return (
    <section className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          {evaluationMode ? "성능평가 대본 분석" : "상담 등록"}
        </h2>
        {evaluationMode && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
            자동 수집 중
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {selectedPatient ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-base font-medium text-slate-700">
            {evaluationMode ? "비교용 선택 환자" : "상담 등록 대상"}: {selectedPatient.name} / {selectedPatient.phone}
          </p>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base font-medium text-slate-500">
            {evaluationMode
              ? "성능평가에서는 환자를 선택하지 않아도 됩니다."
              : "좌측 환자 목록에서 상담 등록할 환자를 선택하세요."}
          </p>
        )}

        <div className="space-y-2">
          <label className="mb-1 block text-base font-medium text-slate-700">
            파일 업로드
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            disabled={evaluationMode || isPreviewLoading}
            onChange={(e) => setAudioFile(e.target.files[0] || null)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
          />
          {evaluationMode && (
            <p className="text-xs font-semibold text-emerald-700">
              동일 환경 비교를 위해 Whisper 파일 입력은 비활성화됩니다.
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-600">
              선택 파일명: {audioFile?.name || "선택된 파일 없음"}
            </p>
            <button
              type="button"
              onClick={() => {
                setAudioFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={!audioFile || isPreviewLoading}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              파일 해제
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-base font-medium text-slate-700">
            간호사 메모
          </label>
          <textarea
            value={nurseMemo}
            onChange={(e) => setNurseMemo(e.target.value)}
            className="min-h-32 w-full rounded-md border border-slate-300 px-3 py-2 text-base leading-6"
            placeholder={
              evaluationMode
                ? "92% 정확도 수준으로 준비한 실험 대본을 붙여넣으세요."
                : "환자와 통화하며 기록한 상담 내용을 입력하세요."
            }
          />
          {evaluationMode && (
            <p className="mt-1 text-xs leading-5 text-emerald-700">
              환자를 선택하면 시스템 추천과 ID만 비교하고, 선택하지 않으면 "비교 안 함"으로 기록합니다. 분석 결과는 바꾸지 않습니다.
            </p>
          )}
        </div>

        <button
          onClick={previewAiConsultation}
          disabled={isPreviewLoading}
          className={`h-10 rounded-md px-4 text-base font-semibold text-white transition ${
            isPreviewLoading
              ? "cursor-not-allowed bg-slate-400"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {isPreviewLoading
            ? "처리 중..."
            : evaluationMode
              ? "분석 실행 및 결과 수집"
              : "상담 등록"}
        </button>

        {isPreviewLoading && (
          <p className="text-base font-medium text-slate-600">
            {evaluationMode
              ? "모델 분석 결과와 성능 정보를 수집 중입니다..."
              : "AI 분석 후 상담 등록 확인 창을 준비 중입니다..."}
          </p>
        )}
      </div>
    </section>
  );
}

export default ConsultationForm;
