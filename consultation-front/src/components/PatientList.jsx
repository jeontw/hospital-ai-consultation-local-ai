import { useState } from "react";

function PatientList({
  patients,
  selectedViewPatientId,
  selectedPatientId,
  selectedPatient,
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
  const matchedPatients = normalizedSearchKeyword
    ? patients.filter((patient) =>
        [patient.name, patient.phone, patient.birth]
          .map((value) => String(value || "").toLowerCase())
          .some((value) => value.includes(normalizedSearchKeyword)),
      )
    : [];
  const displayedPatients = matchedPatients.slice(0, 30);
  const hasMoreResults = matchedPatients.length > displayedPatients.length;

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

  const renderPatientRow = (patient) => (
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
            <div className="font-semibold text-slate-900">{patient.name}</div>
            <div className="text-slate-600">{patient.phone}</div>
            <div className="text-slate-500">{patient.birth || "없음"}</div>
            {String(selectedPatientId) === String(patient.id) && (
              <span className="mt-1 inline-flex rounded bg-slate-200 px-1.5 py-0.5 text-sm font-semibold text-slate-700">
                선택됨
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
  );

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">환자 목록</h2>

        <button
          onClick={() => onSelectPatient("")}
          className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          전체
        </button>
      </div>

      <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-semibold text-slate-600">선택된 환자</p>
        {selectedPatient ? (
          <p className="mt-1 text-base font-semibold text-slate-900">
            {selectedPatient.name} | {selectedPatient.phone} | {selectedPatient.birth || "없음"}
          </p>
        ) : (
          <p className="mt-1 text-base text-slate-500">
            아직 선택된 환자가 없습니다.
          </p>
        )}
      </div>

      <div className="mb-2 flex flex-col gap-2">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 px-3 text-base"
          placeholder="환자 이름, 전화번호, 생년월일로 검색하세요."
        />
        <p className="text-sm text-slate-500">
          검색어를 입력하면 환자 목록이 표시됩니다.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-md border border-slate-200">
        <div className="grid h-8 grid-cols-[1fr_124px] items-center border-b border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
          <span>환자 정보</span>
          <span className="text-right">관리</span>
        </div>

        {normalizedSearchKeyword ? (
          <div className="flex flex-1 min-h-0 flex-col">
            {hasMoreResults && (
              <p className="border-b border-slate-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                검색 결과가 많습니다. 전화번호나 생년월일을 추가로 입력하세요.
              </p>
            )}

            <div className="flex-1 min-h-0 divide-y divide-slate-200 overflow-y-auto">
              {displayedPatients.length === 0 ? (
                <p className="p-3 text-base text-slate-500">검색 결과가 없습니다.</p>
              ) : (
                displayedPatients.map(renderPatientRow)
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 text-base text-slate-500">
            환자 이름, 전화번호, 생년월일로 검색하세요.
          </div>
        )}
      </div>
    </section>
  );
}

export default PatientList;
