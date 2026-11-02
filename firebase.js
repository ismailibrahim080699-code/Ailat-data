
const firebaseConfig = {
  apiKey: "AIzaSyBv7ixj82ZWaSHyvv0dzg86MOUBae3pA94",
  authDomain: "ailat-data.firebaseapp.com",
  projectId: "ailat-data",
  storageBucket: "ailat-data.firebasestorage.app",
  messagingSenderId: "936036858829",
  appId: "1:936036858829:web:c9b72589796524b378a284"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-storage.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);
const auth = getAuth(app);

// Kare shafukan da ke bukatar login da verified email
function protectPage() {
  return new Promise((resolve) => {

    onAuthStateChanged(auth, async (user) => {

      if (!user) {
        window.location.replace("login.html");
        resolve(false);
        return;
      }

      try {
        await user.reload();

        if (!user.emailVerified) {
          await signOut(auth);
          alert("Please verify your email before using AILAT DATA.");
          window.location.replace("login.html");
          resolve(false);
          return;
        }

        resolve(true);

      } catch (error) {
        console.error("Security error:", error);
        await signOut(auth);
        window.location.replace("login.html");
        resolve(false);
      }

    });
  });
}

export {
  app,
  storage,
  auth,
  protectPage
};
