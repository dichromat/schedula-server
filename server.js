require('dotenv').config()
const express = require("express")
const bcrypt = require("bcrypt")
const bodyParser = require("body-parser")
const cors = require("cors")
const { initializeFirebaseApp, uploadData, getDocument, addUser } = require("./lib/firebase")
const { encryptData, decryptData, checkCredentials } = require("./lib/encryption")
const {CLIENT_ORIGIN} = process.env

const app = express()
app.use(bodyParser.json())
app.use(cors({
    origin: CLIENT_ORIGIN
}))

initializeFirebaseApp()

const port = 3000

app.get('/', (req, res) => {
    res.send("Homepage")
})

app.post('/signup', async (req, res) => {
    try {
        const {username, password} = req.body
        const saltRounds = 2
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        await addUser(username, hashedPassword)

        const data = JSON.stringify({username,"time": new Date().toISOString()})
        const {base64iv: iv, encryptedData: token} = encryptData(data)
        res.status(201).json({iv, token})
        
    }
    catch (error) {
        if (error.message === "UserAlreadyExists") {
            res.status(409).json({"message": "User Already Exists"})
        }
        else {
            console.log("Error signing up:", error.message)
            res.status(500).json({"error": "Internal Server Error"})
        }
    }
})

app.put('/login', async (req, res) => {
    try{
        const {username: givenUsername, password: givenPassword} = req.body
        const document = await getDocument(givenUsername)
        const {password} = document.data()

        const isValid = await bcrypt.compare(givenPassword, password)
        if (isValid) {
            const data = JSON.stringify({"username": givenUsername,"time": new Date().toISOString()})
            const {base64iv: iv, encryptedData: token} = encryptData(data)
            res.status(200).json({iv, token})
        }
        else {
            res.status(401).json({"message": "Incorrect Password"})
        }
    }
    catch (error) {
        if (error.message === "NoDocumentsFound") {
            res.status(409).json({"message": "User Does Not Exist"})
        }
        else {
            console.log("Error logging in:", error.message)
            res.status(500).json({"error": "Internal Server Error"})
        }
    }
})

app.put('/save', async (req, res) => {
    try {
        const {username, assignments, iv, token} = req.body
        checkCredentials(username, iv, token)

        document = await getDocument(username)
        await uploadData(document, {"assignments": assignments})
        res.status(200).json({"saved": true})
    }
    catch (error) {
        switch (error.message) {
            case "InvalidCredentials":
                res.status(401).json({"message": "Invalid Credentials"})
                break
            case "TokenExpired":
                res.status(401).json({"message": "Token Expired"})
                break
            case "InsufficientCredentials":
                res.status(401).json({"message": "Insufficient Credentials"})
                break
            case "DecryptFailed":
                res.status(401).json({"message": "Could Not Decrypt Credentials"})
                break
            default:
                console.log("Error saving data:", error.message)
                res.status(500).json({"error": "Internal Server Error"})
                break

        }
    }

})

app.put('/data', async (req, res) => {
    try {
        const {username, iv, token} = req.body
        checkCredentials(username, iv, token)

        document = await getDocument(username)
        const {assignments} = document.data()
        if (assignments) {
            res.status(200).json({"assignments": assignments})
        }
        else {
            res.status(409).json({"message": "User Has No Assignments"})
        }
    }
    catch (error) {
        switch (error.message) {
            case "InvalidCredentials":
                res.status(401).json({"message": "Invalid Credentials"})
                break
            case "TokenExpired":
                res.status(401).json({"message": "Token Expired"})
                break
            case "InsufficientCredentials":
                res.status(401).json({"message": "Insufficient Credentials"})
                break
            case "DecryptFailed":
                res.status(401).json({"message": "Could Not Decrypt Credentials"})
                break
            default:
                console.log("Error grabbing data:", error.message)
                res.status(500).json({"error": "Internal Server Error"})
                break
        }
        
    }
})

app.put('/refresh_token', (req, res) => {
    try {
        const {username: givenUsername, iv: givenIv, token: givenToken} = req.body
        checkCredentials(givenUsername, givenIv, givenToken)

        const data = JSON.stringify({"username": givenUsername,"time": new Date().toISOString()})
        const {base64iv: iv, encryptedData: token} = encryptData(data)
        res.status(200).json({iv, token})
    }
    catch (error) {
        switch (error.message) {
            case "InvalidCredentials":
                res.status(401).json({"message": "Invalid Credentials"})
                break
            case "TokenExpired":
                res.status(401).json({"message": "Token Expired"})
                break
            case "InsufficientCredentials":
                res.status(401).json({"message": "Insufficient Credentials"})
                break
            case "DecryptFailed":
                res.status(401).json({"message": "Could Not Decrypt Credentials"})
                break
            default:
                console.log("Error refreshing token:", error.message)
                res.status(500).json({"error": "Internal Server Error"})
                break
        }
    }
})

app.listen(3000)