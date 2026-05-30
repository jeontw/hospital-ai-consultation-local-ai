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
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">상담 목록</h2>
        <input
          type="text"
          placeholder="환자명 또는 상담 내용 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="h-9 w-80 rounded-md border border-slate-300 px-3 text-base"
        />
      </div>

      {consultations.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-base text-slate-500">
          상담 기록이 없습니다.
        </p>
      )}

      {consultations.length > 0 && filteredConsultations.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-base text-slate-500">
          검색 결과가 없습니다.
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="grid h-8 grid-cols-[120px_160px_1fr_96px_150px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
          <span>환자</span>
          <span>일시</span>
          <span>요약</span>
          <span>위험도</span>
          <span className="text-right">관리</span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredConsultations.map((consultation) => (
            <div
              key={consultation.id}
              onClick={() => setSelectedConsultation(consultation)}
              className="cursor-pointer px-3 py-1.5 hover:bg-slate-50"
            >
              {editingId === consultation.id ? (
                <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="h-20 flex-1 rounded-md border border-slate-300 px-3 py-2 text-base"
                  />
                  <button
                    onClick={() => updateConsultation(consultation.id)}
                    className="h-9 rounded-md bg-slate-800 px-3 text-sm font-medium text-white"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div className="grid min-h-11 grid-cols-[120px_160px_1fr_96px_150px] items-center gap-2 text-base">
                  <p className="truncate font-bold text-slate-900">
                    {consultation.patient?.name || "환자 정보 없음"}
                  </p>
                  <p className="truncate text-sm text-slate-400">
                    {new Date(consultation.createdAt).toLocaleString()}
                  </p>
                  <p className="truncate text-slate-700">
                    {consultation.summary || consultation.originalText || "내용 없음"}
                  </p>
                  <span
                    className={`w-fit rounded-full border px-2 py-0.5 text-sm font-bold ${getRiskColor(
                      consultation.aiAnalysis?.riskLevel,
                    )}`}
                  >
                    {consultation.aiAnalysis?.riskLevel || "분석 없음"}
                  </span>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConsultation(consultation);
                      }}
                      className="h-8 rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                    >
                      상세
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(consultation.id);
                        setEditText(consultation.originalText);
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConsultation(consultation.id);
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ConsultationList;
