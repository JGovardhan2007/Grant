import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Real Firebase project configuration provided by the user
const firebaseConfig = {
    apiKey: "AIzaSyAkmZrrb9TCDvXI2iTXzt4yIa-JAIq6RBU",
    authDomain: "grant-d701d.firebaseapp.com",
    projectId: "grant-d701d",
    storageBucket: "grant-d701d.firebasestorage.app",
    messagingSenderId: "412925765701",
    appId: "1:412925765701:web:59b0714bdc03b07da19b2c",
    measurementId: "G-BNB78K6TX8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
