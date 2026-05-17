function ConsultationForm({
  patients,
  selectedPatientId,
  setSelectedPatientId,
  setAudioFile,
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

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files[0])}
          className="border p-2 rounded"
        />

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
