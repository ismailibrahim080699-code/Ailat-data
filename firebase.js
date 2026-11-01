
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

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

export { app, storage };
