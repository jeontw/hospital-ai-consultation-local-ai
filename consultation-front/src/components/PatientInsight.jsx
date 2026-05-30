import { useEffect, useState } from "react";
import { getPatientAiInsight } from "../api/consultationApi";

function PatientInsight({ selectedPatient, consultations, getRiskColor }) {
  const [aiInsight, setAiInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    const fetchAiInsight = async () => {
      if (!selectedPatient) {
        setAiInsight("");
        return;
      }

      try {
        setLoadingInsight(true);
        const response = await getPatientAiInsight(selectedPatient.id);
        setAiInsight(response.data);
      } catch (error) {
        console.error("AI 인사이트 조회 실패:", error);
        setAiInsight("AI 인사이트를 불러오지 못했습니다.");
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchAiInsight();
  }, [selectedPatient]);

  if (!selectedPatient) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">환자 인사이트</h2>
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          환자를 선택하면 누적 상담 분석이 표시됩니다.
        </p>
      </section>
    );
  }

  const patientConsultations = consultations.filter(
    (consultation) => consultation.patient?.id === selectedPatient.id,
  );

  const sortedConsultations = [...patientConsultations].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const totalCount = patientConsultations.length;
  const recentConsultation = sortedConsultations[0];

  const symptoms = patientConsultations
    .map((consultation) => consultation.aiAnalysis?.symptoms)
    .filter(Boolean)
    .join(", ");

  const keywords = patientConsultations
    .map((consultation) => consultation.aiAnalysis?.keywords)
    .filter(Boolean)
    .join(", ");

  const highRiskCount = patientConsultations.filter(
    (consultation) =>
      consultation.aiAnalysis?.riskLevel === "높음" ||
      consultation.aiAnalysis?.riskLevel === "HIGH",
  ).length;

  const mediumRiskCount = patientConsultations.filter(
    (consultation) =>
      consultation.aiAnalysis?.riskLevel === "주의" ||
      consultation.aiAnalysis?.riskLevel === "MEDIUM",
  ).length;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">환자 인사이트</h2>

      <div className="mb-3 rounded-md bg-slate-50 p-3">
        <p className="text-xl font-bold text-slate-900">{selectedPatient.name}</p>
        <p className="text-base text-slate-600">{selectedPatient.phone}</p>
        <p className="text-base text-slate-500">
          생년월일: {selectedPatient.birth || "없음"}
        </p>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-base text-slate-500">누적 상담</p>
          <p className="text-2xl font-bold text-slate-900">{totalCount}회</p>
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-base text-slate-500">주의 상담</p>
          <p className="text-2xl font-bold text-amber-600">{mediumRiskCount}회</p>
        </div>
        <div className="rounded-md border border-slate-200 p-3">
          <p className="text-base text-slate-500">높은 상담</p>
          <p className="text-2xl font-bold text-red-600">{highRiskCount}회</p>
        </div>
      </div>

      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 rounded-md border border-slate-200 bg-white p-3">
          <p className="mb-2 text-lg font-bold text-slate-900">AI 종합 분석</p>
          {loadingInsight ? (
            <p className="text-base text-slate-500">
              AI가 환자 상담 기록을 분석 중입니다...
            </p>
          ) : (
            <p className="max-h-56 overflow-auto whitespace-pre-wrap text-base leading-7 text-slate-700">
              {aiInsight || "AI 분석 데이터 없음"}
            </p>
          )}
        </div>

        <p className="mb-2 text-lg font-bold text-slate-900">AI 누적 주의점</p>
        {totalCount === 0 ? (
          <p className="text-base text-slate-500">상담 기록이 없습니다.</p>
        ) : (
          <p className="text-base leading-7 text-slate-700">
            이 환자는 현재까지 {totalCount}회의 상담 기록이 있습니다.
            {mediumRiskCount > 0 &&
              ` 주의 단계 상담이 ${mediumRiskCount}회 확인되었습니다.`}
            {highRiskCount > 0 &&
              ` 높은 위험도 상담이 ${highRiskCount}회 확인되었습니다.`}
            {recentConsultation &&
              ` 최근 상담일은 ${new Date(
                recentConsultation.createdAt,
              ).toLocaleString()}입니다.`}
          </p>
        )}
      </div>

      <div className="mb-3">
        <p className="mb-2 text-lg font-bold text-slate-900">누적 증상</p>
        <p className="max-h-32 overflow-auto whitespace-pre-wrap text-base leading-7 text-slate-700">
          {symptoms || "누적 증상 데이터 없음"}
        </p>
      </div>

      <div className="mb-3">
        <p className="mb-2 text-lg font-bold text-slate-900">누적 키워드</p>
        <p className="max-h-32 overflow-auto whitespace-pre-wrap text-base leading-7 text-slate-700">
          {keywords || "누적 키워드 데이터 없음"}
        </p>
      </div>

      <div>
        <p className="mb-2 text-lg font-bold text-slate-900">상담 타임라인</p>

        {sortedConsultations.length === 0 && (
          <p className="text-base text-slate-500">상담 기록이 없습니다.</p>
        )}

        <div className="max-h-56 overflow-auto">
          {sortedConsultations.map((consultation) => (
            <div
              key={consultation.id}
              className="border-l border-slate-300 pb-3 pl-4"
            >
              <p className="text-sm text-slate-400">
                {new Date(consultation.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-base font-semibold text-slate-900">
                {consultation.summary || "요약 없음"}
              </p>
              <span
                className={`mt-2 inline-block rounded-full border px-3 py-1 text-sm font-bold ${getRiskColor(
                  consultation.aiAnalysis?.riskLevel,
                )}`}
              >
                위험도: {consultation.aiAnalysis?.riskLevel || "분석 없음"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PatientInsight;
