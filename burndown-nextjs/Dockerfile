FROM node:20.20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

ENV JIRA_BASE_URL=https://inovea-group.atlassian.net
ENV JIRA_EMAIL=m.gros@inovea-group.com

CMD ["npm", "start"]
