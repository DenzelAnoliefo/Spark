# Spark/frontend/Dockerfile

# 1. UPDATE: Use Node 20 (Required for newer Next.js versions)
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package.json package-lock.json* ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the frontend code
COPY . .

# 6. Build the Next.js application
# (This step failed before because Node was too old)
RUN npm run build

# 7. Expose the port
EXPOSE 3000

# 8. Start the app
CMD ["npm", "start"]