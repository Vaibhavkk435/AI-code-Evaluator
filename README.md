# AI Task Evaluator

An AI-powered task evaluation system that allows users to submit tasks with code or screenshots for automated evaluation and feedback.

## Features

- Submit tasks with optional code and screenshots
- AI-powered evaluation using Google's Gemini API
- Real-time feedback and scoring
- Modern, responsive UI built with React and Tailwind CSS
- TypeScript for type safety
- MySQL database with Prisma ORM

## Prerequisites

- Node.js (v16 or higher)
- MySQL database
- Google Gemini API key

## Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL="mysql://user:password@localhost:3306/task_evaluator"
   PORT=3000
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Enter a task name
3. Optionally provide code or upload a screenshot
4. Click "Submit for Evaluation"
5. View the AI-generated evaluation results

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - Axios
  - React Dropzone
  - React Hot Toast

- Backend:
  - Node.js
  - Express
  - TypeScript
  - Prisma
  - MySQL
  - Google Gemini API

## License

MIT 