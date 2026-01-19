# Quickstart Guide

This guide will help you set up **StockQuest** on your local machine. This project consists of a **Python Flask backend** (which serves the API and static files) and a **Vanilla JS frontend** (which connects to Firebase).

---

## 1. Prerequisites

Before you begin, ensure you have the following installed:
*   [Python 3.8+](https://www.python.org/downloads/)
*   [Git](https://git-scm.com/)

You will also need a **Google Account** to create a Firebase project.

---

## 2. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/stock-game.git
cd stock-game
```

---

## 3. Backend Setup

The backend handles stock data fetching and game logic.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a Virtual Environment (Recommended):**
    *   **Windows:**
        ```bash
        python -m venv venv
        venv\Scripts\activate
        ```
    *   **macOS/Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Python Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

---

## 4. Frontend Configuration (Firebase)

The frontend needs your specific Firebase credentials to handle User Auth and Database storage. **This file is not committed to GitHub for security.**

1.  **Create a Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication**:
    *   Go to **Build > Authentication**.
    *   Enable **Email/Password** and **Google** sign-in providers.
3.  **Enable Firestore**:
    *   Go to **Build > Firestore Database**.
    *   Create Database (Start in **Test Mode** for easier development).
4.  **Get Configuration**:
    *   Go to **Project Settings (Gear Icon) > General**.
    *   Scroll to "Your apps" and select **</> (Web)**.
    *   Register the app (e.g., "StockQuest Local").
    *   **Copy the `firebaseConfig` code block.**

5.  **Create the Config File**:
    *   In your local folder, create a new file at: `frontend/js/firebase-config.js`
    *   Paste your config code inside it. It should look like this:

    ```javascript
    // frontend/js/firebase-config.js

    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "your-project.firebaseapp.com",
      projectId: "your-project",
      storageBucket: "your-project.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef"
    };

    // Initialize Firebase
    // Ensure these scripts are loaded in your HTML before this file
    const app = firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    ```

---

## 5. Running the Application

1.  Ensure you are in the `backend` directory and your virtual environment is active.
2.  Start the Flask server:
    ```bash
    python main.py
    ```
3.  You should see output indicating the server is running (usually `Running on http://0.0.0.0:5000`).
4.  Open your web browser and navigate to:
    👉 **http://localhost:5000**

---

## 6. Troubleshooting

**"Module not found" error in Python:**
*   Ensure you activated the virtual environment *before* running `pip install`.
*   Try running `pip install flask flask-cors python-dotenv requests` manually.

**"Firebase is not defined" error in Browser Console:**
*   Ensure `frontend/js/firebase-config.js` exists and contains the correct code.
*   Ensure you have an active internet connection (Firebase SDKs are loaded from CDN).

**Market Data not loading:**
*   The backend scrapes live data. If the source website changes its structure, the scrapers might need updating. Check the Python console for error logs.