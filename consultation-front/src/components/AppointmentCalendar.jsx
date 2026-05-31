import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

function AppointmentCalendar({ appointments }) {
  const getDoctorName = (doctor) => {
    if (!doctor?.name) {
      return "미지정";
    }

    return doctor.name.replace(/\s*원장$/, "");
  };

  const getStatusClassName = (status) => {
    if (status === "완료") {
      return "appointment-completed";
    }

    if (status === "취소") {
      return "appointment-canceled";
    }

    return "appointment-reserved";
  };

  const events = appointments
    .filter((appointment) => appointment.appointmentDate || appointment.appointmentDateTime)
    .map((appointment) => ({
      id: String(appointment.id),
      title: `[${getDoctorName(appointment.doctor)}] ${
        appointment.memo ||
        appointment.purpose ||
        appointment.patient?.name ||
        "예약"
      }`,
      date: appointment.appointmentDate || appointment.appointmentDateTime,
      className: getStatusClassName(appointment.status),
    }));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold text-slate-900">예약 달력</h2>
      <div className="appointment-calendar text-base">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          events={events}
          eventDisplay="block"
          dayMaxEvents={3}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
          }}
        />
      </div>
    </section>
  );
}

export default AppointmentCalendar;
