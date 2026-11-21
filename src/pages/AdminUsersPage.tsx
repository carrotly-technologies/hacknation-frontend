import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getUsers, updateUserRole, type UserView } from '../api/users'
import type { Role } from '../api/cases'
import { errorMessage } from '../api/client'
import { ErrorState, LoadingState } from '../components/QueryState'
import { InlineAlert, Select, Snackbar, StatusBadge } from '../components/ui'
import { demoUsersQueryKey, ROLE_LABEL, useMe } from '../lib/useAuth'
import { countLabel } from '../lib/format'

const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))

/** ADMIN: accounts and their roles. A new role applies to that account's next request. */
export function AdminUsersPage() {
  const me = useMe()
  const qc = useQueryClient()
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: ({ signal }) => getUsers(signal) })
  const [saved, setSaved] = useState<string | null>(null)
  const change = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateUserRole(id, role),
    onSuccess: (u) => {
      qc.setQueryData<UserView[]>(['admin', 'users'], (list) => list?.map((x) => (x.id === u.id ? u : x)))
      void qc.invalidateQueries({ queryKey: demoUsersQueryKey })
      setSaved(`Zapisano: ${u.name} ma teraz rolę „${ROLE_LABEL[u.role]}”. Przełącz się na to konto w nagłówku, żeby zobaczyć zmianę.`)
    },
  })

  if (users.isPending) return <div className="page"><LoadingState /></div>
  if (users.isError) return <div className="page"><ErrorState error={users.error} what="lista użytkowników" onRetry={() => users.refetch()} /></div>

  return (
    <div className="page page--wide">
      <header className="page-head">
        <div>
          <h1 className="h-page">Użytkownicy</h1>
          <p className="page-head__meta">Konta i role w systemie · {countLabel(users.data.length, 'konto', 'konta', 'kont')}</p>
        </div>
      </header>

      {change.isError && (
        <InlineAlert tone="error" live title="Nie udało się zmienić roli">
          {errorMessage(change.error)}
        </InlineAlert>
      )}

      <section className="section" aria-labelledby="users-h">
        <h2 id="users-h" className="visually-hidden">Lista kont</h2>
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Imię i nazwisko</th>
                <th>Login</th>
                <th>Stanowisko i komórka</th>
                <th>Rola</th>
              </tr>
            </thead>
            <tbody>
              {users.data.map((u) => {
                const self = u.id === me.id
                const pending = change.isPending && change.variables?.id === u.id
                return (
                  <tr key={u.id}>
                    <td>
                      <span className="person__name">{u.name}</span>
                      {self && <> <StatusBadge tone="info">to Ty</StatusBadge></>}
                    </td>
                    <td className="num">{u.login}</td>
                    <td>
                      <div>{u.position}</div>
                      <div className="faint small">{u.unit}</div>
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <Select
                        aria-label={`Rola: ${u.name}`}
                        options={ROLE_OPTIONS.map((o) => ({ ...o, disabled: self && o.value !== 'ADMIN' }))}
                        value={u.role}
                        disabled={pending}
                        onChange={(e) => change.mutate({ id: u.id, role: e.target.value as Role })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="faint small" style={{ marginTop: 12 }}>
          Nie możesz odebrać sobie roli administratora. Przełożony widzi tylko teczki, w których jest oceniającym.
        </p>
      </section>

      <Snackbar open={saved !== null} message={saved ?? ''} onClose={() => setSaved(null)} />
    </div>
  )
}
