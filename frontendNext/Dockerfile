FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

# extra packages
RUN npm install zustand lucide-react tailwindcss postcss autoprefixer

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]

