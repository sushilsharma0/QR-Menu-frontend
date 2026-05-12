import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronDown } from 'react-icons/fi'

const sizeStyles = {
  sm: 'py-1.5 pl-3 pr-9 text-xs',
  md: 'py-2.5 pl-3.5 pr-10 text-sm',
}

function normalizeOptions(options, placeholder) {
  const opts = Array.isArray(options) ? [...options] : []
  if (
    placeholder != null &&
    placeholder !== '' &&
    !opts.some((o) => String(o.value) === '')
  ) {
    opts.unshift({ value: '', label: placeholder })
  }
  return opts
}

function optionsEqual(a, b) {
  if (a === b) return true
  if (a == null || b == null) return String(a) === String(b)
  return String(a) === String(b)
}

/**
 * App-standard select: custom list panel (styled open state), dark mode, chevron.
 * Use `options={[{ value, label, disabled? }]}` or pass native `<option>` as `children` (native select fallback).
 */
export default function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  size = 'md',
  className = '',
  disabled,
  id,
  children,
  onChange,
  onValueChange,
  value: valueProp,
  defaultValue,
  showLabel = true,
  /** When true, shows a search field at the top of the dropdown (long option lists). */
  searchable = false,
  searchPlaceholder = 'Search…',
  ...rest
}) {
  const uid = useId()
  const selectId = id || `select-${uid.replace(/:/g, '')}`
  const listboxId = `${selectId}-listbox`
  const containerRef = useRef(null)
  /** Portal menu node — must be included in “inside” checks (not under containerRef). */
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })
  const [optionFilter, setOptionFilter] = useState('')
  const searchInputRef = useRef(null)
  const uncontrolled = valueProp === undefined
  const [uncontrolledVal, setUncontrolledVal] = useState(defaultValue ?? '')
  const value = uncontrolled ? uncontrolledVal : valueProp

  const opts = useMemo(() => {
    if (children) return []
    return normalizeOptions(options, placeholder)
  }, [options, placeholder, children])

  const filteredOpts = useMemo(() => {
    if (!searchable || !optionFilter.trim()) return opts
    const q = optionFilter.trim().toLowerCase()
    return opts.filter((o) => {
      if (o.value === '' || o.value == null) return false
      return String(o.label || '').toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)
    })
  }, [opts, optionFilter, searchable])

  const selectedOption = useMemo(
    () => opts.find((o) => optionsEqual(o.value, value)),
    [opts, value],
  )
  const displayLabel =
    selectedOption?.label ??
    (value !== '' && value != null ? String(value) : null) ??
    (placeholder != null && placeholder !== '' ? String(placeholder) : 'Select…')

  const updateMenuPosition = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 6
    const vw = window.innerWidth
    const vh = window.innerHeight
    const spaceBelow = vh - r.bottom - gap - 12
    const maxH = Math.max(searchable ? 200 : 120, Math.min(searchable ? 420 : 320, spaceBelow))
    let left = r.left
    let width = r.width
    if (left + width > vw - 8) left = Math.max(8, vw - width - 8)
    setMenuPos({
      top: r.bottom + gap,
      left,
      width,
      maxHeight: maxH,
    })
  }, [searchable])

  useLayoutEffect(() => {
    if (!open) {
      setEntered(false)
      setOptionFilter('')
      return
    }
    updateMenuPosition()
    const raf = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(raf)
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open || !searchable) return undefined
    const t = requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [open, searchable])

  useEffect(() => {
    if (!open) return undefined
    const onScroll = (e) => {
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onResize = () => updateMenuPosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, updateMenuPosition])

  useEffect(() => {
    if (!open) return undefined
    const close = (e) => {
      const t = e.target
      if (containerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const commitValue = (o) => {
    if (o?.disabled) return
    if (uncontrolled) setUncontrolledVal(o.value)
    const v = o.value
    onChange?.({ target: { value: v } })
    onValueChange?.(v)
    setOpen(false)
  }

  const {
    title: titleAttr,
    'aria-label': ariaLabelProp,
    name: nameProp,
    autoFocus,
    required: requiredProp,
  } = rest

  /* ——— Native fallback when using <option> children ——— */
  if (children) {
    const frameClass = [
      'relative w-full rounded-xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-150',
      'border-surface-200 hover:border-surface-300',
      'focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/20',
      'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
      'dark:focus-within:border-primary-400/60 dark:focus-within:ring-primary-500/25',
      error ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20 dark:border-red-500' : '',
      disabled ? 'pointer-events-none opacity-60' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const selectClass = [
      'peer w-full appearance-none rounded-[0.7rem] border-0 bg-transparent font-medium text-gray-900',
      'transition-colors duration-150',
      'focus:outline-none focus:ring-0',
      'disabled:cursor-not-allowed disabled:text-gray-500',
      'dark:text-gray-100',
      sizeStyles[size] || sizeStyles.md,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const chevronClass = [
      'pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-gray-500',
      'transition-transform duration-200 peer-focus:rotate-180 dark:text-gray-400',
    ].join(' ')

    const handleNativeChange = (e) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }

    return (
      <div className="w-full">
        {label && showLabel ? (
          <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        ) : null}
        <div className={frameClass}>
          <select
            id={selectId}
            className={selectClass}
            disabled={disabled}
            onChange={handleNativeChange}
            aria-invalid={error ? 'true' : undefined}
            {...(uncontrolled ? { defaultValue: defaultValue ?? '' } : { value: valueProp ?? '' })}
            title={titleAttr}
            name={nameProp}
            autoFocus={autoFocus}
            required={requiredProp}
            aria-label={ariaLabelProp}
          >
            {children}
          </select>
          <span className={chevronClass} aria-hidden>
            <FiChevronDown className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </span>
        </div>
        {hint && !error ? (
          <p className="mt-1 text-xs text-gray-500 transition-colors duration-200 dark:text-gray-400">{hint}</p>
        ) : null}
        {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    )
  }

  const frameClass = [
    'relative w-full rounded-xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-150',
    'border-surface-200 hover:border-surface-300',
    open
      ? 'border-primary-500/45 ring-2 ring-primary-500/15 dark:border-primary-500/40 dark:ring-primary-500/20'
      : 'focus-within:border-primary-500/50 focus-within:ring-2 focus-within:ring-primary-500/20',
    'dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600',
    error ? 'border-red-500 ring-red-500/15 dark:border-red-500' : '',
    disabled ? 'pointer-events-none opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const triggerClass = [
    'flex w-full items-center justify-between gap-2 rounded-[0.7rem] border-0 bg-transparent text-left font-medium text-gray-900',
    'transition-colors duration-150',
    'focus:outline-none focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:text-gray-500',
    'dark:text-gray-100',
    sizeStyles[size] || sizeStyles.md,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const chevronBtnClass = [
    'shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400',
    open ? '-rotate-180' : '',
  ].join(' ')

  const dropdown = open
    ? createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          className={[
            'fixed z-[300] overflow-hidden rounded-xl border border-surface-200 bg-white shadow-lg',
            'transition-[opacity,transform] duration-150 ease-out dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50',
            entered ? 'translate-y-0 opacity-100' : '-translate-y-0.5 opacity-0',
          ].join(' ')}
          style={{
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            maxHeight: menuPos.maxHeight,
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="flex max-h-[inherit] flex-col overflow-hidden">
            {searchable ? (
              <div className="shrink-0 border-b border-surface-100 p-2 dark:border-gray-800">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={optionFilter}
                  onChange={(e) => setOptionFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation()
                      setOptionFilter('')
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                  autoComplete="off"
                  aria-label={searchPlaceholder}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 [scrollbar-gutter:stable]">
            <ul className="space-y-0.5">
              {filteredOpts.map((o) => {
                const selected = optionsEqual(o.value, value)
                const itemClass = [
                  'flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100',
                  selected
                    ? 'bg-surface-100 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-50'
                    : 'text-gray-800 hover:bg-surface-50 active:bg-surface-100 dark:text-gray-200 dark:hover:bg-gray-800/80 dark:active:bg-gray-800',
                  o.disabled ? 'cursor-not-allowed opacity-45 hover:bg-transparent dark:hover:bg-transparent' : '',
                ].join(' ')
                return (
                  <li key={`${String(o.value)}-${o.label}`} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      disabled={o.disabled}
                      className={itemClass}
                      onClick={() => commitValue(o)}
                    >
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {selected ? (
                        <span className="ml-2 text-xs font-medium text-primary-600 dark:text-primary-400" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
            {searchable && filteredOpts.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No matches.</p>
            ) : null}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="w-full">
      {nameProp ? <input type="hidden" name={nameProp} value={value == null ? '' : String(value)} /> : null}
      {label && showLabel ? (
        <span id={`${selectId}-label`} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      ) : null}
      <div ref={containerRef} className={frameClass}>
        <button
          type="button"
          id={selectId}
          className={triggerClass}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-required={requiredProp || undefined}
          {...(label && showLabel
            ? { 'aria-labelledby': `${selectId}-label` }
            : { 'aria-label': ariaLabelProp || label || 'Select' })}
          title={titleAttr}
          autoFocus={autoFocus}
          onClick={() => {
            if (disabled) return
            setOpen((o) => !o)
          }}
        >
          <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
          <FiChevronDown className={size === 'sm' ? `h-3.5 w-3.5 ${chevronBtnClass}` : `h-4 w-4 ${chevronBtnClass}`} aria-hidden />
        </button>
      </div>
      {dropdown}
      {hint && !error ? (
        <p className="mt-1 text-xs text-gray-500 transition-colors duration-200 dark:text-gray-400">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  )
}
