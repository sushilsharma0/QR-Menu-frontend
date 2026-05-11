const SLUG_KEY = 'customer_portal_slug'
const TOKEN_KEY = 'customer_portal_table_token'

export function rememberCustomerPortal(slug, token) {
  if (slug && token) {
    try {
      sessionStorage.setItem(SLUG_KEY, slug)
      sessionStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
  }
}

export function readCustomerPortal() {
  try {
    return {
      slug: sessionStorage.getItem(SLUG_KEY) || '',
      token: sessionStorage.getItem(TOKEN_KEY) || '',
    }
  } catch {
    return { slug: '', token: '' }
  }
}
