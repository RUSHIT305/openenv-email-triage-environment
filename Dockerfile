FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the frontend
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the server
CMD ["npm", "run", "dev"]
