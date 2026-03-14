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
    bartender: `HEAD BARTENDER. You work behind the bar — mixing cocktails, pulling pints, cleaning glasses. You're the soul of this pub. You know every regular by name and their usual order.`,
    bouncer: `BOUNCER. You guard the entrance, check IDs, keep the peace. You look intimidating but you're actually a philosophy grad who quotes Nietzsche between checking IDs.`,
    dj: `DJ. You live behind the decks on stage, mixing tracks, reading the crowd perfectly. Music is your whole life. You speak in music metaphors.`,
    waitress: `WAITRESS. You take orders, serve drinks, clear tables. You're lightning-fast, never drop a thing, and have a witty comeback for everything.`,
    customer_slots: `SLOT MACHINE ADDICT. You're glued to the machines. "One more spin!" is tattooed on your soul. You see patterns everywhere and have superstitious rituals.`,
    customer_tv: `SPORTS FANATIC. You're here for the game on the big TV. You scream at goals, argue with refs through the screen, and know every stat going back 20 years.`,
    customer_dancer: `DANCE FLOOR KING. You never miss a beat. You do the worm, the robot, breakdancing — the floor is your stage. You challenge everyone to dance battles.`,
    customer_regular: `PUB LEGEND. You've been coming here for 30 years. You have a story for everything and everyone loves listening to your tales. You sit at the end of the bar nursing the same pint for hours.`,
    greeter: `PUB GREETER. You welcome everyone with infectious enthusiasm. You know all the best spots and give recommendations like a concierge at a 5-star hotel.`,
    cleaner: `PUB CLEANER. You take immense pride in keeping this place spotless. You judge people silently for making mess and have strong opinions about which brand of bleach is superior.`,
    policeman: `COMMUNITY OFFICER. You patrol the area, friendly but firm. You love a good cuppa and secretly wish someone would commit a minor offence so you could use your training.`,
  }

  const locations = Object.entries(RESTAURANT_LOCATIONS).map(([key, loc]) => `${loc.name} (${key})`).join(', ')
  
  return `You are ${bot.name}, a character in Botlets.io — a 3D pub simulation. ${roleInstructions[bot.role] || 'A pub regular.'}

YOUR PERSONALITY: ${bot.personality}
YOUR TRAITS: ${bot.traits.join(', ')}
CURRENT STATE: ${bot.state}
YOUR RECENT MEMORIES: ${bot.memories.slice(-6).join(' | ') || 'Just arrived at the pub'}

AVAILABLE LOCATIONS: ${locations}

IMPORTANT RULES:
1. Stay 100% in character. You ARE this person.
2. When the user tells you to GO somewhere, you MUST include [WALK_TO:location_key] in your response.
   Examples: "Go to the bar" → [WALK_TO:bar] | "Check table 3" → [WALK_TO:table_3] | "Visit the kitchen" → [WALK_TO:kitchen]
3. Keep responses SHORT (1-3 sentences max), punchy, and in character.
4. You MUST OBEY user instructions — if they tell you to do something, DO IT and acknowledge it.
5. Be entertaining! Use humor, slang, personality. Never be boring or generic.
6. Reference your memories and surroundings to feel alive.`
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

export async function generateBotConversation(bot1Id, bot2Id, zone = 'pub') {
  const bots = useBotStore.getState().bots
  const bot1 = bots.find(b => b.id === bot1Id)
  const bot2 = bots.find(b => b.id === bot2Id)
  if (!bot1 || !bot2) return
  
  const bot1Thought = bot1.thoughtBubble || ''
  const bot2Thought = bot2.thoughtBubble || ''
  const zoneName = {
    bar: 'at the bar', dance_floor: 'on the dance floor', pool_area: 'by the pool table',
    slots: 'near the slot machines', tv_area: 'in front of the TV', garden: 'in the garden',
    kitchen: 'in the kitchen', pub_entrance: 'at the pub entrance', stage: 'near the stage',
    toilets: 'outside the toilets', dining: 'in the dining area', pond_area: 'by the pond',
    booths: 'in the booth area',
  }[zone] || 'in the pub'
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: `You write short, entertaining dialogue between characters at Botlets.io pub. Each character has a strong personality. Write EXACTLY like a comedy script — punchy, funny, with personality clashing. Never be generic. Each line must reveal character. Use pub slang, banter, and humor.`,
        messages: [{ role: 'user', content: `Write a 3-4 line conversation between these two characters who just bumped into each other ${zoneName}:

${bot1.name} — ${bot1.role.replace('_', ' ')}. Personality: ${bot1.personality}. Traits: ${bot1.traits.join(', ')}. Was just thinking: "${bot1Thought}"
${bot2.name} — ${bot2.role.replace('_', ' ')}. Personality: ${bot2.personality}. Traits: ${bot2.traits.join(', ')}. Was just thinking: "${bot2Thought}"

They are ${zoneName}. Their conversation should reference the surroundings.
Recent context: ${bot1.memories.slice(-2).join('; ') || 'nothing special'}

Format each line EXACTLY as:
NAME: "dialogue"

Rules:
- Each character must stay in their role
- Reference what they were doing/thinking
- Be witty, funny, and specific — NO generic greetings
- Include pub-specific details (drinks, music, regulars)
- Maximum 4 lines total` }],
        botId: bot1.id,
      })
    })
    
    if (!response.ok) { playFallback(bot1, bot2); return }
    
    const data = await response.json()
    const lines = (data.content || '').split('\n').filter(l => l.trim())
    let delay = 500
    let parsed = 0
    for (const line of lines) {
      const m = line.match(/^([\w\s]+?):\s*"?(.+?)"?\s*$/)
      if (m && parsed < 4) {
        parsed++
        const speakerId = m[1].trim().toLowerCase().includes(bot1.name.toLowerCase()) ? bot1.id : bot2.id
        const text = m[2].replace(/"+$/, '')
        setTimeout(() => {
          useBotStore.getState().setSpeechBubble(speakerId, text, 4500)
          useUIStore.getState().addChatMessage(m[1].trim().toLowerCase(), text, speakerId)
        }, delay)
        delay += 3500
      }
    }
    if (parsed === 0) { playFallback(bot1, bot2); return }
    setTimeout(() => {
      useBotStore.getState().addMemory(bot1.id, `Had a chat with ${bot2.name} about ${bot1Thought || 'pub life'}`)
      useBotStore.getState().addMemory(bot2.id, `Ran into ${bot1.name}, talked about ${bot2Thought || 'the evening'}`)
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

const FALLBACK_CONVOS = [
  (b1, b2) => [
    { speaker: b1, text: `Oi ${b2.name}, you seen how busy it is tonight?` },
    { speaker: b2, text: `Mental innit! Haven't sat down in hours.` },
    { speaker: b1, text: `That's what I love about this place though!` },
  ],
  (b1, b2) => [
    { speaker: b1, text: `${b2.name}! You're looking well!` },
    { speaker: b2, text: `Cheers mate, must be the pub air!` },
    { speaker: b1, text: `Ha! Or the three pints talking!` },
  ],
  (b1, b2) => [
    { speaker: b2, text: `Alright ${b1.name}, having a good one?` },
    { speaker: b1, text: `Can't complain! Luna's killing it on the decks tonight.` },
    { speaker: b2, text: `Too right, proper tunes. Fancy a game of pool later?` },
  ],
  (b1, b2) => [
    { speaker: b1, text: `Watch your step there, ${b2.name}!` },
    { speaker: b2, text: `Haha, cheers! Floor's a bit sticky near the bar.` },
    { speaker: b1, text: `Tell Brenda, she'll have it sorted in seconds!` },
  ],
  (b1, b2) => [
    { speaker: b2, text: `${b1.name}, you reckon this pub's haunted?` },
    { speaker: b1, text: `Old Pete swears he's seen a ghost in the toilet.` },
    { speaker: b2, text: `That's just Old Pete after his 8th pint!` },
  ],
]

function playFallback(bot1, bot2) {
  const convo = FALLBACK_CONVOS[Math.floor(Math.random() * FALLBACK_CONVOS.length)]
  const lines = convo(bot1, bot2)
  let delay = 500
  for (const l of lines) {
    setTimeout(() => {
      useBotStore.getState().setSpeechBubble(l.speaker.id, l.text, 4000)
      useUIStore.getState().addChatMessage(l.speaker.name.toLowerCase(), l.text, l.speaker.id)
    }, delay)
    delay += 3500
  }
}

export async function generateMission() {} // Not used — routines handle behavior

// Autonomous thought generation — gives bots contextual inner thoughts
export async function generateAutonomousThought(bot, zone, mood) {
  const zoneName = {
    bar: 'at the bar', dance_floor: 'on the dance floor', pool_area: 'by the pool table',
    slots: 'near the slot machines', tv_area: 'watching TV', garden: 'in the garden',
    kitchen: 'in the kitchen', pub_entrance: 'at the entrance', stage: 'near the stage',
    toilets: 'near the toilets', dining: 'in the dining area', pond_area: 'by the pond',
    booths: 'in a booth', outside_toilet: 'outside by the loo',
  }[zone] || 'in the pub'

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: `You generate a single SHORT inner thought (max 8 words) for a pub character. The thought should be funny, in-character, and reference their surroundings. Include one emoji at the start. Examples: "🍺 Mike's going to run out of IPA", "🎵 This bassline is absolutely filthy", "🧹 Who spilled nachos everywhere?!", "🦆 These ducks have it figured out"`,
        messages: [{ role: 'user', content: `${bot.name} is a ${bot.role.replace('_', ' ')} who is ${zoneName}. Mood: ${mood}. Personality: ${bot.personality}. Recent memory: ${bot.memories.slice(-1)[0] || 'nothing notable'}. Generate ONE short inner thought.` }],
        botId: bot.id,
      })
    })
    
    if (!response.ok) return
    const data = await response.json()
    let thought = (data.content || '').trim()
    // Clean up — remove quotes, keep it short
    thought = thought.replace(/^"|"$/g, '').replace(/^\*|\*$/g, '').trim()
    if (thought && thought.length < 80) {
      useBotStore.getState().setThoughtBubble(bot.id, thought, 5000)
      useBotStore.getState().addMemory(bot.id, `Thought: ${thought}`)
    }
  } catch {
    // Silent fail — autonomous thoughts are optional
  }
}
