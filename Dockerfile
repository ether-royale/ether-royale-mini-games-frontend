FROM node:16.14.2 as build-deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . ./
RUN npm run build

FROM nginx:1.21.6
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]