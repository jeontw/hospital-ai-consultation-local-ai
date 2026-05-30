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
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">상담 등록</h2>

      <div className="flex flex-col gap-3">
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">환자 선택</option>

          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} / {patient.phone}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRegistrationMode("audio")}
            className={`px-3 py-2 rounded border ${
              registrationMode === "audio"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700"
            }`}
          >
            음성 파일 업로드
          </button>

          <button
            type="button"
            onClick={() => setRegistrationMode("text")}
            className={`px-3 py-2 rounded border ${
              registrationMode === "text"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700"
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
            className="border p-2 rounded"
          />
        ) : (
          <textarea
            value={consultationText}
            onChange={(e) => setConsultationText(e.target.value)}
            className="border p-2 rounded min-h-36"
            placeholder="상담 내용을 입력하세요."
          />
        )}

        <button
          onClick={addConsultation}
          disabled={isLoading}
          className={`px-4 py-2 rounded text-white transition ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed animate-pulse"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "처리 중..." : "상담 등록"}
        </button>
        {isLoading && (
          <p className="text-sm text-blue-600 font-semibold animate-pulse">
            {loadingMessage || "AI 분석 중입니다..."}
          </p>
        )}
      </div>
    </div>
  );
}

export default ConsultationForm;
