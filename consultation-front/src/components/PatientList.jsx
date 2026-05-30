import { useState } from "react";

function PatientList({
  patients,
  selectedViewPatientId,
  onSelectPatient,
  deletePatient,
  updatePatient,
}) {
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();
  const filteredPatients = patients.filter((patient) => {
    if (!normalizedSearchKeyword) {
      return true;
    }

    return [patient.name, patient.phone, patient.birth]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value.includes(normalizedSearchKeyword));
  });

  const startEdit = (patient) => {
    setEditingPatientId(patient.id);
    setEditName(patient.name || "");
    setEditPhone(patient.phone || "");
    setEditBirth(patient.birth || "");
  };

  const cancelEdit = () => {
    setEditingPatientId(null);
    setEditName("");
    setEditPhone("");
    setEditBirth("");
  };

  const saveEdit = (patientId) => {
    updatePatient(patientId, {
      name: editName,
      phone: editPhone,
      birth: editBirth,
    });

    cancelEdit();
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold text-slate-900">환자 목록</h2>

        <button
          onClick={() => onSelectPatient("")}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          전체
        </button>
      </div>

      <input
        type="text"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        placeholder="이름, 전화번호, 생년월일 검색"
      />

      {filteredPatients.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          검색 결과가 없습니다.
        </p>
      )}

      <div className="divide-y divide-slate-200">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => onSelectPatient(patient.id)}
            className={`cursor-pointer px-3 py-4 hover:bg-slate-50 ${
              String(selectedViewPatientId) === String(patient.id)
                ? "bg-slate-100"
                : ""
            }`}
          >
            {editingPatientId === patient.id ? (
              <div onClick={(e) => e.stopPropagation()} className="space-y-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="이름"
                />

                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="전화번호"
                />

                <input
                  value={editBirth}
                  onChange={(e) => setEditBirth(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="생년월일"
                />

                <button
                  onClick={() => saveEdit(patient.id)}
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white"
                >
                  저장
                </button>

                <button
                  onClick={cancelEdit}
                  className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {patient.name}
                    </p>
                    <p className="text-sm text-slate-500">{patient.phone}</p>
                    <p className="text-sm text-slate-400">
                      생년월일: {patient.birth || "없음"}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(patient);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      수정
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePatient(patient.id);
                      }}
                      className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PatientList;
