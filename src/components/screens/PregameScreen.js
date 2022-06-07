import React from 'react'
import './PregameScreen.scss'
import { FaPlay } from 'react-icons/fa'

function PregameScreen({ startGame, title, description }) {

    console.log(title)
    return (
        <div className="pregame-screen">
            <div className="game-title">Play {title}</div>
            <div className="game-start-button" onClick={startGame}><FaPlay /></div>
            <div className="game-description">{description}</div>
            <div className="game-description-sub">
                Daily high scores will be revived and entered back into the battle.
                <br />
                You only get one attempt a day per elimated soldier.
            </div>
        </div>
    )
}

export default PregameScreen