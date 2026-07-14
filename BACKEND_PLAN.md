# Backend Integration Plan (Firebase)

This document outlines the plan for adding user accounts and a cloud database to the Guitar Practice Sessions application without requiring paid hosting.

## Overview
The application will continue to be hosted as a static frontend on Vercel or GitHub Pages. We will integrate **Firebase** (a free Backend-as-a-Service by Google) to handle Authentication and Database storage. 

This will allow users to:
1. Create an account and log in securely.
2. Save their custom Jam Tracks, Rhythms, and Arpeggio Patterns to the cloud.
3. Access their custom content from any device.

## Why Firebase?
- **Cost**: The free "Spark" plan includes 50,000 database reads per day and 10,000 monthly auth verifications. It requires no credit card to start.
- **Hosting**: No backend server is required. The React frontend talks directly to Firebase APIs.
- **Simplicity**: Handles secure login flows (Google, Email) out of the box.

---

## Step 1: Create the Firebase Project
*(To be completed by the repository owner)*

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Create a project** (or Add project).
3. Name your project (e.g., `Guitar-Practice-Sessions`).
4. You can disable Google Analytics for now unless you want it.
5. Once the project is ready, click **Continue**.

## Step 2: Register the Web App
1. On the Firebase project overview page, click the **Web** icon (`</>`) to add an app.
2. Register the app with a nickname (e.g., `guitar-app-web`).
3. (Optional) Check "Also set up Firebase Hosting" ONLY if you want to move away from Vercel/GitHub Pages. Otherwise, leave it unchecked.
4. Click **Register app**.
5. Firebase will provide a `firebaseConfig` object containing your API keys. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
6. **Save these keys!** Provide them to the AI when you are ready to proceed with implementation.

## Step 3: Enable Authentication & Firestore
1. In the left-hand menu of the Firebase console, go to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable **Google** and/or **Email/Password**.
4. Next, go to **Build > Firestore Database** in the left menu.
5. Click **Create database**.
6. Choose **Start in test mode** (this allows us to easily develop and test. We will lock down security rules later).
7. Select a location closest to you and click **Enable**.

---

## Step 4: Implementation (AI Tasks)
*(When you are ready to begin, provide the API keys to the AI to execute the following steps)*

1. **Install SDK**: Run `npm install firebase` in the project repository.
2. **Initialize Firebase**: Create a `src/lib/firebase.ts` file using the provided API keys to initialize Auth and Firestore.
3. **Build Auth UI**: Create a simple Login/Signup component and integrate it into the header.
4. **Update State Management**: Modify the local storage hooks for Custom Rhythms and Jam Tracks to sync with Firestore when a user is logged in. 
5. **Data Structure**:
   - `users/{uid}/jam_tracks` (Collection of custom jam tracks)
   - `users/{uid}/rhythms` (Collection of custom tapped rhythms)
6. **Security Rules**: Write Firestore security rules ensuring users can only read and write their own data.
