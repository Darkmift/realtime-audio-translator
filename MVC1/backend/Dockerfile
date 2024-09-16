# Use an official Node.js runtime as a parent image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Install TypeScript globally and compile TypeScript files
RUN npm install -g typescript
RUN tsc

# Expose the port your app runs on
EXPOSE 3000

# Start the Node.js app (make sure npm start runs the compiled JS files)
CMD ["npm", "start"]
