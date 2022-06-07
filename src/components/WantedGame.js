import React, { useState, useEffect } from 'react'
import './Game.scss'
import './WantedGame.scss'
import wantedPoster from '../images/wanted/poster.webp'
import { AiFillHeart } from 'react-icons/ai'

const backendHandler = require('../services/backendHandler.js')

const CANVAS_WIDTH = 700
const CANVAS_HEIGHT = 400

var canvas = null
var ctx = null

const numImages = 24
let images = []

let timer = null

const BACKGROUND_IMAGE = new Image()
BACKGROUND_IMAGE.src = require('../images/wanted/background.png')

function WantedGame({ gameType, nftid, signature, setIsGameOver, setGameOverReason, setGameOverMessage }) {
    const MAX_TIME = 30
    const MIN_TIME = 10
    const MAX_ATTEMPTS = 3

    const [wanted, setWanted] = useState({ imageIndex: 0, x: 0, y: 0, width: 0, height: 0 })
    const [level, setLevel] = useState(1)
    const [timeLeft, setTimeLeft] = useState(MAX_TIME)
    const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS)
    const [score, setScore] = useState(0)

    useEffect(() => {
        [...Array(numImages)].forEach((e, i) => {
            const image = new Image()
            image.src = require(`../images/wanted/heads/${i}.png`)
            images.push(image)
        })
        initGame()

        timer = setInterval(() => setTimeLeft((prevTimeLeft) => prevTimeLeft - 1), 1000)
        return () => {
            clearInterval(timer)
            images = []
        }
    }, [])

    useEffect(() => {
        if (timeLeft <= 0) {
            gameOver("You ran out of time", score)
        }
    }, [timeLeft])

    useEffect(() => {
        if (attemptsLeft <= 0) {
            gameOver("You ran out of attempts", score)
        }
    }, [attemptsLeft])

    useEffect(() => {
        setScore(level - 1)
    }, [level])

    return (
        <div className="game-container">
            <div className="game-header game-header-wanted">
                <div className="game-header-item">
                    <div className="item-value timer">{timeLeft}</div>
                    <div className="item-text">Time Left</div>
                </div>
                <div className="wanted-poster">
                    <img className="wanted-image-bg" src={wantedPoster} alt="Background" />
                    {
                        <img className="wanted-image" src={require(`../images/wanted/heads/${wanted.imageIndex}.png`)} alt="Wanted" />
                    }
                </div>
                <div className="game-header-item">
                    <div className="item-value hearts">{attemptsLeft > 0 && [...Array(attemptsLeft)].map((_, i) => <AiFillHeart key={i} />)}</div>
                    <div className="item-text">Attempts</div>
                </div>

            </div>

            <canvas id="game" onClick={(e) => canvasClick(e)} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            {/*
                <button onClick={() => loadRound()}>Load Round</button>
                <button onClick={nextRound}>Next Level</button>
            */}
        </div>
    )

    function initGame() {
        canvas = document.getElementById('game')
        if (!canvas.getContext) {
            alert("<canvas> is not supported in your browser")
            return
        }
        ctx = canvas.getContext('2d')

        loadRound()
    }

    function loadRound() {
        const wantedImageIndex = randomNumberUpTo(images.length)

        // Set difficulty parameters
        const { numImages, time } = getDifficultyByLevel(level)
        setTimeLeft(time)

        // Draw images on canvas
        populateCanvas(ctx, numImages, wantedImageIndex)
    }

    function nextRound() {
        setLevel(level + 1)
        loadRound()
    }

    function canvasClick(event) {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left
        const clickY = event.clientY - rect.top

        if (wanted.x <= clickX && clickX <= wanted.x + wanted.width &&
            wanted.y <= clickY && clickY <= wanted.y + wanted.height) {
            nextRound()
        } else {
            setAttemptsLeft(attemptsLeft - 1)
        }
    }

    function gameOver(reason, score) {
        clearInterval(timer)
        setIsGameOver(true)
        setGameOverReason(reason)
        setGameOverMessage("Your score: " + score)
        backendHandler.sendScore(gameType, nftid, signature, score)
    }

    function randomNumberUpTo(x) {
        return Math.floor(Math.random() * x);
    }

    function populateCanvas(ctx, numImages, wantedImageIndex) {
        if (BACKGROUND_IMAGE.complete) {
            ctx.drawImage(BACKGROUND_IMAGE, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        } else {
            BACKGROUND_IMAGE.addEventListener('load', () => ctx.drawImage(BACKGROUND_IMAGE, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT), false)
        }
        const imagesToSpawn = []
        let failedToFindValidPlacementStreak = 0

        // Generate array of images to be spawned
        while (imagesToSpawn.length < numImages) {
            if (failedToFindValidPlacementStreak > 1000) {
                break
            }

            // TODO spawn wanted image in the middle somewhere
            const imageIndex = randomNumberUpTo(images.length)
            if (imageIndex === wantedImageIndex) {
                continue
            }

            const x = randomNumberUpTo(CANVAS_WIDTH)
            const y = randomNumberUpTo(CANVAS_HEIGHT)

            const width = 70 // TODO change width & height by levels
            const height = 70

            const invalidPlacement = !isValidPlacementForImage(x, y, width, height, imagesToSpawn)
            if (invalidPlacement) {
                failedToFindValidPlacementStreak++
                continue
            }

            imagesToSpawn.push({ imageIndex: imageIndex, x: x, y: y, width: width, height: height })
        }

        // Replace one item of array with wanted image
        imagesToSpawn[0].imageIndex = wantedImageIndex

        const wantedImage = imagesToSpawn[0]
        setWanted({ imageIndex: wantedImage.imageIndex, x: wantedImage.x, y: wantedImage.y, width: wantedImage.width, height: wantedImage.height })

        // Draw images
        imagesToSpawn.forEach(({ imageIndex, x, y, width, height }) => {
            const image = images[imageIndex]
            if (image.complete) {
                ctx.drawImage(image, x, y, width, height)
            } else {
                image.addEventListener('load', () => ctx.drawImage(image, x, y, width, height), false)
            }
        })
    }

    function isValidPlacementForImage(x, y, width, height, imagesToSpawn) {
        const centerX = x + width / 2
        const centerY = y + height / 2

        if (centerX + width / 2 > CANVAS_WIDTH || centerY + height / 2 > CANVAS_HEIGHT) {
            return false
        }

        for (let spawnedImg of imagesToSpawn) {
            const spawnedImgCenterX = spawnedImg.x + spawnedImg.width / 2
            const spawnedImgCenterY = spawnedImg.y + spawnedImg.height / 2

            const diffX = centerX - spawnedImgCenterX
            const diffY = centerY - spawnedImgCenterY

            const distance = Math.sqrt(diffX * diffX + diffY * diffY)

            // Min distance between two images is 50% of width of one image
            const minDistance = width * 0.5
            if (distance < minDistance) {
                return false
            }
        }

        return true
    }

    function getDifficultyByLevel(level) {
        const numImages = 10 * level
        let time = MAX_TIME
        if (level > 10) {
            const levelsAboveTen = level - 10
            time -= 5 * levelsAboveTen
            if (time < MIN_TIME) {
                time = MIN_TIME
            }
        }
        return { numImages: numImages, time: time }
    }

}



export default WantedGame
