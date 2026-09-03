const STORAGE_KEY = 'jagra:revised-today-filter-tutorial-seen'

export function useRevisedTodayFilterTutorial() {
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
