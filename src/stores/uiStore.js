import { create } from 'zustand'

const useUIStore = create((set, get) => ({
  // Chat
  chatMessages: [
    { sender: 'system', content: 'Welcome to Botlets.io! Click on any bot to interact with them.', time: Date.now() },
  ],
  chatInput: '',
  
  // Recording
  isRecording: false,
  
  // Toasts
  toasts: [],
  
  // Loading
  isLoading: true,
  loadingText: 'Generating world...',
  
  // Simulation speed
  simSpeed: 1, // 1x, 2x, 3x
  
  // Camera
  cameraTarget: [0, 0, 0],
  
  setChatInput: (val) => set({ chatInput: val }),
  
  addChatMessage: (sender, content, botId = null) => {
    set(state => ({
      chatMessages: [...state.chatMessages, { 
        sender, 
        content, 
        botId,
        time: Date.now() 
      }].slice(-50) // Keep last 50 messages
    }))
  },
  
  clearChat: () => set({ chatMessages: [] }),
  
  setRecording: (val) => set({ isRecording: val }),
  
  addToast: (message, type = 'info') => {
    const id = Date.now()
    set(state => ({
      toasts: [...state.toasts, { id, message, type }]
    }))
    // Auto-remove after 4s
    setTimeout(() => {
      set(state => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    }, 4000)
  },
  
  setLoading: (val, text = '') => set({ isLoading: val, loadingText: text }),
  
  cycleSpeed: () => {
    set(state => ({
      simSpeed: state.simSpeed >= 3 ? 1 : state.simSpeed + 1
    }))
  },
  
  setCameraTarget: (target) => set({ cameraTarget: target }),
  
  // Navigator pad
  cameraMove: null, // { x, z } direction
  cameraZoom: 0,    // -1 zoom out, 0 none, 1 zoom in
  cameraRotate: 0,  // -1 left, 0 none, 1 right
  setCameraMove: (dir) => set({ cameraMove: dir }),
  setCameraZoom: (val) => set({ cameraZoom: val }),
  setCameraRotate: (val) => set({ cameraRotate: val }),
}))

export default useUIStore
