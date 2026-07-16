import type { ReactElement } from 'react'
import { ListFilter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TaskFilters, TaskFiltersControl } from '@/lib/tasks/task-filters'

const BUCKET_FILTERS: ReadonlyArray<{ key: keyof TaskFilters; labelKey: string }> = [
  { key: 'pinned', labelKey: 'tasks.filters-menu.label.pinned' },
  { key: 'current', labelKey: 'tasks.filters-menu.label.current' },
  { key: 'overdue', labelKey: 'tasks.filters-menu.label.overdue' },
  { key: 'upcoming', labelKey: 'tasks.filters-menu.label.upcoming' },
  { key: 'other', labelKey: 'tasks.filters-menu.label.other' },
]

interface TaskFiltersMenuProps extends TaskFiltersControl {
  /** Controlled open state, so ⌘⇧E can toggle the menu (V1). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The Tasks view's "Task filters" dropdown (V1): per-bucket toggles plus
 * "Show archived tasks". Toggling keeps the menu open (`preventDefault` on
 * select) so several filters can be flipped at once. Open state is controlled so
 * the ⌘⇧E shortcut can open and close it.
 */
export function TaskFiltersMenu({
  filters,
  toggle,
  open,
  onOpenChange,
}: TaskFiltersMenuProps): ReactElement {
  const { t } = useTranslation()
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="window-drag-control text-xs font-normal text-text-muted">
          <ListFilter aria-hidden className="size-3.5" />
          {t('tasks.filters-menu.trigger')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('tasks.filters-menu.heading')}</DropdownMenuLabel>
        {BUCKET_FILTERS.map(({ key, labelKey }) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={filters[key]}
            onCheckedChange={() => toggle(key)}
            onSelect={(event) => event.preventDefault()}
          >
            {t(labelKey)}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={filters.archived}
          onCheckedChange={() => toggle('archived')}
          onSelect={(event) => event.preventDefault()}
        >
          {t('tasks.filters-menu.show-archived')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
