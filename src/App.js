import React, { useState, useEffect } from 'react'
import './App.scss'
import Header from './components/Header';
import WantedGame from './components/WantedGame';
import BrickBreakerGame from './components/BrickBreakerGame';
import StatusScreen from './components/screens/StatusScreen';
import GameOverScreen from './components/screens/GameOverScreen'
import PregameScreen from './components/screens/PregameScreen';

const backendHandler = require('./services/backendHandler.js')

function App() {

  const [loading, setLoading] = useState(true)
  const [access, setAccess] = useState(false)
  const [accessStatus, setAccessStatus] = useState({ title: "Loading ...", message: ""})

  const [nftid, setNftid] = useState(null)
  const [signature, setSignature] = useState(null)

  const [gameType, setGameType] = useState(null)

  const [isGameOver, setIsGameOver] = useState(false)
  const [gameOverReason, setGameOverReason] = useState("")
  const [gameOverMessage, setGameOverMessage] = useState("")

  const [gameStarted, setGameStarted] = useState(false)

  const games = {
    wanted: {
      title: "Wanted",
      description: "Wanted! Click the wanted face in the crowd to proceed to the next level.",
      component: <WantedGame gameType={gameType} nftid={nftid} signature={signature} setIsGameOver={setIsGameOver} setGameOverReason={setGameOverReason} setGameOverMessage={setGameOverMessage} />
    },
    brickbreaker: {
      title: "Brick Breaker",
      description: "Clear each level to advance. The ball will get faster as you level up.",
      component: <BrickBreakerGame gameType={gameType} nftid={nftid} signature={signature} setIsGameOver={setIsGameOver} setGameOverReason={setGameOverReason} setGameOverMessage={setGameOverMessage} />
    }
  }

  useEffect(() => {
    async function checkAccess() {
      const canAccess = await accessControl()
      setAccess(canAccess)
      setLoading(false)
    }
    checkAccess()
  }, [])

  useEffect(() => {
    if (!loading && !games[gameType]) {
      setAccessStatus({ title: "Error", message: "Invalid game type!" })
    }
  }, [gameType])

  async function accessControl() {
    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString);
  
    const signature = urlParams.get('signature')
    const nftID = urlParams.get('nftid')
  
    if (!signature || !nftID) {
      setAccessStatus({ title: "Error", message: "Missing parameters!" })
      return false
    }

    // Keep variables to send score at the end of game
    setNftid(nftID)
    setSignature(signature)
    
    try {
      const isSignatureValid = await backendHandler.isValidSignature(nftID, signature)
      if (!isSignatureValid) {
        setAccessStatus({ title: "Access denied!", message: "You do not own this NFT!" })
        return false
      }

      const nftData = await backendHandler.getNFTData(nftID)
      if (nftData.playedToday) {
        setAccessStatus({ title: "Access denied!", message: "You already played today for this NFT!" })
        return false
      }

      const gameType = await backendHandler.getActiveGameType()
      setGameType(gameType)

      if (!gameType) {
        setAccessStatus({ title: "Error", message: "No game type specified!" })
        return false
      }

      return true
    } catch (err) {
      console.error(err)
      setAccessStatus({ title: "Error", message: "An error occurred!" })
      return false
    }
  }

  function Game() {
    if (!games[gameType]) {
      return <StatusScreen status={accessStatus} />
    }
    return games[gameType].component
  }

  return (
    <>
      <Header />
      <GameOverScreen gameOver={isGameOver} gameOverReason={gameOverReason} gameOverMessage={gameOverMessage}/>

      { (loading || !access) && 
        <StatusScreen status={accessStatus} />
      }
      { access && !loading && !gameStarted && 
        <PregameScreen startGame={() => setGameStarted(true)} title={games[gameType].title} description={games[gameType].description}/>
      }
      { access && !loading && gameStarted && 
        <Game />
      }
    </>
  );
}




export default App
