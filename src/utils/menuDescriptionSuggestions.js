const formatTitle = (text) => {
  const value = String(text || '').trim()
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const detectFoodKind = (name) => {
  const text = String(name || '').toLowerCase()
  if (/\b(momo|dumpling)\b/.test(text)) return 'momo'
  if (/\b(pizza)\b/.test(text)) return 'pizza'
  if (/\b(burger|hamburger)\b/.test(text)) return 'burger'
  if (/\b(tea|chai|coffee)\b/.test(text)) return 'drink'
  if (/\b(biryani|rice|dal|curry|thali)\b/.test(text)) return 'rice'
  if (/\b(noodle|chowmein|pasta)\b/.test(text)) return 'noodle'
  if (/\b(dessert|cake|ice cream|brownie)\b/.test(text)) return 'dessert'
  if (/\b(soup|starter|appetizer|snack)\b/.test(text)) return 'starter'
  return 'generic'
}

const categoryTemplates = {
  momo: (title) => `${title} — steamed and fried momos, dumplings, and Nepali-style bites freshly made to order.`,
  pizza: (title) => `${title} — wood-fired style pizzas and Italian favorites baked fresh for dine-in and delivery.`,
  burger: (title) => `${title} — burgers, sandwiches, and hearty fast-food classics served hot and ready to enjoy.`,
  drink: (title) => `${title} — hot and cold beverages including tea, coffee, and refreshing drinks to pair with any meal.`,
  rice: (title) => `${title} — rice plates, curries, dal, and traditional mains cooked with authentic spices.`,
  noodle: (title) => `${title} — noodles, chowmein, and pasta dishes prepared fresh with bold flavors.`,
  dessert: (title) => `${title} — sweet treats and desserts to finish your meal on a delicious note.`,
  starter: (title) => `${title} — starters, soups, and light bites perfect for sharing before the main course.`,
  generic: (title) => `${title} — explore popular dishes in this section, freshly prepared and served with care.`,
}

const menuItemTemplates = {
  momo: (title, category) => {
    const prefix = category ? `${title} from our ${category} menu` : title
    return `${prefix} — juicy dumplings filled with savory stuffing, served hot with tangy chutney.`
  },
  pizza: (title, category) => {
    const prefix = category ? `${title} (${category})` : title
    return `${prefix} — baked with melted cheese and fresh toppings on a crisp, flavorful base.`
  },
  burger: (title, category) => {
    const prefix = category ? `${title} — a ${category} favorite` : title
    return `${prefix} stacked with fresh ingredients, served warm with fries or sides.`
  },
  drink: (title, category) => {
    const prefix = category ? `${title} from ${category}` : title
    return `${prefix} — brewed and served fresh for a comforting, refreshing sip.`
  },
  rice: (title, category) => {
    const prefix = category ? `${title} (${category})` : title
    return `${prefix} — slow-cooked with aromatic spices and served piping hot.`
  },
  noodle: (title, category) => {
    const prefix = category ? `${title} — ${category}` : title
    return `${prefix} tossed in savory sauce with vegetables and protein, cooked to order.`
  },
  dessert: (title, category) => {
    const prefix = category ? `${title} (${category})` : title
    return `${prefix} — a sweet indulgence made fresh for the perfect ending to your meal.`
  },
  starter: (title, category) => {
    const prefix = category ? `${title} from ${category}` : title
    return `${prefix} — lightly seasoned and crisp, ideal as a starter or side.`
  },
  generic: (title, category) => {
    if (category) {
      return `${title} from our ${category} menu — prepared fresh with quality ingredients and served hot for the best taste.`
    }
    return `${title} — prepared fresh with quality ingredients and served hot for the best taste.`
  },
}

export function buildDescriptionSuggestion({ name, categoryName, kind = 'menuItem' }) {
  const title = formatTitle(name)
  if (title.length < 2) return ''

  const foodKind = detectFoodKind(title)
  const category = formatTitle(categoryName)

  if (kind === 'category') {
    const template = categoryTemplates[foodKind] || categoryTemplates.generic
    return template(title)
  }

  const template = menuItemTemplates[foodKind] || menuItemTemplates.generic
  return template(title, category)
}
