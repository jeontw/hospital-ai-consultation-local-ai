function Dashboard({
  totalPatients,
  totalConsultations,
  warningConsultations,
  recentConsultations
}) {
  return (
    <div className="mb-6 grid grid-cols-4 gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">전체 환자 수</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {totalPatients}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">전체 상담 수</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {totalConsultations}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">주의 상담 수</p>
        <p className="mt-2 text-3xl font-bold text-amber-600">
          {warningConsultations}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-slate-500">최근 7일 상담</p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {recentConsultations}
        </p>
      </div>
    </div>
  )
}

export default Dashboard
