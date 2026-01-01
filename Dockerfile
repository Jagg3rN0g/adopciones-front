FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Default API URL for local docker environment
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_IMAGES_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_IMAGES_URL=$NEXT_PUBLIC_IMAGES_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
