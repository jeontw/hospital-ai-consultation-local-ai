import { useState } from "react";

function DoctorManagement({
  doctors = [],
  onCreateDoctor,
  onUpdateDoctor,
  onDeleteDoctor,
  embedded = false,
}) {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");

  const resetForm = () => {
    setName("");
    setSpecialty("");
  };

  const startEdit = (doctor) => {
    setEditingId(doctor.id);
    setEditName(doctor.name || "");
    setEditSpecialty(doctor.specialty || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSpecialty("");
  };

  const submitCreate = async (event) => {
    event.preventDefault();

    const saved = await onCreateDoctor({
      name,
      specialty,
      active: true,
    });

    if (saved) {
      resetForm();
    }
  };

  const submitUpdate = async (doctor) => {
    const saved = await onUpdateDoctor(doctor.id, {
      name: editName,
      specialty: editSpecialty,
      active: doctor.active !== false,
    });

    if (saved) {
      cancelEdit();
    }
  };

  const activateDoctor = async (doctor) => {
    await onUpdateDoctor(doctor.id, {
      name: doctor.name,
      specialty: doctor.specialty,
      active: true,
    });
  };

  const Wrapper = embedded ? "div" : "section";
  const wrapperClassName = embedded
    ? ""
    : "rounded-lg border border-slate-200 bg-white p-4 shadow-sm";

  return (
    <Wrapper className={wrapperClassName}>
      <h2 className="mb-3 text-lg font-bold text-slate-900">의사 관리</h2>

      <form onSubmit={submitCreate} className="mb-4 grid grid-cols-[1fr_1fr_auto] gap-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-base"
          placeholder="의사명"
          required
        />
        <input
          type="text"
          value={specialty}
          onChange={(event) => setSpecialty(event.target.value)}
          className="h-10 rounded-md border border-slate-300 px-3 text-base"
          placeholder="진료과"
          required
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-slate-800 px-4 text-base font-semibold text-white hover:bg-slate-700"
        >
          등록
        </button>
      </form>

      {doctors.length === 0 ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-base text-slate-500">
          등록된 의사가 없습니다.
        </p>
      ) : (
        <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`grid min-h-12 grid-cols-[1fr_1fr_150px] items-center gap-2 px-3 py-2 text-base ${
                doctor.active === false ? "bg-slate-50 text-slate-400" : ""
              }`}
            >
              {editingId === doctor.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="h-9 rounded-md border border-slate-300 px-2 text-base text-slate-900"
                  />
                  <input
                    type="text"
                    value={editSpecialty}
                    onChange={(event) => setEditSpecialty(event.target.value)}
                    className="h-9 rounded-md border border-slate-300 px-2 text-base text-slate-900"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => submitUpdate(doctor)}
                      className="h-8 rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      취소
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">
                    {doctor.name}
                    {doctor.active === false && (
                      <span className="ml-2 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        비활성
                      </span>
                    )}
                  </p>
                  <p className="text-slate-600">{doctor.specialty}</p>
                  <div className="flex justify-end gap-1.5">
                    {doctor.active === false && (
                      <button
                        type="button"
                        onClick={() => activateDoctor(doctor)}
                        className="h-8 rounded-md bg-emerald-600 px-2.5 text-sm font-medium text-white"
                      >
                        활성화
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(doctor)}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDoctor(doctor.id)}
                      className="h-8 rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Wrapper>
  );
}

export default DoctorManagement;
