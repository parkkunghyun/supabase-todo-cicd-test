# 1단계: Node 이미지를 사용하여 빌드 과정 수행
FROM node:18 AS build

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# React 앱 소스 파일 복사 및 빌드
COPY . .
RUN npm run build

# 2단계: 정적 파일 서버를 실행하기 위한 Node.js 이미지 사용
FROM node:18

# serve 패키지 설치
RUN npm install -g serve

# 빌드된 React 파일을 컨테이너에 복사
COPY --from=build /app/build /build

# 8080 포트 열기
EXPOSE 8080

# serve를 사용하여 React 앱을 8080 포트에서 실행
CMD ["serve", "-s", "/build", "-l", "8080"]