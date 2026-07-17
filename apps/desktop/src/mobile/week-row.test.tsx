import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { formatLocalizedDate, parseIsoDate } from '@/lib/dates'
import { WeekRow } from './week-row'

describe('WeekRow', () => {
  it('refreshes localized date labels when the interface language changes', () => {
    const day = '2026-07-17'
    const englishLabel = formatLocalizedDate(parseIsoDate(day), 'EEEE, MMMM do', 'en')
    const chineseLabel = formatLocalizedDate(parseIsoDate(day), 'EEEE, MMMM do', 'zh-CN')
    const onSelect = vi.fn()
    const view = render(
      <WeekRow
        weekStart="2026-07-13"
        selectedDay={day}
        todayDay={day}
        language="en"
        onSelect={onSelect}
      />,
    )

    expect(screen.getByRole('button', { name: englishLabel })).toBeTruthy()

    view.rerender(
      <WeekRow
        weekStart="2026-07-13"
        selectedDay={day}
        todayDay={day}
        language="zh-CN"
        onSelect={onSelect}
      />,
    )

    expect(screen.queryByRole('button', { name: englishLabel })).toBeNull()
    expect(screen.getByRole('button', { name: chineseLabel })).toBeTruthy()
  })
})
