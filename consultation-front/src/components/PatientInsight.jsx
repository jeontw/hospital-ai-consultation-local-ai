import ConsultationList from "./ConsultationList";
import AppointmentList from "./AppointmentList";

function getConsultationText(consultation) {
  return (
    consultation?.summary ||
    consultation?.originalText ||
    consultation?.nurseMemo ||
    "상담 내용 없음"
  );
}

function splitTerms(value) {
  return String(value || "")
    .split(/[,，\n]/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function getTopTerms(values, limit = 5) {
  const termCounts = values
    .flatMap(splitTerms)
    .reduce((counts, term) => {
      counts.set(term, (counts.get(term) || 0) + 1);
      return counts;
    }, new Map());

  return [...termCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

const RISK_FACTOR_PATTERNS = [
  "고혈압",
  "혈압",
  "당뇨",
  "혈당",
  "심장",
  "심근경색",
  "협심증",
  "흉통",
  "가슴 통증",
  "뇌졸중",
  "중풍",
  "호흡곤란",
  "숨참",
  "천식",
  "폐렴",
  "간질환",
  "신장",
  "신부전",
  "암",
  "수술",
  "알레르기",
  "임신",
  "흡연",
  "음주",
  "항응고제",
  "와파린",
  "아스피린",
];

function getRiskFactors(consultations) {
  const found = new Map();

  consultations.forEach((consultation) => {
    const text = [
      consultation.summary,
      consultation.originalText,
      consultation.nurseMemo,
      consultation.aiAnalysis?.symptoms,
      consultation.aiAnalysis?.keywords,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    RISK_FACTOR_PATTERNS.forEach((pattern) => {
      if (text.includes(pattern.toLowerCase())) {
        found.set(pattern, (found.get(pattern) || 0) + 1);
      }
    });
  });

  return [...found.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function PatientInsight({
  selectedPatient,
  consultations,
  appointments = [],
  getRiskColor,
  editingId,
  editText,
  setEditText,
  setEditingId,
  updateConsultation,
  deleteConsultation,
  onSelectConsultation,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
}) {
  if (!selectedPatient) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">
          환자 인사이트
        </h2>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-base font-semibold text-slate-700">
            환자를 선택하면 개인화 요약이 표시됩니다.
          </p>
          <div className="mt-3 grid gap-2 text-sm text-slate-500">
            <p>최근 상담과 다음 예약을 한 번에 확인합니다.</p>
            <p>반복 증상, 위험 인자, 위험 이력을 요약합니다.</p>
            <p>전체 상담 목록과 예약 기록 관리는 선택 후 사용할 수 있습니다.</p>
          </div>
        </div>
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
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(b.appointmentDate || b.appointmentDateTime || 0) -
      new Date(a.appointmentDate || a.appointmentDateTime || 0),
  );
  const upcomingAppointments = sortedAppointments
    .filter((appointment) => {
      const appointmentDate = new Date(
        appointment.appointmentDate || appointment.appointmentDateTime || 0,
      );

      return appointment.status !== "취소" && appointmentDate >= new Date();
    })
    .sort(
      (a, b) =>
        new Date(a.appointmentDate || a.appointmentDateTime || 0) -
        new Date(b.appointmentDate || b.appointmentDateTime || 0),
    );
  const nextAppointment = upcomingAppointments[0];

  const topSymptoms = getTopTerms(
    patientConsultations.map((consultation) => consultation.aiAnalysis?.symptoms),
  );
  const riskFactors = getRiskFactors(patientConsultations);

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

  const getDoctorLabel = (doctor) => {
    if (!doctor?.name) {
      return "미지정";
    }

    return doctor.specialty
      ? `${doctor.name} (${doctor.specialty})`
      : doctor.name;
  };

  const primaryDoctor =
    nextAppointment?.doctor ||
    sortedAppointments.find((appointment) => appointment.doctor?.id)?.doctor ||
    null;
  const latestRiskLevel = recentConsultation?.aiAnalysis?.riskLevel || "분석 없음";
  const hasRiskHistory = highRiskCount > 0 || mediumRiskCount > 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">환자 인사이트</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            {selectedPatient.name} | {selectedPatient.phone} | 생년월일:{" "}
            {selectedPatient.birth || "없음"}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-700">
            담당 의사: {getDoctorLabel(primaryDoctor)}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
            상담 {totalCount}건
          </span>
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">
            주의 {mediumRiskCount}건
          </span>
          <span className="rounded bg-red-50 px-2 py-1 text-red-700">
            위험 {highRiskCount}건
          </span>
        </div>
      </div>

      <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
        <p className="mb-2 text-base font-bold text-slate-900">
          이 환자 먼저 볼 것
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-slate-200 bg-white p-2.5">
            <p className="text-xs font-semibold text-slate-500">최근 상담</p>
            {recentConsultation ? (
              <>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-slate-500">
                    {new Date(recentConsultation.createdAt).toLocaleString()}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-bold ${getRiskColor(
                      latestRiskLevel,
                    )}`}
                  >
                    {latestRiskLevel}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700">
                  {getConsultationText(recentConsultation)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                상담 기록이 없습니다.
              </p>
            )}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-2.5">
            <p className="text-xs font-semibold text-slate-500">다음 예약</p>
            {nextAppointment ? (
              <>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {new Date(
                    nextAppointment.appointmentDate ||
                      nextAppointment.appointmentDateTime,
                  ).toLocaleString()}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                  {getDoctorLabel(nextAppointment.doctor)}
                  {nextAppointment.memo ? ` / ${nextAppointment.memo}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                예정된 예약이 없습니다.
              </p>
            )}
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          {hasRiskHistory
            ? `위험 이력: 주의 ${mediumRiskCount}건, 높은 위험 ${highRiskCount}건`
            : "위험 이력: 주의 또는 높은 위험 상담 기록 없음"}
        </p>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-slate-200 p-2.5">
          <p className="mb-1.5 text-base font-bold text-slate-900">반복 증상</p>
          {topSymptoms.length === 0 ? (
            <p className="text-sm text-slate-500">누적 증상 데이터 없음</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {topSymptoms.map(([symptom, count]) => (
                <span
                  key={symptom}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                >
                  {symptom}
                  {count > 1 ? ` ${count}회` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-slate-200 p-2.5">
          <p className="mb-1.5 text-base font-bold text-slate-900">
            위험 인자/과거력
          </p>
          {riskFactors.length === 0 ? (
            <p className="text-sm text-slate-500">확인된 위험 인자 없음</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {riskFactors.map(([factor, count]) => (
                <span
                  key={factor}
                  className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
                >
                  {factor}
                  {count > 1 ? ` ${count}회` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-2">
        <AppointmentList
          selectedPatient={selectedPatient}
          appointments={appointments}
          onUpdateStatus={onUpdateAppointmentStatus}
          onDeleteAppointment={onDeleteAppointment}
          compact
        />
      </div>

      <details className="rounded-md border border-slate-200 p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
          <span>전체 상담 목록 열기</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-600">
            {sortedConsultations.length}건
          </span>
        </summary>

        <div className="mt-3">
          <ConsultationList
            consultations={sortedConsultations}
            editingId={editingId}
            editText={editText}
            setEditText={setEditText}
            updateConsultation={updateConsultation}
            deleteConsultation={deleteConsultation}
            setEditingId={setEditingId}
            onSelectConsultation={onSelectConsultation}
            getRiskColor={getRiskColor}
          />
        </div>
      </details>

      <details className="mt-3 rounded-md border border-slate-200 p-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900">
          <span>병원 예약 기록 열기</span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-sm font-semibold text-slate-600">
            {sortedAppointments.length}건
          </span>
        </summary>

        <div className="mt-3">
          {sortedAppointments.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-3 text-base text-slate-500">
              예약 기록이 없습니다.
            </p>
          ) : (
            <div className="max-h-72 divide-y divide-slate-200 overflow-y-auto rounded-md border border-slate-200">
              {sortedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {new Date(
                        appointment.appointmentDate ||
                          appointment.appointmentDateTime,
                      ).toLocaleString()}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {getDoctorLabel(appointment.doctor)}
                      <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">
                        {appointment.status || "예약됨"}
                      </span>
                    </p>
                    <p className="mt-1 truncate text-slate-500">
                      {appointment.memo || "방문 사유 없음"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteAppointment?.(appointment.id)}
                    className="h-8 self-center rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

export default PatientInsight;
