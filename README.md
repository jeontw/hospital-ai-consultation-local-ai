# AI 기반 병원 전화 상담 기록 관리 시스템

> 로컬 AI(Ollama + whisper.cpp) 기반 병원 전화 상담 분석 및 기록 관리 시스템  
> 음성 업로드부터 STT, AI 요약/분석, 환자 상담 히스토리 관리까지 자동화한 프로젝트입니다.

---

# 프로젝트 소개

병원 전화 상담은 환자의 증상, 예약 문의, 복약 상담 등 다양한 내용을 포함하지만  
대부분 수기 메모 또는 간단한 기록 형태로 관리되는 경우가 많습니다.

이 프로젝트는 전화 상담 음성을 AI가 자동으로 분석하고,  
환자별 상담 기록을 구조화하여 의료진 및 상담 인력의 업무를 보조하기 위해 개발되었습니다.

특히 OpenAI API 기반 구조에서 확장하여,  
외부 API 없이 로컬 환경에서 동작하는 완전 로컬 AI 파이프라인까지 구현하였습니다.

---

# 주요 기능

## 환자 관리

- 환자 등록
- 환자 목록 조회
- 환자 정보 수정
- 환자 삭제
- 환자별 상담 기록 조회

---

## 상담 관리

- 상담 음성 파일 업로드
- 상담 목록 조회
- 상담 상세 조회
- 상담 내용 수정
- 상담 삭제
- 상담 삭제 시 서버 음성 파일 자동 삭제

---

## 음성 처리

- m4a 업로드 지원
- FFmpeg 기반 mp3 변환
- whisper.cpp 기반 로컬 STT
- CUDA GPU 가속 지원
- 음성 파일 재생 기능

---

## AI 기능

- Ollama 기반 로컬 LLM 분석
- 상담 내용 자동 요약
- 주요 증상 분석
- 위험도 분석
- 키워드 추출
- 환자 과거 상담 기록 기반 AI 인사이트 생성
- 다음 상담 추천 질문 생성

---

# 로컬 AI 구조

```text
음성 파일 업로드
        ↓
FFmpeg 음성 변환
        ↓
whisper.cpp 로컬 STT
        ↓
Ollama 로컬 LLM 분석
        ↓
MySQL 저장
        ↓
React 화면 출력
```

    보안 및 로컬 AI 특징
    완전 로컬 AI 처리

외부 OpenAI API 없이 로컬 환경에서 실행
환자 상담 데이터 외부 전송 최소화
병원 환경에서의 개인정보 보호 고려
GPU 가속 지원
whisper.cpp CUDA GPU 가속 지원
RTX GPU 활용 가능
확장 가능한 구조
AiService 인터페이스 기반 구조
Ollama 모델 교체 가능
향후 Vector DB 기반 RAG 확장 가능
🛠 기술 스택
Frontend
React
Vite
Axios
Tailwind CSS
Backend
Spring Boot
Spring Data JPA
MySQL
AI / Audio
Ollama
qwen2.5:3b
whisper.cpp
CUDA
FFmpeg
프로젝트 구조
consultation-frontend/
└ React Frontend

consultation-backend/
└ Spring Boot Backend
실행 방법
1️⃣ 저장소 클론
git clone https://github.com/jeontw/hospital-ai-consultation-local-ai.git
2️⃣ Ollama 설치

Ollama 설치 후 모델 다운로드:

ollama pull qwen2.5:3b

### 3️⃣ whisper.cpp 설치

권장 구조:

```text
C:/dev/tools/whisper.cpp
├ Release/
│ └ whisper-cli.exe
│
├ models/
│ └ ggml-small.bin
│
└ audio/
4️⃣ application.properties 설정

application-example.properties를 복사하여
application.properties 생성 후 DB 정보 입력

spring.datasource.url=jdbc:mysql://localhost:3306/consultation_db
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

ollama.model=qwen2.5:3b

whisper.exe-path=C:/dev/tools/whisper.cpp/Release/whisper-cli.exe
whisper.model-path=C:/dev/tools/whisper.cpp/models/ggml-medium.bin
whisper.language=ko
5️⃣ Backend 실행
cd consultation-backend
./gradlew bootRun
6️⃣ Frontend 실행
cd consultation-frontend
npm install
npm run dev

#주요 화면
대시보드
환자 관리
상담 등록
상담 목록
상담 상세
AI 인사이트
로딩 UI
향후 확장 계획
Vector DB 기반 RAG
의료 특화 LLM 적용
설치 자동화 스크립트
Docker 기반 배포
병원 내부망(On-Premise) 환경 대응
상담 통계 대시보드 고도화
개발 목적

본 프로젝트는 소프트웨어학과 졸업작품으로 개발되었으며,
로컬 AI 기반 의료 상담 보조 시스템 구조를 학습하고 구현하는 것을 목표로 제작되었습니다.
```
