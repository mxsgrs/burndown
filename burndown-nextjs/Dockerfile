# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source
COPY . .

# Build Next.js app
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (optional; you can also use .env or docker run -e)
ENV JIRA_BASE_URL=https://inovea-group.atlassian.net
ENV JIRA_EMAIL=m.gros@inovea-group.com

# Start Next.js in production mode
CMD ["npm", "start"]
