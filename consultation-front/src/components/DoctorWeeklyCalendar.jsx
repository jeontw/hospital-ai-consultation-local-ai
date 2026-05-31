import { useMemo } from "react";

const OPEN_TIME = 9;
const CLOSE_TIME = 18;
const SLOT_MINUTES = 30;
const LUNCH_START = "12:00";
const LUNCH_END = "13:00";
const WEEKDAYS = ["월", "화", "수", "목", "금"];

function toDateInputValue(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatDateInput(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function getWeekStart(value) {
  const date = new Date(`${toDateInputValue(value)}T00:00:00`);
  const day = date.getDay();
  const distanceFromMonday = day === 0 ? -6 : 1 - day;

  return addDays(date, distanceFromMonday);
}

function getWeekDays(selectedWeek) {
  const monday = getWeekStart(selectedWeek);

  return WEEKDAYS.map((label, index) => {
    const date = addDays(monday, index);

    return {
      label,
      date: formatDateInput(date),
    };
  });
}

function getWeekRangeLabel(weekDays) {
  if (weekDays.length === 0) {
    return "";
  }

  return `${weekDays[0].date} ~ ${weekDays[weekDays.length - 1].date}`;
}

function toDateTimeMinute(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(" ", "T").slice(0, 16);
}

function getAppointmentDoctorId(appointment) {
  return appointment.doctor?.id ?? appointment.doctorId ?? "";
}

function getStatusLabel(status) {
  return status || "예약됨";
}

function isCanceled(appointment) {
  return getStatusLabel(appointment.status) === "취소";
}

function isCompleted(appointment) {
  return getStatusLabel(appointment.status) === "완료";
}

function createTimeSlots() {
  const slots = [];
  const start = OPEN_TIME * 60;
  const end = CLOSE_TIME * 60;

  for (let minutes = start; minutes < end; minutes += SLOT_MINUTES) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    const minute = String(minutes % 60).padStart(2, "0");
    const time = `${hour}:${minute}`;

    slots.push({
      time,
      isLunch: time >= LUNCH_START && time < LUNCH_END,
    });
  }

  return slots;
}

function DoctorWeeklyCalendar({
  doctors = [],
  appointments = [],
  selectedWeek,
  selectedDoctorId,
  onChangeWeek,
  onChangeDoctor,
  onSelectSlot,
}) {
  const activeDoctorId = selectedDoctorId || "";
  const selectedDoctor = doctors.find(
    (doctor) => String(doctor.id) === String(activeDoctorId),
  );
  const weekDays = useMemo(() => getWeekDays(selectedWeek), [selectedWeek]);
  const timeSlots = useMemo(() => createTimeSlots(), []);

  const appointmentsBySlot = useMemo(() => {
    const weekDateSet = new Set(weekDays.map((day) => day.date));

    return appointments.reduce((map, appointment) => {
      if (isCanceled(appointment)) {
        return map;
      }

      const appointmentDateTime = toDateTimeMinute(
        appointment.appointmentDate || appointment.appointmentDateTime,
      );
      const date = appointmentDateTime.slice(0, 10);
      const time = appointmentDateTime.slice(11, 16);
      const doctorId = getAppointmentDoctorId(appointment);

      if (
        !weekDateSet.has(date) ||
        String(doctorId) !== String(activeDoctorId)
      ) {
        return map;
      }

      map.set(`${date}|${time}`, appointment);
      return map;
    }, new Map());
  }, [activeDoctorId, appointments, weekDays]);

  const moveWeek = (days) => {
    const currentMonday = getWeekStart(selectedWeek);
    onChangeWeek?.(formatDateInput(addDays(currentMonday, days)));
  };

  const handleSelectSlot = (date, time) => {
    if (!activeDoctorId) {
      return;
    }

    onSelectSlot?.({
      doctorId: activeDoctorId,
      date,
      time,
      appointmentDate: `${date}T${time}`,
      status: "예약됨",
    });
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            의사별 주간 예약표
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            선택한 의사의 주중 예약 현황을 확인하고 빈 시간을 예약 폼에 반영합니다.
          </p>
        </div>

        <label className="block min-w-60">
          <span className="mb-1 block text-sm font-semibold text-slate-600">
            담당 의사 선택
          </span>
          <select
            value={activeDoctorId}
            onChange={(event) => onChangeDoctor?.(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-base"
          >
            <option value="">담당 의사 선택</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} ({doctor.specialty})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => moveWeek(-7)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          이전 주
        </button>

        <label className="block">
          <span className="sr-only">기준 주 선택</span>
          <input
            type="date"
            value={toDateInputValue(selectedWeek)}
            onChange={(event) => onChangeWeek?.(event.target.value)}
            className="h-10 rounded-md border border-slate-300 px-3 text-base"
          />
        </label>

        <p className="rounded-md bg-slate-100 px-3 py-2 text-base font-semibold text-slate-700">
          {getWeekRangeLabel(weekDays)}
        </p>

        <button
          type="button"
          onClick={() => moveWeek(7)}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          다음 주
        </button>
      </div>

      {!selectedDoctor ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          주간 예약표를 보려면 담당 의사를 선택하세요.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-lg font-bold text-slate-900">
              {selectedDoctor.name}
              {selectedDoctor.specialty ? ` (${selectedDoctor.specialty})` : ""}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-base">
              <thead className="bg-white text-sm font-semibold text-slate-600">
                <tr>
                  <th className="sticky left-0 z-10 w-24 border-b border-r border-slate-200 bg-white px-3 py-3">
                    시간
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.date}
                      className="min-w-40 border-b border-slate-200 px-3 py-3"
                    >
                      <span className="block text-slate-900">{day.label}</span>
                      <span className="mt-0.5 block text-xs font-medium text-slate-500">
                        {day.date}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot.time} className="border-b border-slate-100">
                    <th className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 font-semibold text-slate-700">
                      {slot.time}
                    </th>
                    {weekDays.map((day) => {
                      const appointment = appointmentsBySlot.get(
                        `${day.date}|${slot.time}`,
                      );

                      if (slot.isLunch) {
                        return (
                          <td
                            key={day.date}
                            className="bg-slate-100 px-3 py-3 text-slate-500"
                          >
                            점심시간
                          </td>
                        );
                      }

                      if (appointment) {
                        return (
                          <td
                            key={day.date}
                            className={`px-3 py-3 align-top ${
                              isCompleted(appointment)
                                ? "bg-emerald-50"
                                : "bg-blue-50"
                            }`}
                          >
                            <p className="font-bold text-slate-900">
                              {appointment.patient?.name || "환자명 없음"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                              {appointment.memo ||
                                appointment.purpose ||
                                "방문 사유 없음"}
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
                                isCompleted(appointment)
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {getStatusLabel(appointment.status)}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={day.date} className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleSelectSlot(day.date, slot.time)}
                            className="min-h-20 w-full rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-left font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          >
                            예약 가능
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default DoctorWeeklyCalendar;
