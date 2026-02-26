const firebaseConfig = {
apiKey: "AIzaSyBgU2e3nrFc6k741ghQdB7UqqwNYaEvATk",
authDomain: "bra-alsalfa.firebaseapp.com",
databaseURL: "https://bra-alsalfa-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

auth.signInAnonymously();
