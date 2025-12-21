// ------------------ Firebase Config ------------------
var firebaseConfig = {
    apiKey: "AIzaSyDbVS_PefCHuDN7uqX5FfpVufJQZCX0voM",
    authDomain: "hackathon-2c496.firebaseapp.com",
    databaseURL: "https://hackathon-2c496-default-rtdb.firebaseio.com",
    projectId: "hackathon-2c496",
    storageBucket: "hackathon-2c496.firebasestorage.app",
    messagingSenderId: "999934221286",
    appId: "1:999934221286:web:affa3e24450381914b1427"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ---------------- SIGNUP ----------------
function signupUser() {
    let name = document.getElementById("signupName").value.trim();
    let email = document.getElementById("signupEmail").value.trim();
    let password = document.getElementById("signupPassword").value.trim();
    let branch = document.getElementById("signupBranch").value;
    let year = document.getElementById("signupYear").value;
    let section = document.getElementById("signupSection").value.trim();

    // Validation
    if (!name || !email || !password || !branch || !year || !section) {
        alert("Please fill all fields");
        return;
    }

    // College email check
    if (!email.endsWith("@bvrit.ac.in")) {
        alert("Please use your college email address!");
        return;
    }

    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
        let uid = userCredential.user.uid;

        // Write to Realtime DB
        return firebase.database().ref('users/' + uid).set({
            name: name,
            email: email,
            branch: branch,
            year: year,
            section: section
        });
    })
    .then(() => {
        alert("Signup successful!");
        window.location = "login.html";
    })
    .catch(error => {
        if (error.code === 'auth/email-already-in-use') {
            alert("This email is already registered. Try logging in.");
        } else {
            alert(error.message);
        }
    });
}

// ---------------- LOGIN ----------------
function loginUser() {
    let email = document.getElementById("loginEmail").value.trim();
    let password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
        alert("Login successful!");
        window.location = "index.html";
    })
    .catch(error => {
        alert(error.message);
    });
}
