import React from 'react'
import './StatusScreen.scss'

function StatusScreen({ status }) {
    return (
        <div className="status-screen">
            <div className="status-screen-title">{status.title}</div>
            <div className="status-screen-text">{status.message}</div>
        </div>
    )
}

export default StatusScreen