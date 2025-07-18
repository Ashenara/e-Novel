// assets/js/auth.js

import { auth, db } from './firebase.js';
import { 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export function initAuth() {
    const authForm = document.getElementById('auth-form');
    if (!authForm) return; // Only run on the login page

    const authLoggedIn = document.getElementById('auth-loggedin');
    const userEmailEl = document.getElementById('user-email');
    const authErrorEl = document.getElementById('auth-error');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // ---- Google Sign-in logic ----
    document.getElementById('google-signin-btn').addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then(async (result) => {
                const user = result.user;
                console.log('Signed in with Google!', user);
                authErrorEl.classList.add('hidden');
                
                // If it's a new user, create a document for them in Firestore.
                if (result.additionalUserInfo?.isNewUser) {
                    try {
                        await setDoc(doc(db, "users", user.uid), {
                            displayName: user.displayName,
                            email: user.email,
                            createdAt: serverTimestamp()
                        });
                        console.log("New user profile created in Firestore.");
                    } catch (error) {
                        console.error("Error creating user profile:", error);
                        // Even if profile creation fails, proceed with login
                    }
                }
                // Redirect to the account page after successful login/signup.
                window.location.href = "/account";
            }).catch((error) => {
                // Handle Errors here.
                authErrorEl.textContent = error.message;
                authErrorEl.classList.remove('hidden');
                console.error("Google Sign-in Error:", error);
            });
    });

    // ---- Handle UI changes on auth state ----
    onAuthStateChanged(auth, user => {
        if (user) {
            authForm.classList.add('hidden');
            authLoggedIn.classList.remove('hidden');
            userEmailEl.textContent = user.email;
        } else {
            authForm.classList.remove('hidden');
            authLoggedIn.classList.add('hidden');
            userEmailEl.textContent = '';
        }
    });

    // ---- Sign Up with Email/Password ----
    document.getElementById('signup-btn').addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        createUserWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                console.log('Signed up!', userCredential.user);
                authErrorEl.classList.add('hidden');
                window.location.href = "/account";
            })
            .catch(error => {
                authErrorEl.textContent = error.message;
                authErrorEl.classList.remove('hidden');
            });
    });

    // ---- Login with Email/Password ----
    document.getElementById('login-btn').addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                console.log('Logged in!', userCredential.user);
                authErrorEl.classList.add('hidden');
                window.location.href = "/account";
            })
            .catch(error => {
                authErrorEl.textContent = error.message;
                authErrorEl.classList.remove('hidden');
            });
    });

    // ---- Logout Button (only on the logged-in view of this page) ----
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => console.log('Logged out'));
    });
}