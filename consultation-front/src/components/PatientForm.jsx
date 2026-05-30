function PatientForm({
  name,
  phone,
  birth,
  setName,
  setPhone,
  setBirth,
  addPatient,
}) {
  const onlyDigits = (value) => value.replace(/\D/g, "");

  const formatPhone = (value) => {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const formatBirth = (value) => {
    const digits = onlyDigits(value).slice(0, 8);

    if (digits.length <= 4) {
      return digits;
    }

    if (digits.length <= 6) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  };

  const canSubmitWithEnter =
    name.trim() &&
    onlyDigits(phone).length === 11 &&
    onlyDigits(birth).length === 8;

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || !canSubmitWithEnter) {
      return;
    }

    event.preventDefault();
    addPatient();
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">환자 등록</h2>
      </div>

      <div className="grid grid-cols-[1fr_1fr_150px_78px] gap-2">
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border border-slate-300 px-3 text-base"
        />

        <input
          type="text"
          placeholder="010-2222-2222"
          value={phone}
          inputMode="numeric"
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-md border border-slate-300 px-3 text-base"
        />

        <input
          type="text"
          placeholder="yyyy-MM-dd"
          value={birth}
          inputMode="numeric"
          onChange={(e) => setBirth(formatBirth(e.target.value))}
          onKeyDown={handleKeyDown}
          className="h-9 rounded-md border border-slate-300 px-3 text-base"
        />

        <button
          type="button"
          onClick={addPatient}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Spacebar") {
              e.preventDefault();
            }
          }}
          className="h-9 rounded-md bg-slate-800 px-3 text-base font-semibold text-white hover:bg-slate-700"
        >
          등록
        </button>
      </div>
    </section>
  );
}

export default PatientForm;
