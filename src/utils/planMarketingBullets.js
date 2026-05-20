/**
 * Build public pricing bullets from enabled plan modules.
 * Preserves custom lines that do not match a module label.
 */

export function orderedEnabledModuleLabels(featureOptions, featureGroups, flags) {
  if (!featureOptions?.length) return []

  const enabled = (opt) => flags[opt.key] !== false
  const labels = []

  if (featureGroups?.length) {
    for (const group of featureGroups) {
      for (const opt of featureOptions) {
        if (opt.group === group.id && enabled(opt)) {
          labels.push(opt.label)
        }
      }
    }
    const groupedIds = new Set(featureGroups.map((g) => g.id))
    for (const opt of featureOptions) {
      if (!groupedIds.has(opt.group) && enabled(opt)) {
        labels.push(opt.label)
      }
    }
    return labels
  }

  return featureOptions.filter(enabled).map((o) => o.label)
}

export function mergeMarketingBullets({ featureOptions, featureGroups, flags, existingBullets = [] }) {
  const moduleLabelSet = new Set((featureOptions || []).map((o) => o.label))
  const autoBullets = orderedEnabledModuleLabels(featureOptions, featureGroups, flags)

  const manualExtras = (existingBullets || [])
    .map((line) => String(line || '').trim())
    .filter((line) => line && !moduleLabelSet.has(line))

  const seen = new Set()
  const merged = []
  for (const line of [...autoBullets, ...manualExtras]) {
    if (seen.has(line)) continue
    seen.add(line)
    merged.push(line)
  }
  return merged
}
