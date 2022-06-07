import React, { useState, useEffect } from 'react'
import './Game.scss'
import './BrickBreakerGame.scss'
import { AiFillHeart } from 'react-icons/ai'

const backendHandler = require('../services/backendHandler.js')

var canvas = null
var ctx = null
var paddle = null
var ball = null
var laserbeam = null

const CANVAS_WIDTH = 622
const CANVAS_HEIGHT = 422

const PADDLE_WIDTH = 100
const PADDLE_MARGIN_BOTTOM = 50
const PADDLE_HEIGHT = 15

const BALL_RADIUS = 5

const SCORE_INCREMENT_PER_BRICK = 10

const BRICK_IMAGE_COUNT = 5

var brickSettings = null
let bricks = []

var level = 1
var score = 0
var lives = 2
var gameOver = false

var paused = true
var countdown = 3
var isStarting = true

const BACKGROUND_IMAGE = new Image()
BACKGROUND_IMAGE.src = require('../images/brickbreaker/background.png')

function BrickBreakerGame({ gameType, nftid, signature, setIsGameOver, setGameOverReason, setGameOverMessage }) {

    const [rlevel, setLevel] = useState(level)
    const [rscore, setScore] = useState(score)
    const [rlives, setLives] = useState(lives)

    useEffect(() => {
        initGame()
    }, [])

    return (
        <div className="game-container">
        <div className="game-header game-header-brickbreaker">
            <div className="game-header-item">
                <div className="item-value level">{rlevel}</div>
                <div className="item-text">Level</div>
            </div>
            <div className="game-header-item">
                <div className="item-value score">{rscore}</div>
                <div className="item-text">Score</div>
            </div>

            <div className="game-header-item">
                <div className="item-value hearts">{rlives > 0 && [...Array(rlives)].map((_, i) => <AiFillHeart key={i} />)}</div>
                <div className="item-text">Lives</div>
            </div>
        </div>

        <canvas id="game" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        {/*
            <button onClick={() => console.log()}>Load Round</button>
            <button onClick={levelUp}>Next Level</button>
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
        ctx.lineWidth = 3

        paddle = {
            x: canvas.width/2 - PADDLE_WIDTH/2,
            y: canvas.height - PADDLE_MARGIN_BOTTOM - PADDLE_HEIGHT,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            dx: 5,
            image: new Image()
        }
        paddle.image.src = require('../images/brickbreaker/paddle.png')

        ball = {
            x: canvas.width/2,
            y: paddle.y - BALL_RADIUS,
            radius: BALL_RADIUS,
            speed: 7,
            dx: 3 * (Math.random() * 2 - 1),
            dy: -3
        }

        brickSettings = {
            rows: 4,
            columns: 8,
            width: 0,
            height: 20,
            spacing: 3,
            fillColor: "#2e3548",
            images: []
        }
        for (let i = 0; i < BRICK_IMAGE_COUNT; i++) {
            const image = new Image()
            image.src = require(`../images/brickbreaker/brick${i}.png`)
            brickSettings.images.push(image)
        }

        laserbeam = {
            width: 103,
            height: 34,
            x: 90,
            y: 235,
            anchorPointX: 95,
            anchorPointY: 252,
            image: new Image()
        }
        laserbeam.image.src = require('../images/brickbreaker/background-laserbeam.png')

        setBrickWidth()
        createBricks()

        loop()

        document.addEventListener("mousemove", (event) => {
            const canvasRect = canvas.getBoundingClientRect();
            const mouseX = event.clientX

            const newPaddlePosX = mouseX - canvasRect.x - PADDLE_WIDTH/2

            // If the mouse leaves the canvas while controling the paddle too fast, the paddle does not move all the way to the border
            // To prevent this: If new paddle location is not on canvas, move paddle closest to canvas border as possible
            if (newPaddlePosX < 0) {
                paddle.x = 0
            } else if (newPaddlePosX + paddle.width > canvas.width) {
                paddle.x = canvas.width - paddle.width
            } else {
                paddle.x = newPaddlePosX
            }
        })

        startGame()
    }

    function loop() {
        if (gameOver) {
            return
        }

        ctx.drawImage(BACKGROUND_IMAGE, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        draw()
        if (!paused) {
            update()
        }
        requestAnimationFrame(loop)
    }

    function update() {
        moveBall()
        ballBorderCollision()
        ballPaddleCollision()
        ballBrickCollision()
    }

    function draw() {
        drawLaserbeam()
        drawPaddle()
        drawBall()
        drawBricks()
        drawStartingScreen()
    }

    function drawPaddle() {
        ctx.drawImage(paddle.image, paddle.x, paddle.y, paddle.width, paddle.height)
    }

    function drawBall() {
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2)
        ctx.fillStyle = "#eb4034"
        ctx.fill()
        ctx.closePath()
    }

    function drawBricks() {
        for (let row = 0; row < brickSettings.rows; row++) {
            for (let column = 0; column < brickSettings.columns; column++) {
                let currentBrick = bricks[row][column]
                // Draw brick if not broken
          
                if (currentBrick.status) {
                    let image = brickSettings.images[row]
                    if (row >= BRICK_IMAGE_COUNT) {
                        image = brickSettings.images[BRICK_IMAGE_COUNT - 1]
                    }
                    ctx.drawImage(image, currentBrick.x, currentBrick.y, brickSettings.width, brickSettings.height)
                }
            }
        }
    }

    function drawStartingScreen() {
        if (!isStarting) {
            return
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const image = new Image()
        image.src = require(`../images/brickbreaker/countdown_${countdown}.png`)

        const x = canvas.width / 2 - image.width / 4
        const y = canvas.height / 2 - image.height / 4

        if (image.complete) {
            ctx.drawImage(image, x, y, image.width / 2, image.height / 2)
        } else {
            image.addEventListener('load', () => ctx.drawImage(image, x, y, image.width / 2, image.height / 2), false)
        }
    }
    
    function drawLaserbeam() {
        ctx.save();

        ctx.translate(laserbeam.anchorPointX, laserbeam.anchorPointY)
        const radians = Math.atan2(ball.y - laserbeam.anchorPointY, ball.x - laserbeam.anchorPointX)
        ctx.rotate(radians)
        ctx.translate(-laserbeam.anchorPointX, -laserbeam.anchorPointY)
    
        ctx.drawImage(laserbeam.image, laserbeam.x, laserbeam.y, laserbeam.width, laserbeam.height)
        // Shows laserbeam anchor point (useful to debug)
        //ctx.fillStyle = "red"
        //ctx.fillRect(laserbeam.anchorPointX, laserbeam.anchorPointY, 2, 2)
        
        ctx.restore()
    }

    function startGame() {
        isStarting = true
        countdown = 3
        setTimeout(() => countdown = 2, 1000)
        setTimeout(() => countdown = 1, 2000)
        setTimeout(() => {
            paused = false
            isStarting = false
        }, 3000)
    }

    function moveBall() {
        ball.x += ball.dx
        ball.y += ball.dy
    }

    function ballBorderCollision() {
        // Right
        if (ball.x + ball.radius > canvas.width) {
            // To not get the ball stuck behind the wall, only change the direction if it is going right
            if (ball.dx > 0) {
                ball.dx = -ball.dx
            }
        }
        // Left
        if (ball.x - ball.radius < 0) {
            // To not get the ball stuck behind the wall, only change the direction if it is going left
            if (ball.dx < 0) {
                ball.dx = -ball.dx
            }
        }
        // Top
        if (ball.y - ball.radius < 0) {
            // To not get the ball stuck behind the wall, only change the direction if it is going top
            if (ball.dy < 0) {
                ball.dy = -ball.dy
            }
        }
        // Bottom
        if (ball.y + ball.radius > canvas.height) {
            setLives((prevLives) => prevLives - 1)
            lives--;
            if (lives <= 0) {
                gameOverFunction()
            }
            resetBall()
        }
    }
    
    function gameOverFunction() {
        setIsGameOver(true)
        setGameOverMessage("Score: " + score)
        gameOver = true
        backendHandler.sendScore(gameType, nftid, signature, score)
    }

    function ballPaddleCollision() {
        if (ball.x < paddle.x + paddle.width && ball.x > paddle.x &&
            ball.y < paddle.y + paddle.height && ball.y > paddle.y)
        {
            let collisionPoint = ball.x - (paddle.x + paddle.width / 2)
            collisionPoint = collisionPoint / (paddle.width / 2)

            let angle = collisionPoint * Math.PI / 3

            ball.dx = ball.speed * Math.sin(angle)
            ball.dy = -ball.speed * Math.cos(angle)
        }
    }

    function ballBrickCollision() {
        for (let row = 0; row < brickSettings.rows; row++) {
            for (let column = 0; column < brickSettings.columns; column++) {
                let currentBrick = bricks[row][column]
          
                if (currentBrick.status) {
                    if (ball.x + ball.radius > currentBrick.x && ball.x - ball.radius < currentBrick.x + brickSettings.width &&
                        ball.y + ball.radius > currentBrick.y && ball.y - ball.radius < currentBrick.y + brickSettings.height) {

                        // On collision of ball and brick
                        ball.dy = -ball.dy
                        currentBrick.status = false
                        setScore((prevScore) => prevScore + SCORE_INCREMENT_PER_BRICK)
                        score += SCORE_INCREMENT_PER_BRICK
                        
                        if (allBricksDestroyed()) {
                            levelUp()
                        }
                    }
                }
            }
        }
    }

    function allBricksDestroyed() {
        let allBrickDestroyed = true

        for (let row = 0; row < brickSettings.rows && allBrickDestroyed; row++) {
            for (let column = 0; column < brickSettings.columns && allBrickDestroyed; column++) {
                if (bricks[row][column].status) {
                    allBrickDestroyed = false
                }
            }
        }

        return allBrickDestroyed
    }

    function levelUp() {
        paused = true

        if (brickSettings.rows < 8) {
            brickSettings.rows += 1
        }
        
        createBricks()
        ball.speed += 0.3
        resetBall()
        setLevel((prevLevel) => prevLevel + 1)
        level++

        startGame()
    }

    function resetBall() {
        ball.x = canvas.width / 2
        ball.y = paddle.y - BALL_RADIUS
        ball.dx = 3 * (Math.random() * 2 - 1)
        ball.dy = -3
    }

    function createBricks() {
        for (let row = 0; row < brickSettings.rows; row++) {
            bricks[row] = []

            for (let column = 0; column < brickSettings.columns; column++) {
                bricks[row][column] = {
                    x: column * (brickSettings.spacing + brickSettings.width) + brickSettings.spacing,
                    y: row * (brickSettings.spacing + brickSettings.height) + brickSettings.spacing,
                    status: true
                }    
            }
        }
    }

    function setBrickWidth() {
        const totalBrickWidth = canvas.width - brickSettings.spacing * (brickSettings.columns + 1)

        brickSettings.width = totalBrickWidth / brickSettings.columns
    }


}

export default BrickBreakerGame
