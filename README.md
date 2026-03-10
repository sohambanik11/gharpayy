# Gharpayy Dashboard

## Overview
Gharpayy Dashboard is a comprehensive administration and management system built for Gharpayy. It provides a centralized web-based application to handle various operational aspects, including leads, inventory, properties, bookings, and user analytics.

## Features
- **Authentication & Authorization**: Secure login, signup, and password reset functionalities.
- **Analytics & Reporting**: Data-driven insights and historical logs for business performance metrics.
- **CRM Pipeline**: Track and capture leads, manage conversations, and handle visits.
- **Inventory & Property Management**: Detailed property tracking, matching, and zone management.
- **Owner Portals**: Dedicated interfaces for tracking availability, handling owners, and managing bookings.

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn-ui, Radix UI
- **State Management**: TanStack React Query
- **Backend & Database**: Supabase
- **Routing**: React Router

## Local Setup Instructions

Follow these steps to run the dashboard application on your local machine.

### Prerequisites
- Node.js
- npm (Node Package Manager)
- Git

### 1. Clone the Repository
Open your terminal and clone the repository:
```sh
git clone <YOUR_GIT_URL>
```

### 2. Navigate to the Project Directory
```sh
cd gharpayy-flow
```

### 3. Install Dependencies
Install all required packages:
```sh
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory of the project and add your Supabase credentials:
```env
VITE_SUPABASE_PROJECT_ID="your_project_id_here"
VITE_SUPABASE_PUBLISHABLE_KEY="your_publishable_key_here"
VITE_SUPABASE_URL="https://your_project_id_here.supabase.co"
```

### 5. Start the Development Server
Run the application in development mode:
```sh
npm run dev
```

The application will launch and you can view it in your browser, typically at `http://localhost:8080` (or another port specified in the terminal output).

