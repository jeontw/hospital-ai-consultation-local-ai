import { useState } from "react";

function PatientList({
  patients,
  selectedViewPatientId,
  selectedPatientId,
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
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">환자 목록</h2>

        <button
          onClick={() => onSelectPatient("")}
          className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          전체
        </button>
      </div>

      <input
        type="text"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        className="mb-2 h-9 w-full rounded-md border border-slate-300 px-3 text-base"
        placeholder="이름, 전화번호, 생년월일 검색"
      />

      {filteredPatients.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-base text-slate-500">
          검색 결과가 없습니다.
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-slate-200">
        <div className="grid h-8 grid-cols-[1fr_124px] items-center border-b border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
          <span>환자 정보</span>
          <span className="text-right">관리</span>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`grid min-h-11 cursor-pointer grid-cols-[1fr_124px] items-center gap-2 px-3 py-1.5 hover:bg-slate-50 ${
                String(selectedViewPatientId) === String(patient.id)
                  ? "bg-slate-100 ring-1 ring-inset ring-slate-300"
                  : ""
              }`}
            >
              {editingPatientId === patient.id ? (
                <>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="grid grid-cols-[1fr_1fr_130px] gap-2"
                  >
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 rounded-md border border-slate-300 px-2 text-base"
                      placeholder="이름"
                    />
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="h-8 rounded-md border border-slate-300 px-2 text-base"
                      placeholder="전화번호"
                    />
                    <input
                      value={editBirth}
                      onChange={(e) => setEditBirth(e.target.value)}
                      className="h-8 rounded-md border border-slate-300 px-2 text-base"
                      placeholder="생년월일"
                    />
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="flex justify-end gap-1.5">
                    <button
                      onClick={() => saveEdit(patient.id)}
                      className="h-7 rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                    >
                      저장
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="h-7 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      취소
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0 text-base">
                    <span className="font-semibold text-slate-900">{patient.name}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-600">{patient.phone}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">{patient.birth || "없음"}</span>
                    {String(selectedPatientId) === String(patient.id) && (
                      <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-sm font-semibold text-slate-700">
                        상담 대상
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(patient);
                      }}
                      className="h-7 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      수정
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePatient(patient.id);
                      }}
                      className="h-7 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PatientList;
