# 로컬 AI 기반 병원 상담 관리 시스템

병원 전화 상담이나 간호 메모를 로컬 AI로 분석해 환자, 상담, 예약 정보를 한 화면에서 관리하는 웹 애플리케이션입니다.

음성 파일은 `whisper.cpp`로 텍스트화하고, 상담 내용은 `Ollama` 기반 로컬 LLM으로 요약합니다. 외부 AI API로 상담 데이터를 전송하지 않는 로컬 처리 구조를 목표로 합니다.

## 주요 기능

### 환자 관리

- 환자 등록, 조회, 수정, 삭제
- 환자별 상담 이력 조회
- 환자별 예약 이력과 예정 예약 확인
- AI 기반 환자 상담 인사이트 제공

### 상담 관리

- 음성 파일 업로드 기반 상담 등록
- 간호 메모 기반 상담 등록
- AI 분석 결과 미리보기 후 확정 저장
- 상담 요약, 주요 증상, 위험도, 키워드 자동 분석
- 상담 상세 조회, 수정, 삭제

### 예약 관리

- 환자별 예약 등록
- 상담 내용 기반 AI 예약 초안 생성
- 의사별 주간 캘린더 조회
- 예약 상태 변경 및 삭제
- 환자별 활성 예약 1건 제한

### 의사 관리

- 의사 등록, 조회, 수정, 삭제
- 삭제 시 기존 예약과의 연결을 고려한 비활성 처리
- 의사별 주간 예약 현황 제공

### 로컬 AI 처리

- `whisper.cpp` 기반 로컬 STT
- `Ollama` 기반 로컬 LLM 분석
- 지원 모델: `qwen2.5:3b`, `qwen2.5:7b`, `exaone3.5:7.8b`
- 상담 내용 기반 환자 후보 정보 추출
- 진료 참고용 의사 브리핑 생성

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Axios, FullCalendar |
| Backend | Java 17, Spring Boot 3.5, Spring Web, Spring Data JPA |
| Database | MySQL |
| Local AI | Ollama, whisper.cpp |
| Audio | FFmpeg |
| Build | Gradle, npm |

## 프로젝트 구조

```text
project-local-ai/
├─ consultation-backend/        # Spring Boot 백엔드
│  ├─ src/main/java/com/hospital/consultation/
│  │  ├─ controller/            # REST API 컨트롤러
│  │  ├─ service/               # 비즈니스 로직, AI, STT, 오디오 처리
│  │  ├─ repository/            # JPA Repository
│  │  ├─ entity/                # JPA Entity
│  │  ├─ dto/                   # 요청/응답 DTO
│  │  └─ config/                # CORS, 리소스 설정
│  └─ src/main/resources/
│     └─ application-example.properties
├─ consultation-front/          # React 프론트엔드
│  ├─ src/api/                  # 백엔드 API 호출 모듈
│  ├─ src/components/           # 화면 컴포넌트
│  ├─ src/utils/                # 프론트엔드 유틸리티
│  └─ src/App.jsx               # 메인 화면
└─ README.md
```

## 처리 흐름

```text
상담 음성 파일 또는 간호 메모 입력
        ↓
FFmpeg 오디오 변환
        ↓
whisper.cpp 로컬 음성 인식
        ↓
Ollama 로컬 LLM 분석
        ↓
상담 미리보기 및 사용자 검토
        ↓
MySQL 저장
        ↓
React 화면에서 환자, 상담, 예약 관리
```

## 사전 준비

### 필수 설치 항목

- Java 17
- Node.js 및 npm
- MySQL
- Ollama
- whisper.cpp
- FFmpeg

### Ollama 모델 준비

프로젝트에서 사용할 모델을 내려받습니다.

```bash
ollama pull qwen2.5:7b
ollama pull qwen2.5:3b
ollama pull exaone3.5:7.8b
```

기본 설정은 `qwen2.5:7b`입니다. 메모리가 부족한 환경에서는 `qwen2.5:3b` 사용을 권장합니다.

### whisper.cpp 준비

기본 설정 예시는 다음 경로를 기준으로 합니다.

```text
C:/dev/tools/whisper.cpp/
├─ Release/
│  └─ whisper-cli.exe
└─ models/
   └─ ggml-medium.bin
```

다른 위치에 설치했다면 `application.properties`의 `whisper.exe-path`, `whisper.model-path` 값을 실제 경로에 맞게 수정하세요.

### FFmpeg 준비

현재 백엔드 코드는 다음 경로의 FFmpeg 실행 파일을 사용합니다.

```text
C:/dev/tools/ffmpeg/bin/ffmpeg.exe
```

다른 경로에 설치했다면 `AudioConvertService`의 FFmpeg 경로를 수정해야 합니다.

## 환경 설정

백엔드 설정 예시 파일을 복사해 실제 설정 파일을 만듭니다.

```bash
cd consultation-backend
cp src/main/resources/application-example.properties src/main/resources/application.properties
```

Windows PowerShell에서는 다음 명령을 사용할 수 있습니다.

```powershell
Copy-Item src/main/resources/application-example.properties src/main/resources/application.properties
```

`application.properties` 예시:

```properties
spring.application.name=consultation

spring.datasource.url=jdbc:mysql://localhost:3306/consultation_db
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB

ai.provider=local
ollama.model=qwen2.5:7b

whisper.exe-path=C:/dev/tools/whisper.cpp/Release/whisper-cli.exe
whisper.model-path=C:/dev/tools/whisper.cpp/models/ggml-medium.bin
whisper.language=ko
```

MySQL에는 `consultation_db` 데이터베이스를 미리 생성합니다.

```sql
CREATE DATABASE consultation_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

## 실행 방법

### 1. Ollama 실행 확인

Ollama가 `http://localhost:11434`에서 동작해야 합니다.

```bash
ollama list
```

### 2. 백엔드 실행

```bash
cd consultation-backend
./gradlew bootRun
```

Windows PowerShell:

```powershell
cd consultation-backend
.\gradlew.bat bootRun
```

백엔드는 기본적으로 `http://localhost:8080`에서 실행됩니다.

### 3. 프론트엔드 실행

```bash
cd consultation-front
npm install
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 주요 API

| 기능 | Method | Endpoint |
| --- | --- | --- |
| 환자 목록 조회 | GET | `/patients` |
| 환자 등록 | POST | `/patients` |
| 환자 수정 | PUT | `/patients/{patientId}` |
| 환자 삭제 | DELETE | `/patients/{patientId}` |
| 상담 목록 조회 | GET | `/consultations` |
| 환자별 상담 조회 | GET | `/consultations/patient/{patientId}` |
| 환자 인사이트 조회 | GET | `/consultations/patient/{patientId}/insight` |
| 상담 AI 미리보기 | POST | `/consultations/preview` |
| 상담 미리보기 확정 | POST | `/consultations/preview/confirm` |
| 상담 수정 | PUT | `/consultations/{consultationId}` |
| 상담 삭제 | DELETE | `/consultations/{consultationId}` |
| 예약 목록 조회 | GET | `/appointments` |
| 환자별 예약 조회 | GET | `/appointments/patient/{patientId}` |
| 상담별 예약 조회 | GET | `/appointments/consultation/{consultationId}` |
| AI 예약 초안 생성 | POST | `/appointments/draft/{consultationId}` |
| 예약 등록 | POST | `/appointments` |
| 예약 수정 | PUT | `/appointments/{appointmentId}` |
| 예약 상태 변경 | PATCH | `/appointments/{appointmentId}/status` |
| 예약 삭제 | DELETE | `/appointments/{appointmentId}` |
| 의사 목록 조회 | GET | `/doctors` |
| 의사 등록 | POST | `/doctors` |
| 의사 수정 | PUT | `/doctors/{doctorId}` |
| 의사 삭제 | DELETE | `/doctors/{doctorId}` |
| 현재 AI 모델 조회 | GET | `/ai/model` |
| AI 모델 변경 | POST | `/ai/model` |

## 화면 구성

- 상단: 환자 수, 상담 수, 오늘 예약 수, AI 모델 선택
- 좌측: 환자 등록/목록, 상담 입력, 예약 등록
- 중앙: 선택 환자 인사이트, 상담 이력, 상담 상세
- 우측: 의사별 주간 예약 캘린더, 의사 관리

## 개발 명령어

### Backend

```bash
cd consultation-backend
./gradlew bootRun
./gradlew test
./gradlew build
```

### Frontend

```bash
cd consultation-front
npm run dev
npm run build
npm run lint
npm run preview
```

## 문제 해결

### Ollama 응답이 비어 있거나 AI 분석에 실패하는 경우

- `ollama list`로 모델이 설치되어 있는지 확인합니다.
- `application.properties`의 `ollama.model` 값이 설치된 모델명과 일치하는지 확인합니다.
- Ollama 서버가 실행 중인지 확인합니다.

### 음성 인식 결과가 비어 있는 경우

- `whisper.exe-path`가 실제 `whisper-cli.exe` 위치와 일치하는지 확인합니다.
- `whisper.model-path`가 실제 모델 파일 위치와 일치하는지 확인합니다.
- `whisper.language=ko` 설정을 확인합니다.
- 업로드한 음성 파일 길이와 음질을 확인합니다.

### 오디오 변환에 실패하는 경우

- `C:/dev/tools/ffmpeg/bin/ffmpeg.exe` 파일이 존재하는지 확인합니다.
- FFmpeg를 다른 경로에 설치했다면 백엔드의 `AudioConvertService` 경로를 수정합니다.

### 프론트엔드에서 API 호출에 실패하는 경우

- 백엔드가 `http://localhost:8080`에서 실행 중인지 확인합니다.
- 프론트엔드가 `http://localhost:5173`에서 실행 중인지 확인합니다.
- 백엔드 CORS 허용 origin이 프론트엔드 주소와 일치하는지 확인합니다.

## 개발 목적

이 프로젝트는 로컬 AI 기반 의료 상담 보조 시스템 구조를 학습하고 구현하기 위한 프로젝트입니다. 상담 데이터의 로컬 처리, 음성 인식, LLM 분석, 환자 이력 관리, 예약 관리 흐름을 하나의 병원 업무 화면으로 연결하는 것을 목표로 합니다.
