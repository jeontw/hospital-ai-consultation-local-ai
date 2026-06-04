export function getAppointmentDateTime(appointment) {
  return appointment?.appointmentDate || appointment?.appointmentDateTime || "";
}

export function isPastReservedAppointment(appointment, now = new Date()) {
  const status = appointment?.status || "예약됨";
  const appointmentDateTime = getAppointmentDateTime(appointment);

  if (status !== "예약됨" || !appointmentDateTime) {
    return false;
  }

  const appointmentDate = new Date(appointmentDateTime);

  if (Number.isNaN(appointmentDate.getTime())) {
    return false;
  }

  return appointmentDate < now;
}

export function getAppointmentStatusLabel(appointment, now = new Date()) {
  if (isPastReservedAppointment(appointment, now)) {
    return "지난 예약";
  }

  return appointment?.status || "예약됨";
}
