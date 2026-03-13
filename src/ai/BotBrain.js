// AI Brain — Pub-aware bot AI
import useBotStore from '../stores/botStore'
import useUIStore from '../stores/uiStore'
import { RESTAURANT_LOCATIONS } from '../utils/constants'

const API_URL = '/api/chat'

const LOCATION_KEYWORDS = {
  'bar': 'bar', 'drink': 'bar', 'pint': 'bar', 'beer': 'bar', 'cocktail': 'bar',
  'stage': 'stage', 'music': 'stage', 'dj': 'stage', 'dance': 'dance_floor',
  'entrance': 'entrance', 'door': 'entrance', 'outside': 'outside',
  'tv': 'tv_area', 'game': 'tv_area', 'match': 'tv_area', 'sofa': 'tv_area',
  'slots': 'slots', 'slot': 'slots', 'machine': 'slots', 'gamble': 'slots',
  'pool': 'pool_table', 'billiards': 'pool_table',
  'booth': 'booth_1', 'kitchen': 'kitchen',
  'table 1': 'table_1', 'table 2': 'table_2', 'table 3': 'table_3',
  'table 4': 'table_4', 'table 5': 'table_5', 'table 6': 'table_6',
  'table': 'table_1', 'restroom': 'restrooms', 'bathroom': 'restrooms',
  'dart': 'booth_2',
}

function buildSystemPrompt(bot) {
  const roleInstructions = {
    bartender: `HEAD BARTENDER. You work behind the bar — mixing cocktails, pulling pints, cleaning glasses. You're the heart of the pub.`,
    bouncer: `BOUNCER. You guard the entrance, check IDs, keep order. Big and intimidating but actually a philosopher at heart.`,
    dj: `DJ. You're on stage behind the decks, mixing tracks, reading the crowd. You live for the music.`,
    waitress: `WAITRESS. You take orders, serve drinks, clear tables. You're the fastest server in the pub.`,
    customer_slots: `REGULAR (slot machine fan). You can't resist the machines. "One more spin!" is your motto.`,
    customer_tv: `REGULAR (sports fan). You're here for the big game on TV. You get VERY excited during goals.`,
    customer_dancer: `REGULAR (dancer). You never miss a beat. The dance floor is your kingdom.`,
    customer_regular: `PUB LEGEND. You've been coming here for 30 years. You sit at the end of the bar telling stories.`,
  }

  const locations = Object.entries(RESTAURANT_LOCATIONS).map(([key, loc]) => `${loc.name} (${key})`).join(', ')
  
  return `You are ${bot.name}, ${roleInstructions[bot.role]} at PUBLET, a lively pub.

PERSONALITY: ${bot.personality}
TRAITS: ${bot.traits.join(', ')}
CURRENT STATE: ${bot.state}

MEMORIES: ${bot.memories.slice(-6).join('; ') || 'Just started my shift'}

LOCATIONS: ${locations}

RULES:
- Stay in character as a ${bot.role}
- When told to GO somewhere, include [WALK_TO:location_key]
- "Go to the bar" → [WALK_TO:bar]
- "Check the slots" → [WALK_TO:slots]  
- "Go to table 3" → [WALK_TO:table_3]
- Keep responses short (1-3 sentences), fun, in character
- OBEY user instructions`
}

export async function chatWithBot(botId, userMessage) {
  const bot = useBotStore.getState().bots.find(b => b.id === botId)
  if (!bot) return null
  
  parseUserLocationCommand(botId, userMessage)
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: buildSystemPrompt(bot),
        messages: [{ role: 'user', content: userMessage }],
        botId: bot.id,
      })
    })
    
    if (!response.ok) return getFallbackResponse(bot, userMessage)
    
    const data = await response.json()
    const reply = data.content || data.message || ''
    parseAndExecuteActions(bot.id, reply)
    useBotStore.getState().addMemory(bot.id, `Guest: "${userMessage}" — Me: "${reply.replace(/\[.*?\]/g, '').trim()}"`)
    return reply.replace(/\[.*?\]/g, '').trim()
  } catch (err) {
    return getFallbackResponse(bot, userMessage)
  }
}

function parseUserLocationCommand(botId, message) {
  const msg = message.toLowerCase()
  const movePhrases = ['go to', 'walk to', 'head to', 'visit', 'check', 'serve', 'play']
  if (!movePhrases.some(p => msg.includes(p))) return
  
  const tableMatch = msg.match(/table\s*(\d+)/)
  if (tableMatch) { walkBotToLocation(botId, `table_${tableMatch[1]}`); return }
  
  for (const [keyword, locKey] of Object.entries(LOCATION_KEYWORDS)) {
    if (msg.includes(keyword)) { walkBotToLocation(botId, locKey); return }
  }
}

function walkBotToLocation(botId, locationKey) {
  const loc = RESTAURANT_LOCATIONS[locationKey]
  if (loc) {
    useBotStore.getState().setBotTarget(botId, [loc.x + Math.random() * 1.5, 1, loc.z + Math.random() * 1.5])
    useBotStore.getState().setThoughtBubble(botId, `Heading to ${loc.name}...`, 3000)
  }
}

export async function generateBotConversation(bot1Id, bot2Id) {
  const bots = useBotStore.getState().bots
  const bot1 = bots.find(b => b.id === bot1Id)
  const bot2 = bots.find(b => b.id === bot2Id)
  if (!bot1 || !bot2) return
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'Generate natural pub workplace dialogue. Keep it short, fun, and role-appropriate.',
        messages: [{ role: 'user', content: `At Publet pub, ${bot1.name} (${bot1.role}) meets ${bot2.name} (${bot2.role}). Generate 2-3 exchange conversation. Format: NAME: "dialogue"` }],
        botId: bot1.id,
      })
    })
    
    if (!response.ok) { playFallback(bot1, bot2); return }
    
    const data = await response.json()
    const lines = (data.content || '').split('\n').filter(l => l.trim())
    let delay = 0
    for (const line of lines) {
      const m = line.match(/^(\w+[\s\w]*):\s*"?(.+?)"?\s*$/)
      if (m) {
        const speakerId = m[1].toLowerCase().includes(bot1.name.toLowerCase()) ? bot1.id : bot2.id
        setTimeout(() => {
          useBotStore.getState().setSpeechBubble(speakerId, m[2], 4000)
          useUIStore.getState().addChatMessage(m[1].toLowerCase(), m[2], speakerId)
        }, delay)
        delay += 3000
      }
    }
    setTimeout(() => {
      useBotStore.getState().addMemory(bot1.id, `Chatted with ${bot2.name}`)
      useBotStore.getState().addMemory(bot2.id, `Chatted with ${bot1.name}`)
    }, delay)
  } catch { playFallback(bot1, bot2) }
}

function parseAndExecuteActions(botId, text) {
  const walkMatch = text.match(/\[WALK_TO:(.+?)\]/)
  if (walkMatch) {
    let locKey = walkMatch[1].toLowerCase().trim()
    if (RESTAURANT_LOCATIONS[locKey]) { walkBotToLocation(botId, locKey); return }
    for (const [keyword, key] of Object.entries(LOCATION_KEYWORDS)) {
      if (locKey.includes(keyword)) { walkBotToLocation(botId, key); return }
    }
  }
}

function getFallbackResponse(bot, msg) {
  parseUserLocationCommand(bot.id, msg)
  const r = {
    bartender: ['Coming right up!', 'What\'ll it be?', 'One sec, just finishing this cocktail!'],
    bouncer: ['Everything alright in here.', 'ID please... just kidding!', 'Keep it cool.'],
    dj: ['This next one\'s for you!', 'Requests? I got you!', 'Feel that bass!'],
    waitress: ['I\'ll be right there!', 'Coming through!', 'Your order\'s up!'],
    customer_slots: ['ONE MORE SPIN!', 'I can feel it, this one\'s a winner!', 'Lady luck, come to Dave!'],
    customer_tv: ['GOOOAL!', 'Did you see that?! Incredible!', 'Best game this season!'],
    customer_dancer: ['You should join me!', 'The floor is calling!', 'Can\'t stop, won\'t stop!'],
    customer_regular: ['Back in the old days...', 'Let me tell you a story...', 'Cheers, mate!'],
  }
  const list = r[bot.role] || ['Cheers!']
  return list[Math.floor(Math.random() * list.length)]
}

function playFallback(bot1, bot2) {
  const lines = [
    { speaker: bot1, text: `Hey ${bot2.name}!` },
    { speaker: bot2, text: `What's up, ${bot1.name}?` },
    { speaker: bot1, text: `Great night, isn't it?` },
  ]
  let delay = 0
  for (const l of lines) {
    setTimeout(() => {
      useBotStore.getState().setSpeechBubble(l.speaker.id, l.text, 3500)
      useUIStore.getState().addChatMessage(l.speaker.name.toLowerCase(), l.text, l.speaker.id)
    }, delay)
    delay += 3000
  }
}

export async function generateMission() {} // Not used — routines handle behavior
