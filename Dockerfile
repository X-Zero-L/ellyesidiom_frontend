FROM node:24-slim

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
