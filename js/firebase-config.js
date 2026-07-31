/**
 * Time Kairo - Firebase Firestore Configuration
 * Replace the values below with your Firebase Project keys from console.firebase.google.com
 */

var firebaseConfig = {
  apiKey: "AIzaSyBFXzukzBZdpibMw7GyAX6qLiQm46hMPsc",
  authDomain: "time-kairo.firebaseapp.com",
  projectId: "time-kairo",
  storageBucket: "time-kairo.firebasestorage.app",
  messagingSenderId: "514309243605",
  appId: "1:514309243605:web:8b7d68f67cf06f4fb7585c"
};

window.firebaseConfig = firebaseConfig;

// Export for module use
if (typeof module !== "undefined") {
  module.exports = firebaseConfig;
}
