import { create } from 'zustand'
import { BOT_DEFINITIONS, RESTAURANT_LOCATIONS } from '../utils/constants'

// Place bots at their stations
function getInitialPosition(bot) {
  const loc = RESTAURANT_LOCATIONS[bot.station] || RESTAURANT_LOCATIONS['entrance']
  return [loc.x + Math.random() * 2, 1, loc.z + Math.random() * 2]
}

const useBotStore = create((set, get) => ({
  bots: BOT_DEFINITIONS.map((def) => ({
    ...def,
    position: getInitialPosition(def),
    targetPosition: null,
    isMoving: false,
    moveSpeed: 2.5,
    rotation: 0,
    state: 'idle',
    currentAction: null,
    currentMission: null,
    missionSteps: [],
    missionStepIndex: 0,
    lastMissionTime: 0,
    isTalking: false,
    speechBubble: null,
    speechBubbleTimer: null,
    talkingTo: null,
    thoughtBubble: null,
    memories: [],
    relationships: {},
  })),
  
  selectedBotId: null,
  
  selectBot: (id) => set({ selectedBotId: id }),
  deselectBot: () => set({ selectedBotId: null }),
  
  getSelectedBot: () => {
    const state = get()
    return state.bots.find(b => b.id === state.selectedBotId)
  },
  
  updateBotPosition: (id, position) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, position: [...position] } : b
      )
    }))
  },
  
  setBotTarget: (id, target) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, targetPosition: target, isMoving: true, state: 'walking' } : b
      )
    }))
  },
  
  setBotState: (id, newState, data = {}) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, state: newState, ...data } : b
      )
    }))
  },
  
  setSpeechBubble: (id, text, duration = 5000) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, speechBubble: text, isTalking: true } : b
      )
    }))
    setTimeout(() => {
      set(state => ({
        bots: state.bots.map(b => 
          b.id === id ? { ...b, speechBubble: null, isTalking: false } : b
        )
      }))
    }, duration)
  },
  
  setThoughtBubble: (id, text, duration = 4000) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, thoughtBubble: text } : b
      )
    }))
    setTimeout(() => {
      set(state => ({
        bots: state.bots.map(b => 
          b.id === id ? { ...b, thoughtBubble: null } : b
        )
      }))
    }, duration)
  },
  
  setMission: (id, mission) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { 
          ...b, 
          currentMission: mission,
          missionSteps: mission.steps || [],
          missionStepIndex: 0,
          lastMissionTime: Date.now(),
        } : b
      )
    }))
  },
  
  advanceMissionStep: (id) => {
    set(state => ({
      bots: state.bots.map(b => {
        if (b.id !== id) return b
        const nextIdx = b.missionStepIndex + 1
        if (nextIdx >= b.missionSteps.length) {
          return { 
            ...b, 
            currentMission: null,
            missionSteps: [],
            missionStepIndex: 0,
            state: 'idle',
            memories: [...b.memories, `Completed: ${b.currentMission?.goal}`].slice(-20),
          }
        }
        return { ...b, missionStepIndex: nextIdx }
      })
    }))
  },
  
  addMemory: (id, memory) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, memories: [...b.memories, memory].slice(-20) } : b
      )
    }))
  },
  
  setBotRotation: (id, rotation) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, rotation } : b
      )
    }))
  },
  
  stopBot: (id) => {
    set(state => ({
      bots: state.bots.map(b => 
        b.id === id ? { ...b, isMoving: false, targetPosition: null, state: 'idle' } : b
      )
    }))
  },
}))

export default useBotStore
