import { useMemo, useRef, useState } from "react";

import {
  EVALUATION_MODELS,
  buildEvaluationReport,
  calculateEvaluationSummary,
} from "../utils/performanceEvaluation";

function booleanBadge(value) {
  return value ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
}

function booleanText(value) {
  return value ? "True" : "False";
}

function patientRecommended(run) {
  return (
    run.success?.patientRecommended ?? run.patientRecommendation?.id != null
  );
}

function appointmentRegistrationReady(run) {
  return (
    run.success?.appointmentRegistrationReady ??
    Boolean(
      run.reservation?.predicted &&
        run.reservation?.appointmentDate &&
        run.reservation?.recommendedDoctorId != null &&
        run.patientRecommendation?.id != null,
    )
  );
}

function patientComparisonText(value) {
  if (value === true) return "일치";
  if (value === false) return "불일치";
  return "비교 안 함";
}

function PerformanceEvaluationModal({
  runs,
  collectionEnabled,
  onChangeCollectionEnabled,
  onChangeRuns,
  onResetSystemData,
  isSystemResetting = false,
  onClose,
}) {
  const [statusMessage, setStatusMessage] = useState("");
  const reportRef = useRef(null);
  const summary = useMemo(() => calculateEvaluationSummary(runs), [runs]);
  const report = useMemo(() => buildEvaluationReport(runs), [runs]);

  const updateCaseNumber = (runId, caseNumber) => {
    onChangeRuns((current) =>
      current.map((run) =>
        run.id === runId ? { ...run, caseNumber: Number(caseNumber) } : run,
      ),
    );
  };

  const removeRun = (run) => {
    if (!confirm(`${run.modelLabel} 대본 ${run.caseNumber} 기록을 삭제할까요?`)) {
      return;
    }
    onChangeRuns((current) => current.filter((item) => item.id !== run.id));
    setStatusMessage("선택한 실행 기록을 삭제했습니다.");
  };

  const clearRuns = () => {
    if (!runs.length || !confirm("수집한 성능평가 기록을 전부 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }
    onChangeRuns([]);
    setStatusMessage("전체 수집 기록을 초기화했습니다. 다음 실행은 대본 1번부터 저장됩니다.");
  };

  const clearModelRuns = (model) => {
    const count = runs.filter((run) => run.model === model.id).length;
    if (!count || !confirm(`${model.label} 기록 ${count}건을 초기화할까요? 다른 모델 기록은 유지됩니다.`)) {
      return;
    }
    onChangeRuns((current) => current.filter((run) => run.model !== model.id));
    setStatusMessage(`${model.label} 기록을 초기화했습니다.`);
  };

  const resetSystemData = async () => {
    if (
      !confirm(
        "예약, 상담, AI 분석 결과를 모두 초기화할까요?\n\n환자 목록, 의사 목록, 현재 수집한 성능평가 결과는 유지됩니다.",
      )
    ) {
      return;
    }

    const result = await onResetSystemData?.();
    if (result) {
      setStatusMessage(
        `실험 DB 초기화 완료: 예약 ${result.deletedAppointments || 0}건, 상담 ${result.deletedConsultations || 0}건, AI 분석 ${result.deletedAiAnalyses || 0}건 삭제`,
      );
    }
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setStatusMessage("전체 원자료를 클립보드에 복사했습니다.");
    } catch {
      reportRef.current?.focus();
      reportRef.current?.select();
      setStatusMessage("아래 텍스트를 선택했습니다. Ctrl+C를 눌러 복사하세요.");
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `llm-performance-${new Date().toISOString().slice(0, 10)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-3">
      <section className="max-h-[96vh] w-full max-w-[1500px] overflow-auto rounded-xl bg-slate-100 shadow-2xl">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">논문용 LLM 성능평가 원자료 수집</h2>
            <p className="mt-1 text-sm text-slate-500">대본 21개 × 모델 3개 · 현재 {runs.length}/63회</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold ${collectionEnabled ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-slate-50 text-slate-600"}`}>
              <input type="checkbox" checked={collectionEnabled} onChange={(event) => onChangeCollectionEnabled(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
              자동 수집 {collectionEnabled ? "켜짐" : "꺼짐"}
            </label>
            <button type="button" onClick={copyReport} className="h-10 rounded-md bg-slate-900 px-4 text-sm font-bold text-white">전체 텍스트 복사</button>
            <button type="button" onClick={downloadReport} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">TXT 저장</button>
            <button type="button" onClick={clearRuns} disabled={!runs.length} className="h-10 rounded-md border border-red-200 bg-white px-4 text-sm font-bold text-red-700 disabled:text-slate-400">수집 결과 초기화</button>
            <button type="button" onClick={resetSystemData} disabled={isSystemResetting} className="h-10 rounded-md border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-900 disabled:opacity-60">
              {isSystemResetting ? "DB 초기화 중..." : "실험 DB 초기화"}
            </button>
            <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700">닫기</button>
          </div>
        </header>

        <div className="space-y-5 p-5">
          {statusMessage && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{statusMessage}</p>}

          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
            <p className="font-bold">수집 원칙</p>
            <p>이 화면은 정확도를 판단하지 않습니다. AI 반환값과 필드 추출·일시 변환·환자 및 의사 추천 생성 여부만 정리합니다.</p>
            <p className="mt-1 font-semibold">성능평가 중에는 상담과 예약을 DB에 저장하지 않으므로 세 모델이 같은 날짜를 반환해도 충돌하지 않습니다.</p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">선택 환자와 시스템 추천 비교</h3>
            <p className="mt-2 text-3xl font-bold text-slate-950">{summary.patientIdentificationRate}</p>
            <p className="mt-1 text-sm text-slate-500">환자를 선택한 실행만 비교 · ID 일치 {summary.patientSuccesses} / 비교 {summary.patientRatedCount}</p>
          </section>

          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-bold text-slate-900">모델별 수집 현황</h3>
            <table className="min-w-[1500px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-600">
                  {[
                    "모델", "수집", "환자 추천", "환자정보 추출", "증상 추출", "예약 의도", "예약일시 변환",
                    "의사 추천", "방문사유 추출", "예약 등록 준비", "평균 처리시간", "JSON 성공",
                  ].map((heading) => <th key={heading} className="border border-slate-200 p-2">{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {summary.models.map((model) => (
                  <tr key={model.id}>
                    <td className="border border-slate-200 p-2 font-bold">{model.label}</td>
                    <td className="border border-slate-200 p-2">{model.count}/21</td>
                    <td className="border border-slate-200 p-2">{model.patientRecommendationRate}</td>
                    <td className="border border-slate-200 p-2">{model.patientInfoExtractionRate}</td>
                    <td className="border border-slate-200 p-2">{model.symptomExtractionRate}</td>
                    <td className="border border-slate-200 p-2">{model.appointmentIntentRate}</td>
                    <td className="border border-slate-200 p-2">{model.appointmentDateTimeRate}</td>
                    <td className="border border-slate-200 p-2">{model.doctorSelectionRate}</td>
                    <td className="border border-slate-200 p-2">{model.visitReasonRate}</td>
                    <td className="border border-slate-200 p-2">{model.appointmentRegistrationReadyRate}</td>
                    <td className="border border-slate-200 p-2">{model.averageProcessingTime}</td>
                    <td className="border border-slate-200 p-2">{model.jsonSuccessRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {EVALUATION_MODELS.map((model) => {
            const modelRuns = runs.filter((run) => run.model === model.id).sort((a, b) => Number(a.caseNumber) - Number(b.caseNumber));
            return (
              <section key={model.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-slate-950">{model.label}</h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{modelRuns.length}/21</span>
                    <button type="button" onClick={() => clearModelRuns(model)} disabled={!modelRuns.length} className="h-8 rounded border border-red-200 px-2.5 text-xs font-bold text-red-700 disabled:text-slate-400">이 모델 초기화</button>
                  </div>
                </div>

                {!modelRuns.length ? <p className="rounded-md bg-slate-50 p-4 text-sm text-slate-500">아직 수집된 결과가 없습니다.</p> : (
                  <div className="space-y-3">
                    {modelRuns.map((run) => (
                      <details key={run.id} className="rounded-md border border-slate-200 bg-slate-50">
                        <summary className="grid cursor-pointer list-none items-center gap-2 p-3 md:grid-cols-[90px_1.5fr_repeat(4,110px)]">
                          <span className="font-bold">대본 {String(run.caseNumber).padStart(2, "0")}</span>
                          <span className="truncate text-sm text-slate-700">{run.inputText}</span>
                          <span className={`rounded px-2 py-1 text-center text-xs font-bold ${booleanBadge(patientRecommended(run))}`}>환자추천 {booleanText(patientRecommended(run))}</span>
                          <span className={`rounded px-2 py-1 text-center text-xs font-bold ${booleanBadge(run.success?.appointmentDateTimeResolved)}`}>일시 {booleanText(run.success?.appointmentDateTimeResolved)}</span>
                          <span className={`rounded px-2 py-1 text-center text-xs font-bold ${booleanBadge(run.success?.doctorSelected)}`}>의사 {booleanText(run.success?.doctorSelected)}</span>
                          <span className={`rounded px-2 py-1 text-center text-xs font-bold ${booleanBadge(appointmentRegistrationReady(run))}`}>등록준비 {booleanText(appointmentRegistrationReady(run))}</span>
                        </summary>

                        <div className="space-y-3 border-t border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                          <label className="block max-w-40 font-semibold text-slate-600">대본 번호
                            <input type="number" min="1" value={run.caseNumber} onChange={(event) => updateCaseNumber(run.id, event.target.value)} className="mt-1 h-9 w-full rounded border border-slate-300 px-2" />
                          </label>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-md bg-slate-50 p-3">
                              <p className="font-bold text-slate-900">AI 추출 환자 / 시스템 선택</p>
                              <p>추출: {run.extractedPatient?.name || "없음"} / {run.extractedPatient?.phone || run.extractedPatient?.phoneLast4 || "전화 없음"} / {run.extractedPatient?.birth || "생년월일 없음"}</p>
                              <p>비교용 선택 환자: {run.expectedPatient?.name || "선택 안 함"} {run.expectedPatient ? `(ID ${run.expectedPatient.id})` : ""}</p>
                              <p>추천: {run.patientRecommendation?.name || "없음"} (ID {run.patientRecommendation?.id ?? "없음"})</p>
                              <p>선택 환자와 추천 ID 비교: {patientComparisonText(run.expectedPatient ? run.success?.patientIdentified : null)}</p>
                              <p>식별 근거: {run.patientRecommendation?.reason || "없음"}</p>
                            </div>
                            <div className="rounded-md bg-slate-50 p-3">
                              <p className="font-bold text-slate-900">예약 처리 결과</p>
                              <p>추출 일시: {[run.reservation?.dateText, run.reservation?.timeText].filter(Boolean).join(" ") || "없음"}</p>
                              <p>변환 일시: {run.reservation?.appointmentDate || "없음"}</p>
                              <p>추천 의사: {run.reservation?.recommendedDoctorName || "없음"}</p>
                              <p>방문 사유: {run.reservation?.visitReason || "없음"}</p>
                              <p>예약 등록 준비값: {booleanText(appointmentRegistrationReady(run))}</p>
                              <p className="font-semibold text-emerald-800">실제 DB 반영: 미실행(성능평가 모드)</p>
                            </div>
                          </div>
                          <div className="rounded-md bg-slate-50 p-3">
                            <p className="font-bold text-slate-900">상담 분석</p>
                            <p>{run.summary || "요약 없음"}</p>
                            <p>증상: {run.symptoms?.join(", ") || "없음"} / 위험도: {run.riskLevel || "없음"}</p>
                            <p>키워드: {run.keywords?.join(", ") || "없음"}</p>
                          </div>
                          <details className="rounded border border-slate-200 bg-slate-50 p-3">
                            <summary className="cursor-pointer font-bold">정제 전 AI JSON</summary>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs">{run.json?.raw || run.json?.error || "없음"}</pre>
                          </details>
                          <div className="flex justify-end"><button type="button" onClick={() => removeRun(run)} className="h-9 rounded border border-red-200 px-3 font-bold text-red-700">이 기록 삭제</button></div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">한 번에 복사할 통합 원자료</h3>
            <p className="mb-3 mt-1 text-sm text-slate-500">아래 텍스트를 그대로 복사해 최종 정확도·환각·위험성 분석을 요청하면 됩니다.</p>
            <textarea ref={reportRef} readOnly value={report} onFocus={(event) => event.target.select()} className="min-h-[500px] w-full rounded-md border border-slate-300 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100" />
          </section>
        </div>
      </section>
    </div>
  );
}

export default PerformanceEvaluationModal;
