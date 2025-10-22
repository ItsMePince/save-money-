# Stage 1: Build Vite app
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# ใช้ config ที่มี SPA fallback
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
# คัดไฟล์ build ของ Vite
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
