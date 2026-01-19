
// Authentication State Management

function onAuthSuccess(user) {
    console.log("Logged in as:", user.email);
    // Initialize user in Firestore if not exists (optional, usually done on signup)
    window.location.href = 'dashboard.html';
}

function handleLogin(email, password) {
    if (!email || !password) {
        showError("Please enter email and password");
        return;
    }

    setLoading(true);
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            onAuthSuccess(userCredential.user);
        })
        .catch((error) => {
            setLoading(false);
            showError(error.message);
        });
}

function handleSignup(email, password, name) {
    if (!email || !password) {
        showError("Please enter email and password");
        return;
    }

    setLoading(true);
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Update profile with name
            user.updateProfile({
                displayName: name
            }).then(() => {
                // Create user document in Firestore
                createNewUserParams(user);
            });
        })
        .catch((error) => {
            setLoading(false);
            showError(error.message);
        });
}

function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Check if new user -> create document
            onAuthSuccess(user);
        }).catch((error) => {
            showError(error.message);
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// Initial Setup
async function createNewUserParams(user) {
    try {
        await db.collection("users").doc(user.uid).set({
            name: user.displayName || "User",
            email: user.email,
            balance: 1000000, // Initial 10L
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            portfolio: []
        });
        onAuthSuccess(user);
    } catch (error) {
        console.error("Error creating user profile:", error);
        // Still proceed to dashboard, maybe retry or handle there
        onAuthSuccess(user);
    }
}

// UI Helpers (need to be implemented in html)
function setLoading(state) {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = state;
        btn.innerHTML = state ? '<div class="spinner"></div>' : (btn.dataset.text || 'Submit');
    }
}


function showError(msg) {
    const errDiv = document.getElementById('error-message');
    if (errDiv) {
        errDiv.textContent = msg;
        errDiv.style.display = 'block';
    } else {
        alert(msg);
    }
}

// Global Auth Listener & Route Protection
firebase.auth().onAuthStateChanged((user) => {
    // Dispatch event for other scripts (app.js)
    const event = new CustomEvent('authStateChanged', { detail: user });
    document.dispatchEvent(event);

    const path = window.location.pathname;
    const isProtected = path.includes('dashboard') ||
        path.includes('market') ||
        path.includes('portfolio') ||
        path.includes('leaderboard') ||
        path.includes('contest') ||
        path.includes('stock-detail') ||
        path.includes('profile');

    // If on protected page and not logged in (allow slight delay for init)
    if (isProtected && !user) {
        window.location.href = 'login.html';
    }

    if (user) {
        console.log("Auth State: Logged In", user.uid);
        // Link Avatar to Profile
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            avatar.style.cursor = 'pointer';
            avatar.onclick = () => window.location.href = 'profile.html';
        }
    } else {
        console.log("Auth State: Logged Out");
    }
});

