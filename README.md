# StockQuest

> **Master the Markets, Risk-Free.**
> A real-time fantasy stock market trading application built with Python (Flask) and Firebase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![Firebase](https://img.shields.io/badge/firebase-supported-orange)

StockQuest is a comprehensive fantasy trading platform that allows users to experience the thrill of the Indian Stock Market with ₹10,00,000 in virtual currency. It bridges the gap between learning and trading by providing real-time data, fantasy contests, and a risk-free environment to test strategies.

## ✨ Key Features

*   **Real-Time Market Data**: Live tracking of NSE/BSE stocks, IPOs, Commodities, and Mutual Funds.
*   **Fantasy Portfolio**: Build a team of 11 stocks, assign Captain/Vice-Captain, and compete for points.
*   **Contests & Leaderboards**: Join daily/weekly contests and climb the global ranks.
*   **Interactive Dashboard**: Visual portfolio tracking, daily P&L, and asset allocation graphs.
*   **Secure Authentication**: Seamless login via Google or Email/Password using Firebase Auth.
*   **Dark Mode UI**: A premium, responsive interface designed for extended trading sessions.

## 🛠️ Technology Stack

*   **Backend**: Python 3.x, Flask, RESTful API structure.
*   **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+).
*   **Database & Auth**: Google Firebase (Firestore & Authentication).
*   **Data Source**: Custom Python scrapers/APIs for Indian market data.

## 🚀 Getting Started

To get a local copy up and running, please follow our detailed **[Quickstart Guide](QUICKSTART.md)**.

### Prerequisites

*   Python 3.8 or higher
*   Git
*   A Firebase Project (Free tier is sufficient)

## 📂 Project Structure

```bash
stock-game/
├── backend/                # Python Flask API & Logic
│   ├── services/           # Business logic (Stocks, Contests, Scoring)
│   ├── utils/              # Helper functions a& Scrapers
│   ├── main.py             # Application Entry Point
│   └── requirements.txt    # Python Dependencies
├── frontend/               # Static Web Assets
│   ├── css/                # Stylesheets
│   ├── js/                 # Client-side Logic
│   │   ├── app.js          # Main UI Logic
│   │   ├── auth.js         # Firebase Auth Handling
│   │   └── firestore.js    # Database Operations
│   └── index.html          # Landing Page
└── README.md
```

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Note: This project is for educational purposes only. No real money is involved.*
