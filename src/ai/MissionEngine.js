// Mission Engine — Pub role-based behavior loops
// All walk targets are verified to be in WALKABLE areas
import useBotStore from '../stores/botStore'
import useUIStore from '../stores/uiStore'
import { generateBotConversation, generateAutonomousThought } from './BotBrain'
import { RESTAURANT_LOCATIONS } from '../utils/constants'

let behaviorInterval = null
let autonomousThoughtInterval = null

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
    { action: 'walk', target: 'pub_entrance', thought: '🚪 Watching the door...', duration: 3000 },
    { action: 'wait', thought: '👀 Checking IDs...', duration: 8000 },
    { action: 'wait', thought: '✅ You\'re good, come on in.', duration: 5000 },
    { action: 'walk', target: { x: 20, z: 36 }, thought: '🚶 Walking the floor...', duration: 4000 },
    { action: 'wait', thought: '👁️ Everything looks calm...', duration: 6000 },
    { action: 'walk', target: 'outside_toilet', thought: '🚻 Checking the outside toilets...', duration: 5000 },
    { action: 'wait', thought: '🧹 Toilets look alright.', duration: 3000 },
    { action: 'walk', target: 'garden', thought: '🌿 Quick patrol of the garden...', duration: 5000 },
    { action: 'wait', thought: '👀 All quiet out here.', duration: 4000 },
    { action: 'walk', target: 'pub_entrance', thought: '🚪 Back to the door.', duration: 5000 },
    { action: 'wait', thought: '💪 Standing guard.', duration: 7000 },
    { action: 'walk', target: 'pool_table', thought: '🎱 Checking the pool area...', duration: 4000 },
    { action: 'wait', thought: '👀 All good over here.', duration: 4000 },
    { action: 'walk', target: 'pub_entrance', thought: '👋 Welcome to the pub!', duration: 3000 },
    { action: 'wait', thought: '🛡️ Keeping the peace.', duration: 6000 },
    { action: 'walk', target: 'pond_bench', thought: '🌳 Checking by the pond...', duration: 5000 },
    { action: 'wait', thought: '🦆 Ducks are behaving.', duration: 4000 },
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
    // Off-stage break: bar
    { action: 'walk', target: 'bar', thought: '🥤 Quick water break at the bar...', duration: 5000 },
    { action: 'wait', thought: '💧 Staying hydrated!', duration: 4000 },
    { action: 'wait', thought: '🗣️ Hey Mike, great crowd tonight!', duration: 4000 },
    // Off-stage: mingle on dancefloor
    { action: 'walk', target: { x: 12, z: 12 }, thought: '🕺 Joining the crowd for a bit!', duration: 4000 },
    { action: 'wait', thought: '💃 Love this energy!', duration: 5000 },
    // Off-stage: pool table
    { action: 'walk', target: 'pool_table', thought: '🎱 Quick game between sets!', duration: 5000 },
    { action: 'wait', thought: '🎱 Nice shot!', duration: 4000 },
    // Off-stage: toilet
    { action: 'walk', target: 'toilet', thought: '🚻 Quick break...', duration: 4000 },
    { action: 'wait', thought: '🧼 Back in a moment!', duration: 3000 },
    // Back to stage
    { action: 'walk', target: { x: 8, z: 4 }, thought: '🎧 Back behind the decks!', duration: 3000 },
    { action: 'wait', thought: '🎵 Smooth transition...', duration: 6000 },
    { action: 'wait', thought: '🎶 Letting this one ride...', duration: 5000 },
    { action: 'walk', target: 'microphone', thought: '🎤 Shout out to everyone!', duration: 3000 },
    { action: 'wait', thought: '🎤 Make some NOISE!!', duration: 4000 },
    { action: 'walk', target: { x: 8, z: 4 }, thought: '🎧 One more banger!', duration: 3000 },
    { action: 'wait', thought: '🎵 This is the one...', duration: 6000 },
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
    { action: 'walk', target: 'outside_toilet', thought: '🚻 Off to the outside loo...', duration: 5000 },
    { action: 'wait', thought: '🧼 Washing up.', duration: 4000 },
    { action: 'walk', target: 'garden', thought: '🌿 Fresh air break...', duration: 5000 },
    { action: 'wait', thought: '🌳 Lovely evening!', duration: 5000 },
    { action: 'walk', target: 'pond_bench', thought: '🦆 Sit by the pond...', duration: 5000 },
    { action: 'wait', thought: '😌 Peace and quiet.', duration: 5000 },
    { action: 'walk', target: 'pub_entrance', thought: '🚶 Heading back inside...', duration: 5000 },
    { action: 'walk', target: 'food_counter', thought: '🍽️ Maybe a little snack...', duration: 4000 },
    { action: 'wait', thought: '🥜 Just some peanuts please.', duration: 4000 },
    { action: 'walk', target: { x: 37, z: 10 }, thought: '🪑 My trusty stool.', duration: 3000 },
    { action: 'wait', thought: '🍻 Cheers to 30 years!', duration: 6000 },
    { action: 'wait', thought: '💤 ...just resting my eyes...', duration: 7000 },
    { action: 'walk', target: 'pool_table', thought: '🎱 Fancy a game?', duration: 4000 },
    { action: 'wait', thought: '🎱 Still got it!', duration: 5000 },
  ],

  greeter: [
    { action: 'walk', target: 'pub_entrance', thought: '👋 Welcome, welcome!', duration: 4000 },
    { action: 'wait', thought: '😊 Come on in, great vibes tonight!', duration: 5000 },
    { action: 'wait', thought: '🎉 Best pub in town!', duration: 4000 },
    { action: 'walk', target: 'garden', thought: '🌿 Checking the garden area...', duration: 5000 },
    { action: 'wait', thought: '👋 Hey there, having a good evening?', duration: 4000 },
    { action: 'walk', target: 'pond_bench', thought: '🦆 Nice spot by the pond...', duration: 5000 },
    { action: 'wait', thought: '😄 Beautiful evening, innit?', duration: 4000 },
    { action: 'walk', target: 'pub_entrance', thought: '🚪 Back to the door...', duration: 5000 },
    { action: 'wait', thought: '👋 Welcome! Table for two?', duration: 5000 },
    { action: 'walk', target: 'picnic_table', thought: '🏕️ Checking the picnic area...', duration: 5000 },
    { action: 'wait', thought: '✨ Everything looking lovely!', duration: 4000 },
    { action: 'walk', target: 'fountain', thought: '⛲ By the fountain...', duration: 5000 },
    { action: 'wait', thought: '🎶 *humming happily*', duration: 4000 },
  ],

  cleaner: [
    { action: 'walk', target: 'entrance', thought: '🧹 Sweeping the entrance...', duration: 4000 },
    { action: 'wait', thought: '✨ *sweep sweep sweep*', duration: 5000 },
    { action: 'walk', target: 'bar', thought: '🧹 Behind the bar needs a clean...', duration: 4000 },
    { action: 'wait', thought: '🎵 *humming while sweeping*', duration: 5000 },
    { action: 'walk', target: 'dining', thought: '🧹 Tables need clearing...', duration: 4000 },
    { action: 'wait', thought: '🍽️ *wipes down tables*', duration: 5000 },
    { action: 'walk', target: 'toilet', thought: '🧹 Toilets time... yay...', duration: 4000 },
    { action: 'wait', thought: '🧼 *scrub scrub*', duration: 5000 },
    { action: 'walk', target: 'dance_floor', thought: '🧹 Dance floor is sticky...', duration: 4000 },
    { action: 'wait', thought: '💦 *mopping intensifies*', duration: 5000 },
    { action: 'walk', target: 'pub_entrance', thought: '🧹 Sweeping the front...', duration: 4000 },
    { action: 'wait', thought: '🍃 *sweeps leaves*', duration: 4000 },
    { action: 'walk', target: 'outside_toilet', thought: '🧹 Outside loos next...', duration: 5000 },
    { action: 'wait', thought: '😤 Who made this mess?!', duration: 4000 },
    { action: 'walk', target: 'kitchen', thought: '🧹 Kitchen floors...', duration: 4000 },
    { action: 'wait', thought: '✨ Spotless!', duration: 4000 },
  ],

  policeman: [
    { action: 'walk', target: 'outside', thought: '👮 Patrolling the area...', duration: 5000 },
    { action: 'wait', thought: '🔍 Everything looks orderly.', duration: 5000 },
    { action: 'walk', target: 'garden', thought: '👮 Checking the garden...', duration: 5000 },
    { action: 'wait', thought: '📋 All clear here.', duration: 4000 },
    { action: 'walk', target: 'pond_bench', thought: '👮 By the pond area...', duration: 5000 },
    { action: 'wait', thought: '🦆 Even the ducks are behaving.', duration: 5000 },
    { action: 'walk', target: 'pub_entrance', thought: '👮 Checking the entrance...', duration: 5000 },
    { action: 'wait', thought: '✅ No trouble tonight.', duration: 4000 },
    { action: 'walk', target: 'picnic_table', thought: '👮 Scanning the picnic area...', duration: 5000 },
    { action: 'wait', thought: '🚔 All quiet on this beat.', duration: 5000 },
    { action: 'walk', target: 'outside_toilet', thought: '👮 Quick check on the facilities...', duration: 5000 },
    { action: 'wait', thought: '👀 Nothing suspicious.', duration: 4000 },
    { action: 'walk', target: 'fountain', thought: '👮 Back to the fountain...', duration: 5000 },
    { action: 'wait', thought: '☕ Could murder a cuppa right now.', duration: 5000 },
  ],
}

const botBehaviorState = {}

function getRoutineForBot(bot) {
  return ROLE_ROUTINES[bot.role] || ROLE_ROUTINES.customer_regular
}

function resolveTarget(target) {
  if (typeof target === 'string') {
    const loc = RESTAURANT_LOCATIONS[target]
    return loc ? [loc.x + (Math.random() - 0.5) * 3, 1, loc.z + (Math.random() - 0.5) * 3] : null
  }
  if (target && typeof target === 'object') {
    return [target.x + (Math.random() - 0.5) * 2, 1, target.z + (Math.random() - 0.5) * 2]
  }
  return null
}

// Location awareness — determine what zone a bot is in based on position
function getLocationZone(pos) {
  if (!pos) return 'unknown'
  const x = pos[0], z = pos[2]
  
  // Outdoor areas
  if (z > 40) {
    if (x < 10) return 'outside_toilet'
    if (x > 25) return 'pond_area'
    return 'garden'
  }
  if (z > 37) return 'pub_entrance'
  
  // Indoor areas
  if (x < 6 && z > 30) return 'toilets'
  if (x < 6 && z > 16) return 'booths'
  if (x < 15 && z < 10) return 'stage'
  if (x < 15 && z >= 10 && z < 16) return 'dance_floor'
  if (x < 15 && z >= 16 && z < 32) return 'pool_area'
  if (x >= 20 && x <= 26 && z >= 2 && z <= 10) return 'bar'
  if (x > 26 && x <= 40 && z >= 2 && z <= 10) return 'bar'
  if (x >= 35 && z >= 28 && z <= 36) return 'slots'
  if (x >= 35 && z >= 18 && z < 28) return 'tv_area'
  if (x >= 40 && z < 10) return 'kitchen'
  if (x >= 15 && x <= 28 && z >= 16 && z <= 34) return 'dining'
  
  return 'pub'
}

// Mood system — bots have moods that affect their behavior
const MOODS = ['happy', 'excited', 'focused', 'relaxed', 'tired', 'bored']

function updateBotMood(bot, zone) {
  const state = botBehaviorState[bot.id]
  if (!state) return
  
  // Update mood based on zone and role
  const now = Date.now()
  if (state.lastMoodUpdate && now - state.lastMoodUpdate < 30000) return
  state.lastMoodUpdate = now
  
  const moodMap = {
    bartender: { bar: 'focused', kitchen: 'focused', dance_floor: 'relaxed' },
    bouncer: { pub_entrance: 'focused', garden: 'relaxed', toilets: 'bored' },
    dj: { stage: 'excited', dance_floor: 'excited', bar: 'relaxed' },
    waitress: { dining: 'focused', bar: 'focused', toilets: 'tired' },
    customer_slots: { slots: 'excited', bar: 'happy', dining: 'relaxed' },
    customer_tv: { tv_area: 'excited', bar: 'happy', dance_floor: 'bored' },
    customer_dancer: { dance_floor: 'excited', stage: 'excited', bar: 'relaxed' },
    customer_regular: { bar: 'happy', garden: 'relaxed', pool_area: 'excited' },
    greeter: { pub_entrance: 'happy', garden: 'happy', bar: 'relaxed' },
    cleaner: { toilets: 'focused', kitchen: 'focused', dance_floor: 'tired' },
    policeman: { pub_entrance: 'focused', garden: 'relaxed', pond_area: 'relaxed' },
  }
  
  const roleMoods = moodMap[bot.role]
  state.mood = roleMoods?.[zone] || MOODS[Math.floor(Math.random() * MOODS.length)]
  state.zone = zone
}

function behaviorTick() {
  const bots = useBotStore.getState().bots

  bots.forEach(bot => {
    if (useBotStore.getState().selectedBotId === bot.id && bot.state === 'talking') return

    if (!botBehaviorState[bot.id]) {
      const routine = getRoutineForBot(bot)
      botBehaviorState[bot.id] = {
        routineIndex: Math.floor(Math.random() * routine.length),
        waitUntil: Date.now() + 2000 + Math.random() * 6000,
        routine,
        mood: 'happy',
        zone: 'pub',
        lastMoodUpdate: 0,
      }
    }

    // Update location awareness and mood
    const zone = getLocationZone(bot.position)
    updateBotMood(bot, zone)

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
      state.waitUntil = now + (step.duration || 3000) + Math.random() * 1000
    } else if (step.action === 'wait') {
      if (step.thought) {
        useBotStore.getState().setThoughtBubble(bot.id, step.thought, Math.min(step.duration || 4000, 5000))
      }
      state.routineIndex = (state.routineIndex + 1) % state.routine.length
      state.waitUntil = now + (step.duration || 5000) + Math.random() * 1000
    }
  })

  checkBotEncounters()
}

let lastConversationTime = 0
const CONVERSATION_COOLDOWN = 12000

function checkBotEncounters() {
  if (Date.now() - lastConversationTime < CONVERSATION_COOLDOWN) return
  const bots = useBotStore.getState().bots

  for (let i = 0; i < bots.length; i++) {
    for (let j = i + 1; j < bots.length; j++) {
      const b1 = bots[i]
      const b2 = bots[j]
      if (b1.isTalking || b2.isTalking) continue
      if (b1.state === 'talking' || b2.state === 'talking') continue
      const dx = b1.position[0] - b2.position[0]
      const dz = b1.position[2] - b2.position[2]
      if (Math.sqrt(dx * dx + dz * dz) < 3) {
        lastConversationTime = Date.now()

        // Stop both bots
        useBotStore.getState().stopBot(b1.id)
        useBotStore.getState().stopBot(b2.id)

        // Face each other
        const angle1 = Math.atan2(dx, dz)
        useBotStore.getState().setBotRotation(b1.id, angle1 + Math.PI)
        useBotStore.getState().setBotRotation(b2.id, angle1)

        // Set talking state
        useBotStore.getState().setBotState(b1.id, 'talking')
        useBotStore.getState().setBotState(b2.id, 'talking')

        // Show greeting based on location
        const encounterZone = getLocationZone(b1.position)
        const zoneGreetings = {
          bar: [`🍺 ${b2.name}! Let me buy you a drink!`, `🍻 ${b1.name}! What're you having?`],
          dance_floor: [`🕺 ${b2.name}! You've got moves!`, `💃 ${b1.name}! This is our song!`],
          pool_area: [`🎱 ${b2.name}! Fancy a game?`, `🎱 ${b1.name}! I'll break!`],
          slots: [`🎰 ${b2.name}! Any luck?`, `🤑 ${b1.name}! I'm on a streak!`],
          tv_area: [`📺 ${b2.name}! You watching the game?`, `⚽ ${b1.name}! Pull up a seat!`],
          garden: [`🌿 ${b2.name}! Nice evening!`, `🌳 ${b1.name}! Getting some air?`],
          kitchen: [`👨‍🍳 ${b2.name}! Smells amazing!`, `🍕 ${b1.name}! Want a taste?`],
          pub_entrance: [`👋 ${b2.name}! Coming or going?`, `🚪 ${b1.name}! Just got here!`],
        }
        const greetings = zoneGreetings[encounterZone] || [`👋 Hey ${b2.name}!`, `👋 Oh hi ${b1.name}!`]
        useBotStore.getState().setThoughtBubble(b1.id, greetings[0], 3000)
        useBotStore.getState().setThoughtBubble(b2.id, greetings[1], 3000)

        generateBotConversation(b1.id, b2.id, encounterZone)
        setTimeout(() => {
          useBotStore.getState().setBotState(b1.id, 'idle')
          useBotStore.getState().setBotState(b2.id, 'idle')
        }, 10000)
        return
      }
    }
  }
}

export function startMissionEngine() {
  behaviorInterval = setInterval(behaviorTick, 1000)
  
  // Autonomous thoughts — every 20s a random bot has an AI-generated thought
  autonomousThoughtInterval = setInterval(() => {
    const bots = useBotStore.getState().bots
    const idleBots = bots.filter(b => b.state !== 'talking' && !b.isTalking && !b.thoughtBubble)
    if (idleBots.length === 0) return
    
    const bot = idleBots[Math.floor(Math.random() * idleBots.length)]
    const state = botBehaviorState[bot.id]
    const zone = getLocationZone(bot.position)
    const mood = state?.mood || 'happy'
    
    generateAutonomousThought(bot, zone, mood)
  }, 20000)
}

export function stopMissionEngine() {
  if (behaviorInterval) clearInterval(behaviorInterval)
  if (autonomousThoughtInterval) clearInterval(autonomousThoughtInterval)
}
