function ConsultationForm({
  patients,
  selectedPatientId,
  registrationMode,
  setRegistrationMode,
  audioFile,
  setAudioFile,
  consultationText,
  setConsultationText,
  addConsultation,
  fileInputRef,
  isLoading,
  loadingMessage,
}) {
  const selectedPatient = patients.find(
    (patient) => String(patient.id) === String(selectedPatientId),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">상담 등록</h2>

      <div className="flex flex-col gap-3">
        {selectedPatient ? (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-base font-medium text-slate-700">
            상담 등록 대상: {selectedPatient.name} / {selectedPatient.phone}
          </p>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base font-medium text-slate-500">
            좌측 환자 목록에서 상담 등록할 환자를 선택하세요.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRegistrationMode("audio")}
            className={`h-10 rounded-md border px-3 text-base font-medium ${
              registrationMode === "audio"
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            파일 업로드
          </button>

          <button
            type="button"
            onClick={() => setRegistrationMode("text")}
            className={`h-10 rounded-md border px-3 text-base font-medium ${
              registrationMode === "text"
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            상담 내용 직접 입력
          </button>
        </div>

        {registrationMode === "audio" ? (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files[0] || null)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-base file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700"
            />
            <p className="truncate rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-600">
              선택 파일명: {audioFile?.name || "선택된 파일 없음"}
            </p>
          </div>
        ) : (
          <textarea
            value={consultationText}
            onChange={(e) => setConsultationText(e.target.value)}
            className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-base leading-6"
            placeholder="상담 내용을 입력하세요."
          />
        )}

        <button
          onClick={addConsultation}
          disabled={isLoading}
          className={`h-10 rounded-md px-4 text-base font-semibold text-white transition ${
            isLoading
              ? "cursor-not-allowed bg-slate-400"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {isLoading ? "처리 중..." : "상담 등록"}
        </button>

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
