function AppointmentList({
  selectedPatient,
  appointments,
  onUpdateStatus,
  onDeleteAppointment,
}) {
  const sortedAppointments = [...appointments].sort(
    (a, b) =>
      new Date(a.appointmentDate || a.appointmentDateTime || 0) -
      new Date(b.appointmentDate || b.appointmentDateTime || 0),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">예약 목록</h2>

      {!selectedPatient ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          환자를 선택하면 예약 목록을 확인할 수 있습니다.
        </p>
      ) : sortedAppointments.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          등록된 예약이 없습니다.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid h-9 grid-cols-[180px_90px_1fr_190px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
            <span>예약일시</span>
            <span>상태</span>
            <span>방문 사유</span>
            <span className="text-right">관리</span>
          </div>

          <div className="divide-y divide-slate-200">
            {sortedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="grid min-h-12 grid-cols-[180px_90px_1fr_190px] items-center gap-2 px-3 py-2 text-base"
              >
                <p className="text-slate-900">
                  {new Date(
                    appointment.appointmentDate ||
                      appointment.appointmentDateTime,
                  ).toLocaleString()}
                </p>
                <p className="font-semibold text-slate-700">
                  {appointment.status || "예약됨"}
                </p>
                <p className="truncate text-slate-600">
                  {appointment.memo || "방문 사유 없음"}
                </p>
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onUpdateStatus(appointment.id, "완료")}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                  >
                    완료
                  </button>
                  <button
                    onClick={() => onUpdateStatus(appointment.id, "취소")}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => onDeleteAppointment(appointment.id)}
                    className="h-8 rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default AppointmentList;
