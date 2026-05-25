const createClientKey = () => `client-${Date.now()}-${Math.random().toString(36).slice(2)}`

const option = (name, price = 0, isDefault = false) => ({
  clientKey: createClientKey(),
  name,
  additionalPrice: Number(price) || 0,
  isAvailable: true,
  isDefault,
})

const tierGroup = ({
  name,
  type = 'portion',
  displayType = 'dropdown',
  options,
  sortOrder = 0,
}) => ({
  clientKey: createClientKey(),
  name,
  type,
  pricingMode: 'tier',
  selectionType: 'single',
  isRequired: true,
  minSelection: 1,
  maxSelection: 1,
  displayType,
  sortOrder,
  isActive: true,
  options,
})

const additiveGroup = ({
  name,
  type = 'addon',
  displayType = 'chips',
  options,
  isRequired = false,
  sortOrder = 0,
}) => ({
  clientKey: createClientKey(),
  name,
  type,
  pricingMode: 'additive',
  selectionType: 'single',
  isRequired,
  minSelection: isRequired ? 1 : 0,
  maxSelection: 1,
  displayType,
  sortOrder,
  isActive: true,
  options,
})

const TEMPLATES = {
  momo: (basePrice) => ({
    id: 'momo-portion',
    label: 'Momo portions',
    hint: 'Half plate / full plate — each price is what the customer pays.',
    groups: [
      tierGroup({
        name: 'Portion',
        type: 'portion',
        displayType: 'dropdown',
        options: [
          option('Half Plate', basePrice ? Math.round(basePrice * 0.55) : 0, true),
          option('Full Plate', basePrice || 0),
        ],
      }),
    ],
    priceHint: 'Set base price to 0 or your smallest portion; enter full amounts in each portion row.',
    suggestedBasePrice: 0,
  }),
  pizza: (basePrice) => ({
    id: 'pizza-size',
    label: 'Pizza size',
    hint: 'Slice size — customer picks one; price column is the full pizza price.',
    groups: [
      tierGroup({
        name: 'Size',
        type: 'size',
        displayType: 'dropdown',
        options: [
          option('Regular (6 slices)', basePrice ? Math.round(basePrice * 0.75) : 0, true),
          option('Medium (8 slices)', basePrice || 0),
          option('Large (10 slices)', basePrice ? Math.round(basePrice * 1.25) : 0),
        ],
      }),
    ],
    priceHint: 'Enter the full price for each size in the table below.',
    suggestedBasePrice: 0,
  }),
  drink: () => ({
    id: 'drink-volume',
    label: 'Drink size',
    hint: 'Small / regular / large volumes.',
    groups: [
      tierGroup({
        name: 'Size',
        type: 'volume',
        displayType: 'dropdown',
        options: [option('Small', 0, true), option('Regular', 0), option('Large', 0)],
      }),
    ],
    priceHint: 'Enter price for each cup size.',
    suggestedBasePrice: 0,
  }),
  rice: (basePrice) => ({
    id: 'rice-portion',
    label: 'Plate size',
    hint: 'Regular or full plate servings.',
    groups: [
      tierGroup({
        name: 'Portion',
        type: 'portion',
        displayType: 'dropdown',
        options: [
          option('Regular Plate', basePrice ? Math.round(basePrice * 0.7) : 0, true),
          option('Full Plate', basePrice || 0),
        ],
      }),
    ],
    priceHint: 'Each portion row is the full item price.',
    suggestedBasePrice: 0,
  }),
  noodle: (basePrice) => ({
    id: 'noodle-portion',
    label: 'Serving size',
    hint: 'Half or full bowl.',
    groups: [
      tierGroup({
        name: 'Portion',
        type: 'portion',
        displayType: 'dropdown',
        options: [
          option('Half Bowl', basePrice ? Math.round(basePrice * 0.6) : 0, true),
          option('Full Bowl', basePrice || 0),
        ],
      }),
    ],
    priceHint: 'Enter full price per serving size.',
    suggestedBasePrice: 0,
  }),
  burger: (basePrice) => ({
    id: 'burger-size',
    label: 'Burger size',
    hint: 'Single / double patty or meal combo.',
    groups: [
      tierGroup({
        name: 'Size',
        type: 'size',
        displayType: 'dropdown',
        options: [
          option('Regular', basePrice || 0, true),
          option('Large', basePrice ? Math.round(basePrice * 1.2) : 0),
        ],
      }),
    ],
    priceHint: 'Price per size is the amount charged.',
    suggestedBasePrice: 0,
  }),
  generic: (basePrice) => ({
    id: 'generic-size',
    label: 'Size options',
    hint: 'Small / medium / large — optional starter template.',
    groups: [
      tierGroup({
        name: 'Size',
        type: 'size',
        displayType: 'dropdown',
        options: [
          option('Small', basePrice ? Math.round(basePrice * 0.8) : 0, true),
          option('Medium', basePrice || 0),
          option('Large', basePrice ? Math.round(basePrice * 1.15) : 0),
        ],
      }),
    ],
    priceHint: 'Use the price column for the full amount per size.',
    suggestedBasePrice: 0,
  }),
}

export function detectMenuKind({ name = '', categoryName = '' }) {
  const combined = `${name} ${categoryName}`.toLowerCase()
  if (/\b(momo|dumpling)\b/.test(combined)) return 'momo'
  if (/\b(pizza)\b/.test(combined)) return 'pizza'
  if (/\b(tea|chai|coffee|drink|beverage|juice|lassi|shake)\b/.test(combined)) return 'drink'
  if (/\b(biryani|rice|dal|curry|thali)\b/.test(combined)) return 'rice'
  if (/\b(noodle|chowmein|pasta|ramen)\b/.test(combined)) return 'noodle'
  if (/\b(burger|sandwich)\b/.test(combined)) return 'burger'
  return 'generic'
}

export function buildVariationSuggestion({ name = '', categoryName = '', basePrice = 0 }) {
  const kind = detectMenuKind({ name, categoryName })
  const template = TEMPLATES[kind] || TEMPLATES.generic
  const built = template(Number(basePrice) || 0)
  if (!String(name || '').trim() && !String(categoryName || '').trim()) return null
  return { kind, ...built }
}

export function isTierPricingGroup(group) {
  if (!group) return false
  if (group.pricingMode === 'tier') return true
  if (group.pricingMode === 'additive') return false
  const type = String(group.type || '').toLowerCase()
  const single = (group.selectionType || 'single') === 'single'
  const required = group.isRequired === true
  return single && required && ['portion', 'size', 'volume', 'pieces'].includes(type)
}
