import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './TimerView.css'

/** 07:00 até fim do slot das 23h (meia-noite exclusiva no fim da grade). */
const GRID_START_MIN = 7 * 60
const GRID_END_MIN = 24 * 60
const GRID_RANGE = GRID_END_MIN - GRID_START_MIN

const HOUR_PX = 48
const SNAP_MIN = 15

function minutesToTopPct(startMin, endMin) {
  const top = ((startMin - GRID_START_MIN) / GRID_RANGE) * 100
  const h = ((endMin - startMin) / GRID_RANGE) * 100
  return { top: Math.max(0, top), height: Math.max(0, h) }
}

function formatDurationHMS(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function durationSeconds(startMin, endMin) {
  return Math.max(0, (endMin - startMin) * 60)
}

function formatLabelFromRange(startMin, endMin) {
  return formatDurationHMS(durationSeconds(startMin, endMin))
}

function snapMinutes(mins) {
  const rel = mins - GRID_START_MIN
  const snapped = Math.round(rel / SNAP_MIN) * SNAP_MIN
  return Math.min(GRID_END_MIN, Math.max(GRID_START_MIN, GRID_START_MIN + snapped))
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function startOfWeekMonday(d) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d, n) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function newId() {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const INITIAL_ENTRIES = [
  { id: 'seed-1', dayIndex: 0, startMin: 11 * 60 + 15, endMin: 19 * 60 + 30, title: '', sub: '' },
  {
    id: 'seed-2',
    dayIndex: 1,
    startMin: 11 * 60 + 15,
    endMin: 13 * 60 + 30,
    title: '',
    sub: '',
  },
  {
    id: 'seed-3',
    dayIndex: 1,
    startMin: 14 * 60,
    endMin: 18 * 60,
    title: 'Validating task APP-21029',
    sub: 'kadince + kadince',
  },
]

export default function TimerView() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [viewMode, setViewMode] = useState('5d')
  const [taskTitle, setTaskTitle] = useState('')
  const [entries, setEntries] = useState(INITIAL_ENTRIES)
  const [selectedId, setSelectedId] = useState(null)
  const [drag, setDrag] = useState(null)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  const weekStart = useMemo(() => {
    const base = startOfWeekMonday(new Date())
    return addDays(base, weekOffset * 7)
  }, [weekOffset])

  const weekDays = useMemo(() => {
    const count = viewMode === '5d' ? 5 : 7
    return Array.from({ length: count }, (_, i) => addDays(weekStart, i))
  }, [weekStart, viewMode])

  const isoWeek = getISOWeek(weekStart)
  const weekLabelShort = `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`

  const endDay = weekDays[weekDays.length - 1]
  const rangeLabel = `${weekLabelShort} – ${endDay.getDate().toString().padStart(2, '0')}/${(endDay.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`

  const weekTotalSeconds = useMemo(() => {
    return entries.reduce((sum, e) => sum + durationSeconds(e.startMin, e.endMin), 0)
  }, [entries])

  const hours = useMemo(() => {
    const list = []
    for (let h = 7; h <= 23; h += 1) {
      const display = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      list.push({ key: h, label: `${display}:00 ${ampm}` })
    }
    return list
  }, [])

  const gridBodyMinHeight = hours.length * HOUR_PX

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const minsNow = now.getHours() * 60 + now.getMinutes()
  const currentTimeLine =
    minsNow < GRID_START_MIN || minsNow > GRID_END_MIN
      ? null
      : ((minsNow - GRID_START_MIN) / GRID_RANGE) * 100

  const todayColumnIndex = weekDays.findIndex((d) => d.getTime() === today.getTime())

  const yToMinutes = useCallback((clientY, rect) => {
    const y = clientY - rect.top
    const pct = Math.min(1, Math.max(0, y / rect.height))
    return GRID_START_MIN + pct * GRID_RANGE
  }, [])

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setSelectedId((s) => (s === id ? null : s))
  }, [])

  const addEntryAt = useCallback(
    (colIdx, startMin, endMin) => {
      const s = snapMinutes(startMin)
      let t = Math.min(GRID_END_MIN, snapMinutes(endMin))
      if (t <= s) t = Math.min(GRID_END_MIN, s + SNAP_MIN)
      const title = taskTitle.trim() || 'Novo registro'
      setEntries((prev) => [
        ...prev,
        {
          id: newId(),
          dayIndex: colIdx,
          startMin: s,
          endMin: t,
          title,
          sub: '',
        },
      ])
      setTaskTitle('')
    },
    [taskTitle]
  )

  const onResizePointerMove = useCallback(
    (e) => {
      const r = resizeRef.current
      if (!r || e.pointerId !== r.pointerId) return
      const rect = r.columnEl.getBoundingClientRect()
      const m = yToMinutes(e.clientY, rect)
      const snapped = snapMinutes(m)
      setEntries((prev) =>
        prev.map((ent) => {
          if (ent.id !== r.entryId) return ent
          if (r.edge === 'start') {
            let s = snapped
            if (s >= ent.endMin - SNAP_MIN) s = ent.endMin - SNAP_MIN
            if (s < GRID_START_MIN) s = GRID_START_MIN
            return { ...ent, startMin: s }
          }
          let t = snapped
          if (t <= ent.startMin + SNAP_MIN) t = ent.startMin + SNAP_MIN
          if (t > GRID_END_MIN) t = GRID_END_MIN
          return { ...ent, endMin: t }
        })
      )
    },
    [yToMinutes]
  )

  const onResizePointerUp = useCallback((e) => {
    const r = resizeRef.current
    if (!r || e.pointerId !== r.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    resizeRef.current = null
  }, [])

  const onResizeHandlePointerDown = useCallback((entry, edge, e) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const col = e.currentTarget.closest('.timer-entries-col')
    if (!col) return
    setSelectedId(entry.id)
    resizeRef.current = {
      entryId: entry.id,
      edge,
      pointerId: e.pointerId,
      columnEl: col,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onColumnPointerDown = useCallback(
    (colIdx, e) => {
      if (e.button !== 0) return
      const target = e.currentTarget
      const rect = target.getBoundingClientRect()
      const m = yToMinutes(e.clientY, rect)
      const snapped = snapMinutes(m)
      setSelectedId(null)
      setDrag({
        colIdx,
        pointerId: e.pointerId,
        startMin: snapped,
        currentMin: snapped,
        targetEl: target,
      })
      target.setPointerCapture(e.pointerId)
    },
    [yToMinutes]
  )

  const onColumnPointerMove = useCallback(
    (e) => {
      const d = dragRef.current
      if (!d || e.pointerId !== d.pointerId) return
      const rect = d.targetEl.getBoundingClientRect()
      const m = yToMinutes(e.clientY, rect)
      setDrag((prev) => (prev && prev.pointerId === e.pointerId ? { ...prev, currentMin: m } : prev))
    },
    [yToMinutes]
  )

  const onColumnPointerUp = useCallback(
    (e) => {
      const d = dragRef.current
      if (!d || e.pointerId !== d.pointerId) return
      const { colIdx, startMin, currentMin, targetEl, pointerId } = d
      try {
        targetEl.releasePointerCapture(pointerId)
      } catch {
        /* ignore */
      }

      const rect = targetEl.getBoundingClientRect()
      const h = rect.height || 1
      const distPx = Math.abs(
        ((currentMin - GRID_START_MIN) / GRID_RANGE - (startMin - GRID_START_MIN) / GRID_RANGE) * h
      )

      const rawLo = Math.min(startMin, currentMin)
      const rawHi = Math.max(startMin, currentMin)
      const a = snapMinutes(rawLo)
      let b = snapMinutes(rawHi)

      if (distPx < 8) {
        addEntryAt(colIdx, a, Math.min(GRID_END_MIN, a + 60))
      } else {
        if (b <= a) b = Math.min(GRID_END_MIN, a + SNAP_MIN)
        addEntryAt(colIdx, a, Math.max(b, a + SNAP_MIN))
      }

      setDrag(null)
    },
    [addEntryAt]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const t = document.activeElement?.tagName
        if (selectedId && t !== 'INPUT' && t !== 'TEXTAREA') {
          e.preventDefault()
          removeEntry(selectedId)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, removeEntry])

  const dragPreview =
    drag &&
    (() => {
      const lo = Math.min(drag.startMin, drag.currentMin)
      const hi = Math.max(drag.startMin, drag.currentMin)
      const a = snapMinutes(lo)
      let b = snapMinutes(hi)
      if (b <= a) b = a + SNAP_MIN
      const { top, height } = minutesToTopPct(a, Math.min(b, GRID_END_MIN))
      return { top, height }
    })()

  return (
    <div className="timer-view">
      <header className="timer-top-bar">
        <input
          type="text"
          className="timer-task-input"
          placeholder="What are you working on?"
          aria-label="Descrição da tarefa atual"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <div className="timer-top-actions">
          <button type="button" className="timer-icon-btn" title="Projeto" aria-label="Projeto">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button type="button" className="timer-icon-btn" title="Tags" aria-label="Tags">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </button>
          <button type="button" className="timer-icon-btn" title="Faturável" aria-label="Faturável">
            <span className="timer-dollar">$</span>
          </button>
          <span className="timer-digits" aria-live="polite">
            0:00:00
          </span>
          <button type="button" className="timer-play" aria-label="Iniciar timer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="timer-sub-bar">
        <div className="timer-sub-left">
          <button
            type="button"
            className="timer-nav-arrow"
            onClick={() => setWeekOffset((w) => w - 1)}
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <span className="timer-week-label">
            This week · W{isoWeek}
            <span className="timer-week-dates">{rangeLabel}</span>
          </span>
          <button
            type="button"
            className="timer-nav-arrow"
            onClick={() => setWeekOffset((w) => w + 1)}
            aria-label="Próxima semana"
          >
            ›
          </button>
          <span className="timer-week-total">
            WEEK TOTAL <strong>{formatDurationHMS(weekTotalSeconds)}</strong>
          </span>
        </div>
        <div className="timer-sub-right">
          <select
            className="timer-select"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            aria-label="Visualização da semana"
          >
            <option value="5d">5 days view</option>
            <option value="7d">7 days view</option>
          </select>
          <div className="timer-segments" role="tablist" aria-label="Modo de visualização">
            <button type="button" className="timer-seg active" role="tab" aria-selected="true">
              Calendar
            </button>
            <button type="button" className="timer-seg" role="tab" aria-selected="false">
              List view
            </button>
            <button type="button" className="timer-seg" role="tab" aria-selected="false">
              Timesheet
            </button>
          </div>
          <button type="button" className="timer-icon-btn subtle" title="Configurações" aria-label="Configurações">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          <button type="button" className="timer-icon-btn subtle" title="Painel lateral" aria-label="Painel lateral">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      <p className="timer-help">
        Grade 07:00–23:00. Clique = bloco de 1h; arraste na coluna = intervalo. Alças = e = início/fim. × ou Delete remove.
      </p>

      <div className="timer-calendar-wrap">
        <div className="timer-calendar-inner">
          <div className="timer-time-gutter">
            <div className="timer-corner-cell" />
            {hours.map((h) => (
              <div key={h.key} className="timer-hour-label">
                {h.label}
              </div>
            ))}
          </div>
          <div className="timer-days-grid">
            <div
              className="timer-day-headers"
              style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}
            >
              {weekDays.map((d, i) => {
                const isToday = d.getTime() === today.getTime()
                return (
                  <div key={i} className={`timer-day-head ${isToday ? 'today' : ''}`}>
                    <span className="timer-day-num">{d.getDate()}</span>
                    <span className="timer-day-name">{WEEKDAY_SHORT[d.getDay()]}</span>
                  </div>
                )
              })}
            </div>
            <div className="timer-grid-body" style={{ minHeight: gridBodyMinHeight }}>
              <div className="timer-columns-row" style={{ minHeight: gridBodyMinHeight }}>
                {weekDays.map((_, colIdx) => (
                  <div key={colIdx} className="timer-day-column">
                    <div className="timer-hour-lines">
                      {hours.map((h) => (
                        <div key={h.key} className="timer-hour-cell" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="timer-entries-layer" style={{ minHeight: gridBodyMinHeight }}>
                {weekDays.map((_, colIdx) => (
                  <div key={colIdx} className="timer-entries-col">
                    <div
                      role="presentation"
                      className="timer-column-hit"
                      onPointerDown={(e) => onColumnPointerDown(colIdx, e)}
                      onPointerMove={onColumnPointerMove}
                      onPointerUp={onColumnPointerUp}
                      onPointerCancel={onColumnPointerUp}
                    />
                    {drag && drag.colIdx === colIdx && dragPreview && (
                      <div
                        className="timer-drag-ghost"
                        style={{
                          top: `${dragPreview.top}%`,
                          height: `${dragPreview.height}%`,
                        }}
                      />
                    )}
                    {entries
                      .filter((e) => e.dayIndex === colIdx)
                      .map((e) => {
                        const { top, height } = minutesToTopPct(e.startMin, e.endMin)
                        const durLabel = formatLabelFromRange(e.startMin, e.endMin)
                        const isSel = selectedId === e.id
                        return (
                          <div
                            key={e.id}
                            role="button"
                            tabIndex={0}
                            className={`timer-entry-block ${isSel ? 'selected' : ''}`}
                            style={{ top: `${top}%`, height: `${height}%` }}
                            onPointerDown={(ev) => {
                              ev.stopPropagation()
                              setSelectedId(e.id)
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault()
                                setSelectedId(e.id)
                              }
                            }}
                          >
                            <button
                              type="button"
                              className="timer-entry-handle timer-entry-handle-top"
                              aria-label="Ajustar hora de início"
                              onPointerDown={(ev) => onResizeHandlePointerDown(e, 'start', ev)}
                              onPointerMove={onResizePointerMove}
                              onPointerUp={onResizePointerUp}
                              onPointerCancel={onResizePointerUp}
                            >
                              <span className="timer-entry-handle-icon" aria-hidden>
                                <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                                  <line x1="1" y1="2" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                  <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="timer-entry-handle timer-entry-handle-bottom"
                              aria-label="Ajustar hora de fim"
                              onPointerDown={(ev) => onResizeHandlePointerDown(e, 'end', ev)}
                              onPointerMove={onResizePointerMove}
                              onPointerUp={onResizePointerUp}
                              onPointerCancel={onResizePointerUp}
                            >
                              <span className="timer-entry-handle-icon" aria-hidden>
                                <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                                  <line x1="1" y1="2" x2="13" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                  <line x1="1" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              </span>
                            </button>
                            <button
                              type="button"
                              className="timer-entry-remove"
                              aria-label="Remover registro"
                              onPointerDown={(ev) => {
                                ev.stopPropagation()
                                removeEntry(e.id)
                              }}
                            >
                              ×
                            </button>
                            {e.title ? (
                              <div className="timer-entry-body">
                                <div className="timer-entry-title">{e.title}</div>
                                {e.sub ? <div className="timer-entry-sub">{e.sub}</div> : null}
                                <div className="timer-entry-dur">{durLabel}</div>
                              </div>
                            ) : (
                              <div className="timer-entry-dur only">{durLabel}</div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
              {currentTimeLine !== null && todayColumnIndex >= 0 && (
                <div
                  className="timer-now-line"
                  style={{
                    top: `${currentTimeLine}%`,
                    left: `calc(${(100 / weekDays.length) * todayColumnIndex}% + 2px)`,
                    width: `calc(${100 / weekDays.length}% - 4px)`,
                  }}
                >
                  <span className="timer-now-dot" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
