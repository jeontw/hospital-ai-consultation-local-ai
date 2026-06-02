function ConsultationForm({
  patients,
  selectedPatientId,
  audioFile,
  setAudioFile,
  nurseMemo,
  setNurseMemo,
  addConsultation,
  previewAiConsultation,
  fileInputRef,
  isLoading,
  isPreviewLoading,
  loadingMessage,
}) {
  const selectedPatient = patients.find(
    (patient) => String(patient.id) === String(selectedPatientId),
  );

  return (
    <section className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">상담 등록</h2>

      <div className="flex flex-1 flex-col gap-3">
        {selectedPatient ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-base font-medium text-slate-700">
            상담 등록 대상: {selectedPatient.name} / {selectedPatient.phone}
          </p>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base font-medium text-slate-500">
            좌측 환자 목록에서 상담 등록할 환자를 선택하세요.
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
            onChange={(e) => setAudioFile(e.target.files[0] || null)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
          />
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
              disabled={!audioFile || isLoading || isPreviewLoading}
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
            placeholder="환자와 통화하며 기록한 상담 내용을 입력하세요."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={previewAiConsultation}
            disabled={isLoading || isPreviewLoading}
            className={`h-10 rounded-md px-4 text-base font-semibold transition ${
              isLoading || isPreviewLoading
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isPreviewLoading ? "미리보기 중..." : "AI 미리보기"}
          </button>

          <button
            onClick={addConsultation}
            disabled={isLoading || isPreviewLoading}
            className={`h-10 rounded-md px-4 text-base font-semibold text-white transition ${
              isLoading || isPreviewLoading
                ? "cursor-not-allowed bg-slate-400"
                : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            {isLoading ? "처리 중..." : "상담 등록"}
          </button>
        </div>

        {isLoading && (
          <p className="text-base font-medium text-slate-600">
            {loadingMessage || "AI 분석 중입니다..."}
          </p>
        )}
      </div>
    </section>
  );
}

export default ConsultationForm;
