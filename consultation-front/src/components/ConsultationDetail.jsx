function ConsultationDetail({
  selectedConsultation,
  getRiskColor,
  onOpenInsight,
}) {
  if (!selectedConsultation) {
    return (
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">상담 상세</h2>
        <p className="text-gray-400">상담을 선택하면 상세 정보가 표시됩니다.</p>
      </div>
    );
  }

  const audioPath = selectedConsultation.audioPath;

  const audioUrl = audioPath
    ? audioPath.startsWith("http")
      ? audioPath
      : `http://localhost:8080${audioPath.startsWith("/") ? audioPath : `/${audioPath}`}`
    : "";

  return (
    <div className="mt-6 bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-4">상담 상세</h2>

      <div className="space-y-4">
        <div>
          <p className="font-bold">환자명</p>
          <p>{selectedConsultation.patient?.name || "환자 정보 없음"}</p>
        </div>

        <div>
          <p className="font-bold">전화번호</p>
          <p>{selectedConsultation.patient?.phone || "전화번호 없음"}</p>
        </div>

        <button
          onClick={() => onOpenInsight(selectedConsultation.patient)}
          className="bg-purple-500 text-white px-3 py-1 rounded"
        >
          이 환자 AI 인사이트 보기
        </button>
        <div>
          <p className="font-bold">상담 시간</p>
          <p>{new Date(selectedConsultation.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <p className="font-bold">원본 상담 내용</p>
          <p className="whitespace-pre-wrap">
            {selectedConsultation.originalText || "내용 없음"}
          </p>
        </div>
        <div>
          <p className="font-bold">화자 분리 결과</p>
          <pre className="bg-gray-50 rounded-xl p-4 whitespace-pre-wrap text-sm">
            {selectedConsultation.speakerText || "화자 분리 결과 없음"}
          </pre>
        </div>

        <div>
          <p className="font-bold">AI 요약</p>
          <p className="whitespace-pre-wrap">
            {selectedConsultation.summary || "요약 없음"}
          </p>
        </div>

        <div>
          <p className="font-bold">주요 증상</p>
          <p>{selectedConsultation.aiAnalysis?.symptoms || "분석 없음"}</p>
        </div>

        <div>
          <p className="font-bold">키워드</p>
          <p>{selectedConsultation.aiAnalysis?.keywords || "분석 없음"}</p>
        </div>

        <div>
          <p className="font-bold">위험도</p>
          <span
            className={`inline-block rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(
              selectedConsultation.aiAnalysis?.riskLevel,
            )}`}
          >
            {selectedConsultation.aiAnalysis?.riskLevel || "분석 없음"}
          </span>
        </div>

        {audioPath ? (
          <div>
            <p className="font-bold mb-2">음성 파일</p>

            <p className="text-sm text-gray-500 mb-2 break-all">
              저장 경로: {audioPath}
            </p>

            <p className="text-sm text-gray-500 mb-2 break-all">
              재생 주소: {audioUrl}
            </p>

            <audio key={audioUrl} controls className="w-full" src={audioUrl} />
          </div>
        ) : (
          <p className="text-gray-400">음성 파일 없음</p>
        )}
      </div>
    </div>
  );
}

export default ConsultationDetail;
