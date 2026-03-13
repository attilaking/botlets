import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env from project root
config({ path: join(__dirname, '..', '.env') })

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  }
})

app.use(cors())
app.use(express.json())

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-20250514'
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS) || 1024

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: MODEL })
})

// Chat endpoint — proxy to Claude API
app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages, botId } = req.body
    
    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages required' })
    }
    
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: system || 'You are a helpful AI character in a small town simulation.',
      messages: messages.map(m => ({
        role: m.role || 'user',
        content: m.content,
      })),
    })
    
    // Extract text content from response
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
    
    res.json({ 
      content: textContent,
      botId,
      usage: response.usage,
    })
    
  } catch (error) {
    console.error('Claude API error:', error.message)
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' })
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limited, please wait' })
    }
    
    res.status(500).json({ error: 'AI service error', message: error.message })
  }
})

// Socket.IO — real-time updates
io.on('connection', (socket) => {
  console.log(`🤖 Client connected: ${socket.id}`)
  
  socket.on('bot-update', (data) => {
    // Broadcast bot state updates to all clients
    socket.broadcast.emit('bot-update', data)
  })
  
  socket.on('chat-message', (data) => {
    // Broadcast chat messages
    socket.broadcast.emit('chat-message', data)
  })
  
  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log('')
  console.log('  🤖 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ┃  Botlets.io Server Running       ┃')
  console.log(`  ┃  http://localhost:${PORT}            ┃`)
  console.log(`  ┃  Model: ${MODEL.substring(0, 25).padEnd(25)} ┃`)
  console.log('  ┃  Claude API: Connected ✓         ┃')
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
})
