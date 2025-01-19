import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDen_kuwZqYXxlaeyzwt1Rb8S2ytpEA-nE",
  authDomain: "team-odd.web.app",
  databaseURL:
    "https://team-odd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "team-odd",
  storageBucket: "team-odd.firebasestorage.app",
  messagingSenderId: "585412862182",
  appId: "1:585412862182:web:66647ad3644ea7f44c9b27",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
