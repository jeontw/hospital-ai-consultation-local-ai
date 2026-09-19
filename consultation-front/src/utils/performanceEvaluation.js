export const EVALUATION_STORAGE_KEY = "hospital-ai-performance-evaluation-v2";

export const EVALUATION_MODELS = [
  { id: "qwen2.5:3b", label: "Qwen 3B" },
  { id: "qwen2.5:7b", label: "Qwen 7B" },
  { id: "exaone3.5:7.8b", label: "EXAONE 7.8B" },
];

export function getModelLabel(model) {
  return EVALUATION_MODELS.find((item) => item.id === model)?.label || model || "모델 확인 불가";
}

export function loadEvaluationRuns() {
  try {
    const stored = JSON.parse(localStorage.getItem(EVALUATION_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function createEvaluationRun({
  preview,
  inputText,
  expectedPatient,
  model,
  existingRuns,
  clientProcessingMs,
  requestError,
}) {
  const resolvedModel = preview?.aiModel || model || "unknown";
  const modelRuns = existingRuns.filter((run) => run.model === resolvedModel);
  const nextCaseNumber = modelRuns.reduce(
    (largest, run) => Math.max(largest, Number(run.caseNumber) || 0),
    0,
  ) + 1;
  const recommendedPatientId = preview?.recommendedPatientId ?? null;
  const expectedPatientId = expectedPatient?.id ?? null;
  const patientIdentified =
    expectedPatientId == null
      ? null
      : recommendedPatientId != null &&
        String(recommendedPatientId) === String(expectedPatientId);
  const extractedPatient = {
    name: preview?.extractedPatientName || "",
    phone: preview?.extractedPhone || "",
    phoneLast4: preview?.extractedPhoneLast4 || "",
    birth: preview?.extractedBirth || "",
  };
  const symptoms = Array.isArray(preview?.symptoms) ? preview.symptoms : [];
  const appointmentDate = preview?.appointmentDate || "";
  const recommendedDoctorId = preview?.recommendedDoctorId ?? null;
  const visitReason = preview?.visitReason || "";

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    caseNumber: nextCaseNumber,
    model: resolvedModel,
    modelLabel: getModelLabel(resolvedModel),
    inputText: inputText || "",
    expectedPatient: expectedPatient
      ? {
          id: expectedPatient.id,
          name: expectedPatient.name || "",
          phone: expectedPatient.phone || "",
          birth: expectedPatient.birth || "",
        }
      : null,
    extractedPatient,
    patientRecommendation: {
      id: recommendedPatientId,
      name: preview?.recommendedPatientName || "",
      reason: preview?.patientRecommendationReason || "",
      candidates: preview?.patientCandidates || [],
    },
    patientIdentified,
    summary: preview?.summary || "",
    symptoms,
    riskLevel: preview?.riskLevel || "",
    keywords: Array.isArray(preview?.keywords) ? preview.keywords : [],
    reservation: {
      predicted: Boolean(preview?.needReservation),
      appointmentDate,
      dateText: preview?.appointmentDateText || "",
      timeText: preview?.appointmentTimeText || "",
      dateDetected: Boolean(preview?.appointmentDateText || appointmentDate),
      timeDetected: Boolean(preview?.appointmentTimeText || appointmentDate),
      dateTimeResolved: Boolean(appointmentDate),
      visitReason,
      status: preview?.status || "",
      recommendedDoctorId,
      recommendedDoctorName: preview?.recommendedDoctorName || "",
      doctorReason: preview?.doctorRecommendationReason || "",
    },
    success: {
      patientInfoExtracted: Boolean(
        extractedPatient.name ||
          extractedPatient.phone ||
          extractedPatient.phoneLast4 ||
          extractedPatient.birth,
      ),
      patientRecommended: recommendedPatientId != null,
      patientIdentified,
      symptomInfoExtracted: symptoms.length > 0,
      appointmentIntentDetected: Boolean(preview?.needReservation),
      appointmentDateTimeResolved: Boolean(appointmentDate),
      doctorSelected: recommendedDoctorId != null,
      visitReasonExtracted: Boolean(visitReason),
      appointmentRegistrationReady: Boolean(
        preview?.needReservation &&
          appointmentDate &&
          recommendedDoctorId != null &&
          recommendedPatientId != null,
      ),
    },
    registration: {
      attempted: false,
      consultationCreated: false,
      appointmentCreated: false,
      consultationId: null,
      appointmentId: null,
      error: "성능평가 모드에서는 실제 상담·예약을 DB에 저장하지 않습니다.",
    },
    processing: {
      whisperMs: Number(preview?.whisperProcessingMs) || 0,
      llmMs: Number(preview?.llmProcessingMs) || 0,
      totalMs: Number(preview?.totalProcessingMs) || Number(clientProcessingMs) || 0,
      clientMs: Number(clientProcessingMs) || 0,
    },
    json: {
      success: requestError ? false : preview?.jsonSuccess !== false,
      error: requestError || preview?.jsonError || "",
      raw: preview?.rawAiResponse || "",
    },
  };
}

function percentage(numerator, denominator) {
  return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : "데이터 없음";
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value) && value > 0);
  return validValues.length
    ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
    : null;
}

function successRate(runs, predicate) {
  return percentage(runs.filter(predicate).length, runs.length);
}

export function calculateEvaluationSummary(runs) {
  const patientComparedRuns = runs.filter(
    (run) =>
      run.expectedPatient != null &&
      (run.success?.patientIdentified === true ||
        run.success?.patientIdentified === false),
  );
  const patientSuccesses = patientComparedRuns.filter(
    (run) => run.success?.patientIdentified,
  ).length;
  const models = EVALUATION_MODELS.map((model) => {
    const modelRuns = runs.filter((run) => run.model === model.id);
    const averageProcessingMs = average(
      modelRuns.map((run) => Number(run.processing?.totalMs)),
    );

    return {
      ...model,
      count: modelRuns.length,
      patientRecommendationRate: successRate(
        modelRuns,
        (run) =>
          run.success?.patientRecommended ??
          run.patientRecommendation?.id != null,
      ),
      patientInfoExtractionRate: successRate(
        modelRuns,
        (run) => run.success?.patientInfoExtracted,
      ),
      symptomExtractionRate: successRate(
        modelRuns,
        (run) => run.success?.symptomInfoExtracted,
      ),
      appointmentIntentRate: successRate(
        modelRuns,
        (run) => run.success?.appointmentIntentDetected,
      ),
      appointmentDateTimeRate: successRate(
        modelRuns,
        (run) => run.success?.appointmentDateTimeResolved,
      ),
      doctorSelectionRate: successRate(
        modelRuns,
        (run) => run.success?.doctorSelected,
      ),
      visitReasonRate: successRate(
        modelRuns,
        (run) => run.success?.visitReasonExtracted,
      ),
      appointmentRegistrationReadyRate: successRate(
        modelRuns,
        (run) =>
          run.success?.appointmentRegistrationReady ??
          Boolean(
            run.reservation?.predicted &&
              run.reservation?.appointmentDate &&
              run.reservation?.recommendedDoctorId != null &&
              run.patientRecommendation?.id != null,
          ),
      ),
      averageProcessingTime:
        averageProcessingMs == null
          ? "데이터 없음"
          : `${(averageProcessingMs / 1000).toFixed(2)}초`,
      jsonSuccessRate: successRate(modelRuns, (run) => run.json?.success),
    };
  });

  return {
    patientIdentificationRate: percentage(
      patientSuccesses,
      patientComparedRuns.length,
    ),
    patientSuccesses,
    patientRatedCount: patientComparedRuns.length,
    models,
  };
}

function value(valueToFormat) {
  if (Array.isArray(valueToFormat)) {
    return valueToFormat.length ? valueToFormat.join(", ") : "없음";
  }
  if (valueToFormat === true) return "True";
  if (valueToFormat === false) return "False";
  return valueToFormat === null || valueToFormat === undefined || valueToFormat === ""
    ? "없음"
    : String(valueToFormat);
}

function comparisonValue(valueToFormat) {
  if (valueToFormat === true) return "True";
  if (valueToFormat === false) return "False";
  return "비교 안 함";
}

function patientText(patient) {
  if (!patient) return "미지정";
  return `${value(patient.name)} / ${value(patient.phone)} / ${value(patient.birth)} / ID ${value(patient.id)}`;
}

export function buildEvaluationReport(runs) {
  const summary = calculateEvaluationSummary(runs);
  const lines = [
    "# 로컬 LLM 상담 분석 성능평가 원자료",
    `내보낸 시각: ${new Date().toLocaleString("ko-KR")}`,
    `전체 실행 수: ${runs.length} / 목표 63회`,
    "조건: Whisper 미사용, 정확도 92% 수준의 사전 제작 대본을 간호사 메모에 입력",
    "※ 아래 True/False는 정확도 판정이 아니라 AI 반환값에서 필드 추출·변환·추천 결과가 존재하는지를 나타냅니다.",
    "※ 성능평가 중에는 상담과 예약을 실제 DB에 저장하지 않습니다.",
    "",
    "## 선택 환자와 시스템 추천 비교 (환자를 선택한 실행만)",
    `ID 일치 비율: ${summary.patientIdentificationRate} (${summary.patientSuccesses}/${summary.patientRatedCount})`,
    "",
    "## 모델별 수집 현황",
    "모델\t실행 수\t환자 추천 생성\t환자정보 추출\t증상 추출\t예약 의도 검출\t예약일시 변환\t의사 추천 생성\t방문사유 추출\t예약 등록 준비값 완성\t평균 처리시간\tJSON 성공",
  ];

  summary.models.forEach((model) => {
    lines.push(
      `${model.label}\t${model.count}/21\t${model.patientRecommendationRate}\t${model.patientInfoExtractionRate}\t${model.symptomExtractionRate}\t${model.appointmentIntentRate}\t${model.appointmentDateTimeRate}\t${model.doctorSelectionRate}\t${model.visitReasonRate}\t${model.appointmentRegistrationReadyRate}\t${model.averageProcessingTime}\t${model.jsonSuccessRate}`,
    );
  });

  EVALUATION_MODELS.forEach((model) => {
    const modelRuns = runs
      .filter((run) => run.model === model.id)
      .sort((a, b) => Number(a.caseNumber) - Number(b.caseNumber));
    lines.push("", `## ${model.label} 원자료 (${modelRuns.length}/21)`);

    if (!modelRuns.length) {
      lines.push("기록 없음");
      return;
    }

    modelRuns.forEach((run) => {
      lines.push(
        "",
        `### 대본 ${String(run.caseNumber).padStart(2, "0")}`,
        `[입력 대본]\n${value(run.inputText)}`,
        "",
        "[AI 추출 환자 정보]",
        `이름: ${value(run.extractedPatient?.name)}`,
        `전화번호: ${value(run.extractedPatient?.phone)}`,
        `전화번호 뒤 4자리: ${value(run.extractedPatient?.phoneLast4)}`,
        `생년월일: ${value(run.extractedPatient?.birth)}`,
        `환자 정보를 추출했나?: ${value(run.success?.patientInfoExtracted)}`,
        `비교용 선택 환자: ${run.expectedPatient ? patientText(run.expectedPatient) : "선택 안 함"}`,
        "",
        "[시스템 추천 환자]",
        `${value(run.patientRecommendation?.name)} (ID: ${value(run.patientRecommendation?.id)}) / 근거: ${value(run.patientRecommendation?.reason)}`,
        `시스템이 환자를 추천했나?: ${value(run.success?.patientRecommended ?? run.patientRecommendation?.id != null)}`,
        `선택 환자와 추천 환자 ID가 일치하나?: ${comparisonValue(run.expectedPatient ? run.success?.patientIdentified : null)}`,
        "",
        "[예약 처리]",
        `예약 의도: ${value(run.reservation?.predicted)}`,
        `추출 날짜: ${value(run.reservation?.dateText)}`,
        `추출 시간: ${value(run.reservation?.timeText)}`,
        `변환된 예약 일시: ${value(run.reservation?.appointmentDate)}`,
        `예약 일시를 등록 가능한 값으로 변환했나?: ${value(run.success?.appointmentDateTimeResolved)}`,
        `추천 의사: ${value(run.reservation?.recommendedDoctorName)} (ID: ${value(run.reservation?.recommendedDoctorId)})`,
        `추천 근거: ${value(run.reservation?.doctorReason)}`,
        `추천 의사가 생성됐나?: ${value(run.success?.doctorSelected)}`,
        `방문 사유: ${value(run.reservation?.visitReason)}`,
        `방문 사유를 추출했나?: ${value(run.success?.visitReasonExtracted)}`,
        `예약 등록에 필요한 값이 모두 추출됐나?: ${value(run.success?.appointmentRegistrationReady ?? Boolean(run.reservation?.predicted && run.reservation?.appointmentDate && run.reservation?.recommendedDoctorId != null && run.patientRecommendation?.id != null))}`,
        "실제 상담·예약 DB 반영: 미실행(성능평가 모드)",
        "",
        "[상담 요약]",
        value(run.summary),
        `주요 증상: ${value(run.symptoms)}`,
        `증상 정보를 추출했나?: ${value(run.success?.symptomInfoExtracted)}`,
        `위험도: ${value(run.riskLevel)}`,
        `키워드: ${value(run.keywords)}`,
        "",
        "[성능]",
        `모델: ${value(run.modelLabel)} (${value(run.model)})`,
        `LLM: ${((run.processing?.llmMs || 0) / 1000).toFixed(2)}초`,
        `전체: ${((run.processing?.totalMs || 0) / 1000).toFixed(2)}초`,
        `클라이언트 기준 전체: ${((run.processing?.clientMs || 0) / 1000).toFixed(2)}초`,
        `JSON 성공: ${value(run.json?.success)}`,
        `JSON 오류: ${value(run.json?.error)}`,
        "",
        "[정제 전 AI JSON]",
        value(run.json?.raw),
        "",
        "------------------------------------------------------------",
      );
    });
  });

  return lines.join("\n");
}
