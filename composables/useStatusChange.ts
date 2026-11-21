import { CONTENT_STATUS_LABELS, type ContentStatusValue } from '#shared/constants/content'
import type { ContentDetail } from '~/types/api'

const UNDO_WINDOW_MS = 5000

/**
 * Changes a content's status and shows "Yayında olarak güncellendi · Geri al".
 * Used by the list's status menu and the detail page's status picker so both
 * behave the same. `onChange` receives the saved content after each request
 * (also after an undo).
 */
export function useStatusChange(onChange: (content: ContentDetail) => void) {
  const toast = useToast()
  const pendingId = ref<string | null>(null)

  async function save(id: string, status: ContentStatusValue) {
    return await $fetch<ContentDetail>(contentApiPath(id), { method: 'PATCH', body: { status } })
  }

  async function changeStatus(id: string, from: ContentStatusValue, to: ContentStatusValue): Promise<boolean> {
    if (from === to || pendingId.value) return false
    pendingId.value = id
    try {
      onChange(await save(id, to))
      toast.success(`${CONTENT_STATUS_LABELS[to]} olarak güncellendi`, {
        duration: UNDO_WINDOW_MS,
        action: {
          label: 'Geri al',
          run: async () => {
            try {
              onChange(await save(id, from))
              toast.success(`${CONTENT_STATUS_LABELS[from]} durumuna geri alındı`)
            }
            catch (error) {
              toast.error('Değişiklik geri alınamadı', getApiErrorMessage(error))
            }
          },
        },
      })
      return true
    }
    catch (error) {
      toast.error('Durum güncellenemedi', getApiErrorMessage(error))
      return false
    }
    finally {
      pendingId.value = null
    }
  }

  return { changeStatus, pendingId: readonly(pendingId) }
}
