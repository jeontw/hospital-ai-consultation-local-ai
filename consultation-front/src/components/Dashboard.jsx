function Dashboard({
  totalPatients,
  totalConsultations,
  warningConsultations,
  recentConsultations,
}) {
  const stats = [
    { label: "환자", value: totalPatients, valueClassName: "text-slate-900" },
    { label: "상담", value: totalConsultations, valueClassName: "text-slate-900" },
    { label: "주의", value: warningConsultations, valueClassName: "text-amber-600" },
    { label: "최근7일", value: recentConsultations, valueClassName: "text-slate-900" },
  ];

  return (
    <div className="mb-3 grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex h-[58px] items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
          <p className={`text-3xl font-bold leading-none ${stat.valueClassName}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
