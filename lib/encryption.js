const crypto = require("crypto")

const {ENCRYPTION_SECRET_KEY} = process.env
const key = Buffer.from(ENCRYPTION_SECRET_KEY, 'base64')

const generateKey = () => {
    return crypto.randomBytes(32)
}

const encryptData = (data) => {
    const algorithm = 'aes-256-cbc'
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, key, iv)

    let encryptedData = cipher.update(data, 'utf-8', 'hex')
    encryptedData += cipher.final('hex')

    const base64iv = Buffer.from(iv, 'binary').toString('base64')

    return {base64iv, encryptedData}
}

const decryptData = (base64iv, encryptedData) => {
    try {
        const algorithm = 'aes-256-cbc'
        const iv = Buffer.from(base64iv, 'base64')
        console.log(iv)

        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        let data = decipher.update(encryptedData, 'hex', 'utf-8')
        data += decipher.final('utf-8')

        return data
    }
    catch (error) {
        console.log(error, "encryption-decryptData")
        throw new Error("DecryptFailed")
    }
}

const checkCredentials = (givenUsername, base64iv, token) => {
    try {
        if (base64iv === undefined || token === undefined) {
            throw new Error("InsufficientCredentials")
        }

        const credentialsJSON = decryptData(base64iv, token)
        const {username, time} = JSON.parse(credentialsJSON)

        if (givenUsername != username) {
            throw new Error("InvalidCredentials")
        }

        const currentTime = new Date()
        const loginTime = new Date(time)
        console.log(currentTime - loginTime)

        const hoursElapsed = (currentTime-loginTime) / (1000*60*60)
        console.log(hoursElapsed)
        if (hoursElapsed < 0 || hoursElapsed > 1) {
            throw new Error("TokenExpired")
        }

        return
    }
    catch (error) {
        console.log(error, "encryption-checkCredentials")
        throw error
    }
    
}

module.exports = {
    generateKey,
    encryptData,
    decryptData,
    checkCredentials
}



