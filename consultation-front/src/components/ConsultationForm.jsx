function ConsultationForm({
  patients,
  selectedPatientId,
  setSelectedPatientId,
  registrationMode,
  setRegistrationMode,
  setAudioFile,
  consultationText,
  setConsultationText,
  addConsultation,
  fileInputRef,
  isLoading,
  loadingMessage,
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
        상담 등록
      </h2>

      <div className="flex flex-col gap-3">
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">환자 선택</option>

          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} / {patient.phone}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRegistrationMode("audio")}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              registrationMode === "audio"
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            음성 파일 업로드
          </button>

          <button
            type="button"
            onClick={() => setRegistrationMode("text")}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${
              registrationMode === "text"
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            상담 내용 직접 입력
          </button>
        </div>

        {registrationMode === "audio" ? (
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files[0] || null)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        ) : (
          <textarea
            value={consultationText}
            onChange={(e) => setConsultationText(e.target.value)}
            className="min-h-36 rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="상담 내용을 입력하세요."
          />
        )}

        <button
          onClick={addConsultation}
          disabled={isLoading}
          className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
            isLoading
              ? "cursor-not-allowed bg-slate-400"
              : "bg-slate-800 hover:bg-slate-700"
          }`}
        >
          {isLoading ? "처리 중..." : "상담 등록"}
        </button>
        {isLoading && (
          <p className="text-sm font-medium text-slate-600">
            {loadingMessage || "AI 분석 중입니다..."}
          </p>
        )}
      </div>
    </section>
  );
}

export default ConsultationForm;
