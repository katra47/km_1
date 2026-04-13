import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBMUBfbVMv6w7yVJjTbWRtasm0r_wKEBAE",
  authDomain: "km-stcom.firebaseapp.com",
  databaseURL: "https://km-stcom-default-rtdb.firebaseio.com/", // ✅ ESTA ES LA CLAVE
  projectId: "km-stcom",
  storageBucket: "km-stcom.firebasestorage.app",
  messagingSenderId: "390543379703",
  appId: "1:390543379703:web:9565599d2f43c17e3ed7f2"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);