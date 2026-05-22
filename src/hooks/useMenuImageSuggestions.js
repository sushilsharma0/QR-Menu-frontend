import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'

export const IMAGE_SUGGESTION_LIMIT = 6

const uniqueImages = (images) => {
  const seen = new Set()
  return images.filter((image) => {
    const key = String(image.url || image.thumbnail || '').split('?')[0]
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function useMenuImageSuggestions(query) {
  const cleanQuery = String(query || '').trim()
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [failedIds, setFailedIds] = useState([])

  const markImageFailed = useCallback((id) => {
    setFailedIds((current) => (current.includes(id) ? current : [...current, id]))
  }, [])

  useEffect(() => {
    if (cleanQuery.length < 3) {
      setSuggestions([])
      setFailedIds([])
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const res = await api.get('/restaurant/menu/image-suggestions', {
          params: { q: cleanQuery },
          signal: controller.signal,
        })
        const results = Array.isArray(res.data?.data) ? res.data.data : []
        setFailedIds([])
        setSuggestions(uniqueImages(results
          .map((image) => ({
            id: image.id || image.url || image.thumbnail,
            title: image.title || cleanQuery,
            thumbnail: image.thumbnail || image.url,
            url: image.url || image.thumbnail,
          }))
          .filter((image) => image.id && image.thumbnail && image.url)
          .slice(0, IMAGE_SUGGESTION_LIMIT)))
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSuggestions([])
          setFailedIds([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [cleanQuery])

  return { suggestions, loading, failedIds, markImageFailed, query: cleanQuery }
}
