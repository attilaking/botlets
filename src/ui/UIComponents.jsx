import React, { useState, useRef, useEffect, useCallback } from 'react'
import useBotStore from '../stores/botStore'
import useUIStore from '../stores/uiStore'
import { chatWithBot } from '../ai/BotBrain'
import { speak } from '../speech/TextToSpeech'
import { startListening, stopListening, isSupported } from '../speech/SpeechToText'

// ==========================================
// Top Bar
// ==========================================
export function TopBar() {
  const bots = useBotStore(s => s.bots)
  const simSpeed = useUIStore(s => s.simSpeed)
  const cycleSpeed = useUIStore(s => s.cycleSpeed)
  const activeBots = bots.filter(b => b.state !== 'idle').length

  return (
    <div className="top-bar">
      <div className="top-bar-logo">
        <div className="logo-icon">🍺</div>
        <h1>Botlets.io</h1>
      </div>
      <div className="top-bar-center">
        <div className="top-bar-stat"><span className="dot" /><span>{activeBots}/{bots.length} active</span></div>
        <div className="top-bar-stat">🏡 Town</div>
      </div>
      <div className="top-bar-right">
        <a href="https://github.com/attilaking/botlets" target="_blank" rel="noopener noreferrer" className="github-link" title="View on GitHub">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
        <button className="speed-control" onClick={cycleSpeed}>⚡ {simSpeed}x speed</button>
      </div>
    </div>
  )
}

// ==========================================
// Bot Sidebar
// ==========================================
export function BotSidebar() {
  const bots = useBotStore(s => s.bots)
  const selectedBotId = useBotStore(s => s.selectedBotId)
  const selectBot = useBotStore(s => s.selectBot)

  const getRoleLabel = (bot) => {
    const roles = {
      bartender: '🍸 Bartender',
      bouncer: '💪 Bouncer',
      dj: '🎧 DJ',
      waitress: '🍹 Waitress',
      customer_slots: '🎰 Gambler',
      customer_tv: '📺 Sports Fan',
      customer_dancer: '🕺 Dancer',
      customer_regular: '🍻 Regular',
    }
    return roles[bot.role] || bot.role
  }

  return (
    <div className="sidebar-right">
      <div className="sidebar-title">🤖 BOTLETS</div>
      {bots.map(bot => (
        <div
          key={bot.id}
          className={`bot-card ${selectedBotId === bot.id ? 'selected' : ''}`}
          onClick={() => selectBot(bot.id)}
        >
          <div className="bot-avatar" style={{ background: `${bot.color}22` }}>{bot.emoji}</div>
          <div className="bot-info">
            <div className="bot-name">{bot.name}</div>
            <div className="bot-status">{getRoleLabel(bot)}</div>
          </div>
          <span className={`bot-state-badge ${bot.state === 'idle' ? 'idle' : 'active'}`}>
            {bot.state === 'idle' ? 'Idle' : bot.state === 'walking' ? '🚶' : bot.state === 'talking' ? '💬' : '✨'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ==========================================
// Chat Panel — TOP LEFT, DRAGGABLE, PER-BOT FILTERED
// ==========================================
export function ChatPanel() {
  const selectedBotId = useBotStore(s => s.selectedBotId)
  const bots = useBotStore(s => s.bots)
  const chatMessages = useUIStore(s => s.chatMessages)
  const addChatMessage = useUIStore(s => s.addChatMessage)
  const isRecording = useUIStore(s => s.isRecording)
  const setRecording = useUIStore(s => s.setRecording)

  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef(null)

  const [dragPos, setDragPos] = useState({ x: 16, y: 56 })
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const selectedBot = bots.find(b => b.id === selectedBotId)

  // Filter messages: only show conversation between user and selected bot
  const filteredMessages = selectedBotId
    ? chatMessages.filter(msg =>
        msg.sender === 'you' ||
        msg.sender === 'system' ||
        msg.botId === selectedBotId
      )
    : chatMessages.slice(-8)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [filteredMessages])

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
    isDragging.current = true
    dragOffset.current = { x: e.clientX - dragPos.x, y: e.clientY - dragPos.y }
    const onMove = (ev) => {
      if (!isDragging.current) return
      setDragPos({ x: Math.max(0, ev.clientX - dragOffset.current.x), y: Math.max(0, ev.clientY - dragOffset.current.y) })
    }
    const onUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [dragPos])

  const handleSend = async () => {
    if (!input.trim() || !selectedBotId || isProcessing) return
    const msg = input.trim()
    setInput('')
    setIsProcessing(true)
    addChatMessage('you', msg, selectedBotId)
    try {
      const reply = await chatWithBot(selectedBotId, msg)
      if (reply) {
        addChatMessage(selectedBot.name.toLowerCase(), reply, selectedBotId)
        speak(reply, selectedBot)
      }
    } catch {
      addChatMessage('system', 'Failed to get response.', selectedBotId)
    }
    setIsProcessing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleMic = () => {
    if (isRecording) { stopListening(); setRecording(false); return }
    if (!isSupported()) { addChatMessage('system', 'Voice not supported.'); return }
    setRecording(true)
    startListening(
      (transcript) => { setInput(transcript); setRecording(false) },
      () => setRecording(false)
    )
  }

  return (
    <div className="chat-panel" style={{ left: dragPos.x, top: dragPos.y }} onMouseDown={handleMouseDown}>
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="drag-handle">⠿</span>
          {selectedBot ? (
            <>
              <span>{selectedBot.emoji}</span>
              <span className="chat-bot-name">{selectedBot.name}</span>
              <span className="chat-label">{selectedBot.role}</span>
            </>
          ) : (
            <>
              <span>💬</span>
              <span className="chat-bot-name">Town Chat</span>
              <span className="chat-label">click a character</span>
            </>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {filteredMessages.slice(-12).map((msg, i) => (
          <div key={i} className="chat-msg">
            <span className={`sender ${msg.sender === 'you' ? 'user' : msg.sender === 'system' ? 'system' : 'bot'}`}>
              {msg.sender === 'you' ? 'You' : msg.sender === 'system' ? '⚙️' : msg.sender}:
            </span>
            <span className="content">{msg.content}</span>
          </div>
        ))}
        {isProcessing && (
          <div className="chat-msg">
            <span className="sender bot">{selectedBot?.name}:</span>
            <span className="content" style={{ opacity: 0.5 }}>thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <button className={`btn-mic ${isRecording ? 'recording' : ''}`} onClick={handleMic}>🎤</button>
        <input
          className="chat-input"
          placeholder={selectedBot ? `Talk to ${selectedBot.name}...` : 'Select a character...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!selectedBotId || isProcessing}
        />
        <button className="btn-send" onClick={handleSend} disabled={!input.trim() || !selectedBotId || isProcessing}>➤</button>
      </div>
    </div>
  )
}

// ==========================================
// Mission Panel — CLOSABLE
// ==========================================
export function MissionPanel() {
  const selectedBotId = useBotStore(s => s.selectedBotId)
  const bots = useBotStore(s => s.bots)
  const [closed, setClosed] = useState(false)
  const selectedBot = bots.find(b => b.id === selectedBotId)

  // Reset closed state when selecting a different bot
  useEffect(() => { setClosed(false) }, [selectedBotId])

  if (!selectedBot || !selectedBot.currentMission || closed) return null

  const progress = selectedBot.missionSteps.length > 0
    ? (selectedBot.missionStepIndex / selectedBot.missionSteps.length) * 100 : 0

  return (
    <div className="mission-panel">
      <div className="mission-header">
        <div className="mission-title">🎯 {selectedBot.name}'s Task</div>
        <button className="mission-close" onClick={() => setClosed(true)}>✕</button>
      </div>
      <div className="mission-goal">{selectedBot.currentMission.goal}</div>
      <ul className="mission-steps">
        {selectedBot.missionSteps.map((step, i) => {
          const isDone = i < selectedBot.missionStepIndex
          const isActive = i === selectedBot.missionStepIndex
          return (
            <li key={i} className={`mission-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
              <span className="step-icon">{isDone ? '✓' : isActive ? '●' : ''}</span>
              <span>{step}</span>
            </li>
          )
        })}
      </ul>
      <div className="mission-progress"><div className="mission-progress-bar" style={{ width: `${progress}%` }} /></div>
    </div>
  )
}

// ==========================================
// Navigator Pad
// ==========================================
export function NavigatorPad() {
  const setCameraMove = useUIStore(s => s.setCameraMove)
  const startMove = (dir) => setCameraMove(dir)
  const stopMove = () => setCameraMove(null)
  const btnProps = (dir) => ({
    onMouseDown: () => startMove(dir),
    onMouseUp: stopMove,
    onMouseLeave: stopMove,
    onTouchStart: (e) => { e.preventDefault(); startMove(dir) },
    onTouchEnd: stopMove,
  })

  return (
    <div className="navigator-pad">
      <button className="nav-btn nav-up" {...btnProps({ x: 0, z: -1 })}>▲</button>
      <div className="nav-row">
        <button className="nav-btn nav-left" {...btnProps({ x: -1, z: 0 })}>◀</button>
        <div className="nav-center">✦</div>
        <button className="nav-btn nav-right" {...btnProps({ x: 1, z: 0 })}>▶</button>
      </div>
      <button className="nav-btn nav-down" {...btnProps({ x: 0, z: 1 })}>▼</button>
    </div>
  )
}

// ==========================================
// Toast Container
// ==========================================
export function ToastContainer() {
  const toasts = useUIStore(s => s.toasts)
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>{toast.message}</div>
      ))}
    </div>
  )
}

// ==========================================
// Loading Screen
// ==========================================
export function LoadingScreen() {
  const isLoading = useUIStore(s => s.isLoading)
  const loadingText = useUIStore(s => s.loadingText)
  if (!isLoading) return null

  return (
    <div className="loading-screen">
      <div className="loading-logo">Botlets.io</div>
      <div className="loading-bar"><div className="loading-bar-inner" /></div>
      <div className="loading-text">{loadingText}</div>
    </div>
  )
}
