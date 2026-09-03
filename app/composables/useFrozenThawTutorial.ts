const STORAGE_KEY = 'jagra:frozen-thaw-tutorial-seen'

export function useFrozenThawTutorial() {
  function hasSeenTutorial() {
    if (!import.meta.client) return true
    return localStorage.getItem(STORAGE_KEY) === '1'
  }

  function markTutorialSeen() {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return { hasSeenTutorial, markTutorialSeen }
}
