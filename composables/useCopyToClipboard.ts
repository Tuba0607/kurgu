/**
 * Copies text with the native Clipboard API (no extra dependency) and reports
 * the result through the global toast system.
 */
export function useCopyToClipboard() {
  const toast = useToast()

  async function copy(text: string, successMessage: string): Promise<boolean> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(text)
      toast.success(successMessage, text)
      return true
    }
    catch {
      toast.error('Kopyalanamadı', 'Tarayıcınız panoya erişime izin vermedi. Metni seçerek kopyalayabilirsiniz.')
      return false
    }
  }

  return { copy }
}
