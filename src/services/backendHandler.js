import axios from 'axios'

const backendURL = "https://minigames.api.etherroyale.io"

export async function sendScore(gameType, nftId, signature, score) {
    const data = {}
    data.gameType = gameType
    data.nftId = nftId
    data.signature = signature
    data.score = score
    axios.post(backendURL + '/game', data)
        .then(res => {
            
        })
        .catch(err => {
            console.error("Could not send score!")
            console.error(err)
        })
}

export async function getNFTData(nftId) {
    const res = await axios.get(backendURL + '/nft/' + nftId)
    return res.data
}

export async function isValidSignature(nftId, signature) {
    const res = await axios.get(backendURL + '/nft/' + nftId + '/validate/' + signature)
    return res.data.valid
}

export async function getActiveGameType() {
    const res = await axios.get(backendURL + '/game')
    return res.data.gameType
}