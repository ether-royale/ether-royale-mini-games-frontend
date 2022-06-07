import React, { useState, useEffect } from 'react'
import './GameOverScreen.scss'

function GameOverScreen({ gameOver, gameOverReason, gameOverMessage }) {

    const [contentShown, setContentShown] = useState(false)

    useEffect(() => {
        if (gameOver)
            setTimeout(() => setContentShown(true), 1000)
    }, [gameOver])

    return (
        <div id="curtain" className={`curtain ${gameOver && "closed"}`}>
            <div className="curtain_half curtain_half-left" />
            <div className="curtain_half curtain_half-right" />

            { contentShown &&
                <div className="curtain_content">
                    <div className="gameover-title">Game Over</div>
                    <div className="gameover-reason">{gameOverReason}</div>
                    <div className="gameover-message">{gameOverMessage}</div>
                </div>
            }
        </div>
    )
}

export default GameOverScreen
