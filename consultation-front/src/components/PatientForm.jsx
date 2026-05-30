function PatientForm({
  name,
  phone,
  birth,
  setName,
  setPhone,
  setBirth,
  addPatient
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 border-b border-slate-200 pb-3 text-lg font-bold text-slate-900">
        환자 등록
      </h2>

      <div className="grid grid-cols-[1fr_1fr_150px_auto] gap-3">
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          type="text"
          placeholder="전화번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <input
          type="date"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          onClick={addPatient}
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          등록
        </button>
      </div>
    </section>
  )
}

export default PatientForm
