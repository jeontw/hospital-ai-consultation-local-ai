function ConsultationList({
  consultations,
  searchKeyword,
  setSearchKeyword,
  editingId,
  editText,
  setEditText,
  updateConsultation,
  deleteConsultation,
  setEditingId,
  setSelectedConsultation,
  getRiskColor,
}) {
  const filteredConsultations = [...consultations]
    .filter((consultation) => {
      const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();

      if (!normalizedSearchKeyword) {
        return true;
      }

      const patientName = consultation.patient?.name || "";
      const consultationText = consultation.originalText || "";

      return [patientName, consultationText]
        .map((value) => value.toLowerCase())
        .some((value) => value.includes(normalizedSearchKeyword));
    })
    .sort((a, b) => b.id - a.id);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold text-slate-900">상담 목록</h2>
      </div>

      <input
        type="text"
        placeholder="환자명 또는 상담 내용 검색"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      {consultations.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          상담 기록이 없습니다.
        </p>
      )}

      {consultations.length > 0 && filteredConsultations.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          검색 결과가 없습니다.
        </p>
      )}

      <div className="divide-y divide-slate-200">
        {filteredConsultations.map((consultation) => (
          <div
            key={consultation.id}
            className="py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">
                  {consultation.patient?.name || "환자 정보 없음"}
                </p>

                <p className="text-sm text-slate-400">
                  {new Date(consultation.createdAt).toLocaleString()}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(
                  consultation.aiAnalysis?.riskLevel,
                )}`}
              >
                위험도: {consultation.aiAnalysis?.riskLevel || "분석 없음"}
              </span>
            </div>

            {editingId === consultation.id ? (
              <div className="mt-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />

                <button
                  onClick={() => updateConsultation(consultation.id)}
                  className="mt-2 rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
                >
                  저장
                </button>
              </div>
            ) : (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">
                {consultation.originalText}
              </p>
            )}

            <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              AI 요약: {consultation.summary}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              음성 파일: {consultation.audioPath}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setSelectedConsultation(consultation)}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
              >
                상세
              </button>

              <button
                onClick={() => {
                  setEditingId(consultation.id);
                  setEditText(consultation.originalText);
                }}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                수정
              </button>

              <button
                onClick={() => deleteConsultation(consultation.id)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
              >
                삭제
              </button>
            </div>

            {consultation.audioPath?.startsWith("/uploads/") && (
              <audio
                key={consultation.audioPath}
                controls
                className="mt-2 w-full"
                src={`http://localhost:8080${consultation.audioPath}`}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default ConsultationList;
