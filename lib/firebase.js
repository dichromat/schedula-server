const { initializeApp  } = require("firebase/app")
const { getFirestore, doc, updateDoc, addDoc, collection, getDocs, query, where } = require("firebase/firestore")

const {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGE_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID
} = process.env

const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGE_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID
}

let app
let firestoreDb

const initializeFirebaseApp = () => {
    try {
        app = initializeApp(firebaseConfig)
        firestoreDb = getFirestore();
        return app
    }
    catch (error) {
        console.log(error, "firebase-initializeFirebaseApp")
        throw error
    }
}

const getFirebaseApp = () => app

const uploadData = async (userDoc, formattedData) => {
    try {
        const document = doc(firestoreDb, "users", userDoc.id)
        let dataUpdated = await updateDoc(document, formattedData)
        return dataUpdated
    }
    catch (error) {
        console.log(error, "firebase-uploadData")
        throw error
    }
}

const getDocument = async (username) => {
    try {
        const collectionRef = collection(firestoreDb, "users")
        const q = query(
            collectionRef,
            where("username", "==", username)
        )

        const querySnapshot = await getDocs(q)
        const docList = querySnapshot.docs

        if (docList.length == 0) {
            throw new Error("NoDocumentsFound")
        }
        else if (docList.length > 1) {
            throw new Error("MultipleDocumentsFound")
        }
        return docList[0]
    }
    catch (error) {
        if (error.message === "NoDocumentsFound") {
            throw error
        }
        else {
            console.log(error, "firebase-getDocument")
            throw error
        }
    }
}

const addUser = async (username, hashedPassword) => {
    try {
        await getDocument(username)
        throw new Error("UserAlreadyExists")
    }
    catch (error) {
        try {
            if (error.message === "NoDocumentsFound") {
                const collectionRef = collection(firestoreDb, "users")
                let document = await addDoc(collectionRef, {"username": username, "password": hashedPassword})
                return document 
            }
            else throw error
        }
        catch (error) {
            console.log(error, "firebase-addUser")
            throw error
        }
    }

}

module.exports = {
    initializeFirebaseApp,
    getFirebaseApp,
    uploadData,
    getDocument,
    addUser
}