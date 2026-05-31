import { useState } from "react";

function getAudioUrl(audioPath) {
  if (!audioPath) {
    return "";
  }

  if (audioPath.startsWith("http")) {
    return audioPath;
  }

  return `http://localhost:8080${audioPath.startsWith("/") ? audioPath : `/${audioPath}`}`;
}

function getConsultationText(consultation) {
  return (
    consultation.summary ||
    consultation.originalText ||
    consultation.nurseMemo ||
    "상담 내용 없음"
  );
}

function ConsultationList({
  consultations,
  editingId,
  editText,
  setEditText,
  updateConsultation,
  deleteConsultation,
  setEditingId,
  onSelectConsultation,
  getRiskColor,
}) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const filteredConsultations = [...consultations]
    .filter((consultation) => {
      const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();

      if (!normalizedSearchKeyword) {
        return true;
      }

      const consultationText = [
        consultation.patient?.name,
        consultation.summary,
        consultation.originalText,
        consultation.nurseMemo,
        consultation.aiAnalysis?.keywords,
        consultation.aiAnalysis?.symptoms,
      ]
        .filter(Boolean)
        .join(" ");

      return consultationText.toLowerCase().includes(normalizedSearchKeyword);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900">전체 상담 목록</h3>
        <input
          type="text"
          placeholder="상담 내용, 메모, 키워드 검색"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 px-3 text-base sm:w-80"
        />
      </div>

      {consultations.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-base text-slate-500">
          상담 기록이 없습니다.
        </p>
      )}

      {consultations.length > 0 && filteredConsultations.length === 0 && (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-base text-slate-500">
          검색 결과가 없습니다.
        </p>
      )}

      <div className="space-y-2">
        {filteredConsultations.map((consultation) => {
          const isEditing = editingId === consultation.id;
          const audioUrl = getAudioUrl(consultation.audioPath);
          const isPlayingAudio = playingAudioId === consultation.id;

          return (
            <div
              key={consultation.id}
              className="rounded-md border border-slate-200 bg-white p-3"
            >
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(event) => setEditText(event.target.value)}
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-base"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateConsultation(consultation.id)}
                      className="h-8 rounded-md bg-slate-800 px-3 text-sm font-medium text-white"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        {new Date(consultation.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900">
                        {getConsultationText(consultation)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-sm font-bold ${getRiskColor(
                        consultation.aiAnalysis?.riskLevel,
                      )}`}
                    >
                      {consultation.aiAnalysis?.riskLevel || "분석 없음"}
                    </span>
                  </div>

                  {isPlayingAudio && audioUrl && (
                    <audio
                      key={audioUrl}
                      controls
                      className="mb-2 w-full"
                      src={audioUrl}
                    />
                  )}

                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectConsultation(consultation)}
                      className="h-8 rounded-md bg-slate-800 px-2.5 text-sm font-medium text-white"
                    >
                      상세 보기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(consultation.id);
                        setEditText(consultation.originalText || "");
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConsultation(consultation.id)}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700"
                    >
                      삭제
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPlayingAudioId((current) =>
                          current === consultation.id ? null : consultation.id,
                        )
                      }
                      disabled={!audioUrl}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-medium text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      오디오 재생
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConsultationList;
