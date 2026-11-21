import { Search, X } from 'lucide-react'
import { useId } from 'react'
import s from './Overlay.module.css'

type Props = {
  value: string
  onChange: (value: string) => void
  onSearch?: (value: string) => void
  /** Accessible name of the field (visually hidden). */
  label?: string
  placeholder?: string
}

export function SearchBar({ value, onChange, onSearch, label = 'Szukaj', placeholder = 'Wpisz, czego szukasz' }: Props) {
  const id = useId()
  return (
    <form
      role="search"
      className={s.search}
      onSubmit={(e) => {
        e.preventDefault()
        onSearch?.(value)
      }}
    >
      <div className={s.searchField}>
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
        <Search className={s.searchIcon} size={20} aria-hidden="true" />
        <input
          id={id}
          type="search"
          className={s.searchInput}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button type="button" className={s.searchClear} onClick={() => onChange('')} aria-label="Wyczyść wyszukiwanie">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <button type="submit" className={s.searchButton}>
        <Search size={18} aria-hidden="true" />
        <span className={s.searchButtonLabel}>Szukaj</span>
      </button>
    </form>
  )
}
