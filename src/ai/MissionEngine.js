// Mission Engine — Pub role-based behavior loops
// All walk targets are verified to be in WALKABLE areas
import useBotStore from '../stores/botStore'
import useUIStore from '../stores/uiStore'
import { generateBotConversation } from './BotBrain'
import { RESTAURANT_LOCATIONS } from '../utils/constants'

let behaviorInterval = null

// Role routines — all coordinates reference RESTAURANT_LOCATIONS
const ROLE_ROUTINES = {
  bartender: [
    { action: 'walk', target: { x: 25, z: 5 }, thought: '🍺 Pulling a pint...', duration: 5000 },
    { action: 'wait', thought: '🍺 Here you go, fresh on tap!', duration: 4000 },
    { action: 'walk', target: { x: 30, z: 5 }, thought: '🧹 Wiping down the bar...', duration: 4000 },
    { action: 'wait', thought: '✨ Keeping it clean!', duration: 4000 },
    { action: 'walk', target: { x: 34, z: 5 }, thought: '🍸 Mixing a cocktail...', duration: 4000 },
    { action: 'wait', thought: '🧊 Shake, shake, pour!', duration: 5000 },
    { action: 'walk', target: 'kitchen', thought: '👨‍🍳 Checking the kitchen...', duration: 4000 },
    { action: 'wait', thought: '🍕 Food is looking good!', duration: 3000 },
    { action: 'walk', target: 'food_counter', thought: '🍽️ Bringing food to counter...', duration: 4000 },
    { action: 'wait', thought: '🔔 Order up!', duration: 3000 },
    { action: 'walk', target: { x: 28, z: 3 }, thought: '📦 Restocking bottles...', duration: 4000 },
    { action: 'wait', thought: '🥃 Top shelf refreshed!', duration: 4000 },
    { action: 'walk', target: 'fish_tank', thought: '🐟 Quick check on the fishies...', duration: 3000 },
    { action: 'wait', thought: '🐠 They look happy!', duration: 3000 },
    { action: 'walk', target: { x: 25, z: 5 }, thought: '🍺 Another round coming up!', duration: 3000 },
    { action: 'wait', thought: '🗣️ What can I get you?', duration: 5000 },
    { action: 'walk', target: { x: 36, z: 5 }, thought: '🧽 Washing glasses...', duration: 4000 },
    { action: 'wait', thought: '🫧 Sparkling clean!', duration: 4000 },
  ],

  bouncer: [
    { action: 'walk', target: { x: 22, z: 38 }, thought: '🚪 Watching the door...', duration: 3000 },
    { action: 'wait', thought: '👀 Checking IDs...', duration: 8000 },
    { action: 'wait', thought: '✅ You\'re good, come on in.', duration: 5000 },
    { action: 'walk', target: { x: 20, z: 36 }, thought: '🚶 Walking the floor...', duration: 4000 },
    { action: 'wait', thought: '👁️ Everything looks calm...', duration: 6000 },
    { action: 'walk', target: 'toilet', thought: '🚻 Checking the toilets...', duration: 4000 },
    { action: 'wait', thought: '🧹 Toilets look alright.', duration: 3000 },
    { action: 'walk', target: { x: 24, z: 38 }, thought: '🚪 Back to the door.', duration: 4000 },
    { action: 'wait', thought: '💪 Standing guard.', duration: 7000 },
    { action: 'walk', target: 'pool_table', thought: '🎱 Checking the pool area...', duration: 4000 },
    { action: 'wait', thought: '👀 All good over here.', duration: 4000 },
    { action: 'walk', target: { x: 22, z: 38 }, thought: '👋 Welcome to Publet!', duration: 3000 },
    { action: 'wait', thought: '🛡️ Keeping the peace.', duration: 6000 },
  ],

  dj: [
    { action: 'walk', target: 'microphone', thought: '🎤 Testing, 1, 2, 3...', duration: 3000 },
    { action: 'wait', thought: '🎶 Good evening everyone!!', duration: 4000 },
    { action: 'walk', target: { x: 8, z: 4 }, thought: '🎧 Heading to the decks!', duration: 3000 },
    { action: 'wait', thought: '🎵 Dropping the bass...', duration: 7000 },
    { action: 'wait', thought: '🔊 This crowd is feeling it!', duration: 5000 },
    { action: 'walk', target: { x: 6, z: 5 }, thought: '🔈 Checking the speakers...', duration: 3000 },
    { action: 'wait', thought: '🔈 Sound check... perfect!', duration: 4000 },
    { action: 'walk', target: { x: 8, z: 4 }, thought: '🎶 Time for the next track...', duration: 3000 },
    { action: 'wait', thought: '🎚️ Mixing into the next song...', duration: 6000 },
    { action: 'wait', thought: '🔥 THE CROWD GOES WILD!', duration: 5000 },
    { action: 'walk', target: 'bar', thought: '🥤 Quick water break...', duration: 4000 },
    { action: 'wait', thought: '💧 Staying hydrated!', duration: 3000 },
    { action: 'walk', target: { x: 8, z: 4 }, thought: '🎧 Back behind the decks!', duration: 3000 },
    { action: 'wait', thought: '🎵 Smooth transition...', duration: 6000 },
  ],

  waitress: [
    { action: 'walk', target: 'table_1', thought: '📝 Taking orders!', duration: 3000 },
    { action: 'wait', thought: '🗣️ Two pints and nachos?', duration: 4000 },
    { action: 'walk', target: 'food_counter', thought: '🍽️ Picking up food order...', duration: 4000 },
    { action: 'wait', thought: '🍔 Got the burgers!', duration: 3000 },
    { action: 'walk', target: 'table_3', thought: '🍽️ Delivering food!', duration: 3000 },
    { action: 'wait', thought: '😊 Enjoy your meal!', duration: 4000 },
    { action: 'walk', target: { x: 30, z: 10 }, thought: '🍺 Picking up drinks...', duration: 4000 },
    { action: 'wait', thought: '🍻 Got the order!', duration: 3000 },
    { action: 'walk', target: 'table_1', thought: '🍺 Here you go!', duration: 4000 },
    { action: 'wait', thought: '🍽️ Enjoy your drinks!', duration: 3000 },
    { action: 'walk', target: 'table_5', thought: '🧹 Clearing this table...', duration: 3000 },
    { action: 'wait', thought: '🫧 Nice and clean!', duration: 3000 },
    { action: 'walk', target: 'booth_1', thought: '📝 Booth needs checking...', duration: 3000 },
    { action: 'wait', thought: '🗣️ Can I get you anything?', duration: 4000 },
    { action: 'walk', target: 'toilet', thought: '🚻 Quick bathroom break...', duration: 4000 },
    { action: 'wait', thought: '🧼 Washing hands!', duration: 3000 },
    { action: 'walk', target: 'table_4', thought: '🍸 Delivering drinks!', duration: 4000 },
    { action: 'wait', thought: '✨ Cheers!', duration: 3000 },
  ],

  customer_slots: [
    { action: 'walk', target: { x: 40, z: 31 }, thought: '🎰 My lucky machine!', duration: 3000 },
    { action: 'wait', thought: '🎰 Come on, big money!', duration: 6000 },
    { action: 'wait', thought: '😤 So close!', duration: 4000 },
    { action: 'wait', thought: '🎰 One more spin!', duration: 5000 },
    { action: 'walk', target: 'toilet', thought: '🚻 Need a bathroom break...', duration: 4000 },
    { action: 'wait', thought: '🧼 Back in a sec...', duration: 4000 },
    { action: 'walk', target: { x: 40, z: 33 }, thought: '🎰 Trying this one!', duration: 3000 },
    { action: 'wait', thought: '🎰 SPIN SPIN SPIN!', duration: 6000 },
    { action: 'wait', thought: '🤑 I WON! Drinks on me!', duration: 5000 },
    { action: 'walk', target: 'bar', thought: '🍺 Celebrating at the bar!', duration: 5000 },
    { action: 'wait', thought: '🍺 Cheers to lady luck!', duration: 5000 },
    { action: 'walk', target: 'food_counter', thought: '🍔 Grabbing a bite...', duration: 4000 },
    { action: 'wait', thought: '🌭 Mmm, hot dog!', duration: 4000 },
    { action: 'walk', target: { x: 40, z: 32 }, thought: '🎰 Back to the machines!', duration: 4000 },
    { action: 'wait', thought: '🎰 Just one more...', duration: 6000 },
  ],

  customer_tv: [
    { action: 'walk', target: 'sofa', thought: '📺 Game time!', duration: 3000 },
    { action: 'wait', thought: '📺 Come on, COME ON!!', duration: 6000 },
    { action: 'wait', thought: '⚽ GOOOOAL!! YES!!', duration: 5000 },
    { action: 'walk', target: 'food_counter', thought: '🍿 Need snacks!', duration: 4000 },
    { action: 'wait', thought: '🍕 One pizza please!', duration: 4000 },
    { action: 'walk', target: 'sofa', thought: '📺 Back to the game!', duration: 4000 },
    { action: 'wait', thought: '😰 That was a close one!', duration: 5000 },
    { action: 'walk', target: 'bar', thought: '🍺 Halftime, need a refill!', duration: 5000 },
    { action: 'wait', thought: '🍺 Another IPA please!', duration: 4000 },
    { action: 'walk', target: 'toilet', thought: '🚻 Quick bathroom break...', duration: 4000 },
    { action: 'wait', thought: '🧼 Gotta hurry, halftime!', duration: 3000 },
    { action: 'walk', target: 'sofa', thought: '📺 Game back on!', duration: 4000 },
    { action: 'wait', thought: '📺 What a save!!', duration: 5000 },
    { action: 'wait', thought: '🏆 WE WON! INCREDIBLE!', duration: 6000 },
  ],

  customer_dancer: [
    { action: 'walk', target: { x: 10, z: 12 }, thought: '🕺 Feeling this beat!', duration: 3000 },
    { action: 'wait', thought: '💃 Dance dance dance!', duration: 6000 },
    { action: 'walk', target: { x: 14, z: 11 }, thought: '🕺 Watch this move!', duration: 3000 },
    { action: 'wait', thought: '🔥 On fire tonight!', duration: 5000 },
    { action: 'walk', target: 'dartboard', thought: '🎯 Darts break!', duration: 4000 },
    { action: 'wait', thought: '🎯 Bullseye! ...almost.', duration: 5000 },
    { action: 'walk', target: 'bar', thought: '🥤 Quick drink break...', duration: 5000 },
    { action: 'wait', thought: '💧 Hydration break!', duration: 4000 },
    { action: 'walk', target: 'pool_table', thought: '🎱 Quick game of pool?', duration: 4000 },
    { action: 'wait', thought: '🎱 Nice shot!', duration: 5000 },
    { action: 'walk', target: { x: 10, z: 12 }, thought: '🕺 Back to the floor!', duration: 4000 },
    { action: 'wait', thought: '🎶 This is MY song!', duration: 6000 },
    { action: 'walk', target: { x: 8, z: 11 }, thought: '🕺 Closer to the stage!', duration: 3000 },
    { action: 'wait', thought: '🙌 Hands up!!', duration: 5000 },
  ],

  customer_regular: [
    { action: 'walk', target: { x: 37, z: 10 }, thought: '🍺 My usual spot...', duration: 3000 },
    { action: 'wait', thought: '🍻 Ahhh, that hits the spot.', duration: 7000 },
    { action: 'wait', thought: '🤔 Back in my day...', duration: 6000 },
    { action: 'walk', target: 'fish_tank', thought: '🐟 Let me say hi to the fish...', duration: 4000 },
    { action: 'wait', thought: '🐠 I named that one Fred.', duration: 5000 },
    { action: 'walk', target: { x: 37, z: 10 }, thought: '🪑 Back to my stool.', duration: 3000 },
    { action: 'wait', thought: '🍺 Another pint, Mike!', duration: 5000 },
    { action: 'wait', thought: '📖 Did I ever tell you about...', duration: 5000 },
    { action: 'walk', target: 'toilet', thought: '🚻 Nature calls...', duration: 4000 },
    { action: 'wait', thought: '🧼 Washing up.', duration: 4000 },
    { action: 'walk', target: 'food_counter', thought: '🍽️ Maybe a little snack...', duration: 4000 },
    { action: 'wait', thought: '🥜 Just some peanuts please.', duration: 4000 },
    { action: 'walk', target: { x: 37, z: 10 }, thought: '🪑 My trusty stool.', duration: 3000 },
    { action: 'wait', thought: '🍻 Cheers to 30 years!', duration: 6000 },
    { action: 'wait', thought: '💤 ...just resting my eyes...', duration: 7000 },
    { action: 'walk', target: 'pool_table', thought: '🎱 Fancy a game?', duration: 4000 },
    { action: 'wait', thought: '🎱 Still got it!', duration: 5000 },
  ],
}

const botBehaviorState = {}

function getRoutineForBot(bot) {
  return ROLE_ROUTINES[bot.role] || ROLE_ROUTINES.customer_regular
}

function resolveTarget(target) {
  if (typeof target === 'string') {
    const loc = RESTAURANT_LOCATIONS[target]
    return loc ? [loc.x + Math.random() * 1.5, 1, loc.z + Math.random() * 1.5] : null
  }
  if (target && typeof target === 'object') {
    return [target.x + Math.random() * 0.5, 1, target.z + Math.random() * 0.5]
  }
  return null
}

function behaviorTick() {
  const bots = useBotStore.getState().bots

  bots.forEach(bot => {
    if (useBotStore.getState().selectedBotId === bot.id && bot.state === 'talking') return

    if (!botBehaviorState[bot.id]) {
      botBehaviorState[bot.id] = {
        routineIndex: 0,
        waitUntil: Date.now() + 2000 + Math.random() * 3000,
        routine: getRoutineForBot(bot),
      }
    }

    const state = botBehaviorState[bot.id]
    const now = Date.now()

    if (now < state.waitUntil) return
    if (bot.isMoving) return

    const step = state.routine[state.routineIndex]
    if (!step) {
      state.routineIndex = 0
      return
    }

    if (step.action === 'walk') {
      const target = resolveTarget(step.target)
      if (target) {
        useBotStore.getState().setBotTarget(bot.id, target)
      }
      if (step.thought) {
        useBotStore.getState().setThoughtBubble(bot.id, step.thought, step.duration || 3000)
      }
      state.routineIndex = (state.routineIndex + 1) % state.routine.length
      state.waitUntil = now + (step.duration || 3000)
    } else if (step.action === 'wait') {
      if (step.thought) {
        useBotStore.getState().setThoughtBubble(bot.id, step.thought, Math.min(step.duration || 4000, 5000))
      }
      state.routineIndex = (state.routineIndex + 1) % state.routine.length
      state.waitUntil = now + (step.duration || 5000)
    }
  })

  checkBotEncounters()
}

let lastConversationTime = 0
const CONVERSATION_COOLDOWN = 20000

function checkBotEncounters() {
  if (Date.now() - lastConversationTime < CONVERSATION_COOLDOWN) return
  const bots = useBotStore.getState().bots

  for (let i = 0; i < bots.length; i++) {
    for (let j = i + 1; j < bots.length; j++) {
      const b1 = bots[i]
      const b2 = bots[j]
      if (b1.isTalking || b2.isTalking) continue
      const dx = b1.position[0] - b2.position[0]
      const dz = b1.position[2] - b2.position[2]
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        lastConversationTime = Date.now()
        useBotStore.getState().setBotState(b1.id, 'talking')
        useBotStore.getState().setBotState(b2.id, 'talking')
        generateBotConversation(b1.id, b2.id)
        setTimeout(() => {
          useBotStore.getState().setBotState(b1.id, 'idle')
          useBotStore.getState().setBotState(b2.id, 'idle')
        }, 12000)
        return
      }
    }
  }
}

export function startMissionEngine() {
  behaviorInterval = setInterval(behaviorTick, 1500)
}

export function stopMissionEngine() {
  if (behaviorInterval) clearInterval(behaviorInterval)
}
