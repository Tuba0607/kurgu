<script setup lang="ts">
import { Users } from 'lucide-vue-next'
import { CONTENT_BODY_MAX_LENGTH, contentCharLimit, SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORMS, type ContentStatusValue, type ContentTypeValue, type SocialPlatformValue } from '#shared/constants/content'
import { contentCreateSchema, contentUpdateSchema } from '#shared/schemas/content'
import { toFieldErrors } from '#shared/utils/validation'
import type { ClientListItem, ContentDetail } from '~/types/api'

const BODY_MAX_LENGTH = CONTENT_BODY_MAX_LENGTH

const props = withDefaults(defineProps<{
  open: boolean
  /** Edit mode when set; the content is loaded when the modal opens. */
  contentId?: string | null
  /** Preselected client in create mode (e.g. from the client detail page). */
  defaultClientId?: string | null
}>(), {
  contentId: null,
  defaultClientId: null,
})

const emit = defineEmits<{
  close: []
  saved: [content: ContentDetail]
}>()

const toast = useToast()
const formElement = ref<HTMLFormElement | null>(null)
const formId = useId()

const isEdit = computed(() => Boolean(props.contentId))
const submitting = ref(false)
const loadState = ref<'loading' | 'error' | 'ready'>('ready')
const loadError = ref('')
const clients = ref<ClientListItem[]>([])
const clientsLoading = ref(false)

const form = reactive({
  title: '',
  clientId: '',
  type: '' as ContentTypeValue | '',
  status: 'DRAFT' as ContentStatusValue,
  platform: '' as SocialPlatformValue | '',
  scheduledAt: '',
  body: '',
})

// "Platform seçilmedi" first, the platforms alphabetically.
const platformOptions = [
  { value: '', label: 'Platform seçilmedi' },
  ...SOCIAL_PLATFORMS.map(value => ({ value, label: SOCIAL_PLATFORM_LABELS[value] }))
    .sort((a, b) => compareTurkish(a.label, b.label)),
]

// Character counter: the platform limit for social posts (same source as the preview),
// otherwise the general body limit. Exceeding a platform limit only warns.
const charLimit = computed(() => contentCharLimit(form.type === 'SOCIAL_POST' ? form.platform || null : null))
const overCharLimit = computed(() => form.body.length > charLimit.value)
const charHint = computed(() => {
  const counter = `${formatNumber(form.body.length)} / ${formatNumber(charLimit.value)} karakter`
  if (!overCharLimit.value || !form.platform) return counter
  return `${counter} · ${SOCIAL_PLATFORM_LABELS[form.platform]} sınırı ${formatNumber(form.body.length - charLimit.value)} karakter aşıldı; kaydedebilirsiniz ama yayından önce kısaltın.`
})

/** "YYYY-MM-DD" in local time for a date input. */
function toDateInputValue(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Unsaved changes: compare with the state right after opening / loading.
const initialSnapshot = ref('')
const snapshot = () => JSON.stringify(form)
const isDirty = computed(() => initialSnapshot.value !== '' && snapshot() !== initialSnapshot.value)
const discardOpen = ref(false)

function requestClose() {
  if (submitting.value) return
  if (isDirty.value) discardOpen.value = true
  else emit('close')
}

function discardChanges() {
  discardOpen.value = false
  emit('close')
}

const { errors, setErrors, clearErrors } = useFormErrors(form, formElement)

const clientOptions = computed(() => clients.value.map(client => ({ value: client.id, label: client.name })))
const hasNoClients = computed(() => !clientsLoading.value && clients.value.length === 0)

function resetForm() {
  Object.assign(form, {
    title: '',
    clientId: props.defaultClientId ?? '',
    type: '',
    status: 'DRAFT',
    platform: '',
    scheduledAt: '',
    body: '',
  })
  clearErrors()
  initialSnapshot.value = snapshot()
}

async function loadClients() {
  clientsLoading.value = true
  try {
    clients.value = await $fetch<ClientListItem[]>('/api/clients')
  }
  catch (error) {
    toast.error('Müşteriler yüklenemedi', getApiErrorMessage(error))
  }
  finally {
    clientsLoading.value = false
  }
}

async function loadContent() {
  if (!props.contentId) return
  loadState.value = 'loading'
  try {
    const content = await $fetch<ContentDetail>(contentApiPath(props.contentId))
    Object.assign(form, {
      title: content.title,
      clientId: content.clientId,
      type: content.type,
      status: content.status,
      platform: content.platform ?? '',
      scheduledAt: toDateInputValue(content.scheduledAt),
      body: content.body ?? '',
    })
    clearErrors()
    initialSnapshot.value = snapshot()
    loadState.value = 'ready'
    // The form is rendered only after loading, so move focus to its first field now.
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('input, select, textarea')?.focus()
  }
  catch (error) {
    loadError.value = getApiErrorMessage(error)
    loadState.value = 'error'
  }
}

watch(() => props.open, (open) => {
  if (!open) return
  resetForm()
  loadState.value = 'ready'
  loadClients()
  loadContent()
})

async function submit() {
  // Empty selects are sent as undefined so the "required" messages are shown.
  const payload = {
    ...form,
    type: form.type || undefined,
    clientId: form.clientId || undefined,
    platform: form.type === 'SOCIAL_POST' ? form.platform || null : null,
    scheduledAt: form.scheduledAt || null,
  }
  const result = (isEdit.value ? contentUpdateSchema : contentCreateSchema).safeParse(payload)
  if (!result.success) {
    await setErrors(toFieldErrors(result.error))
    return
  }

  submitting.value = true
  try {
    const content = isEdit.value
      ? await $fetch<ContentDetail>(contentApiPath(props.contentId!), { method: 'PATCH', body: result.data })
      : await $fetch<ContentDetail>('/api/contents', { method: 'POST', body: result.data })

    toast.success(isEdit.value ? 'İçerik güncellendi' : 'İçerik oluşturuldu', content.title)
    emit('saved', content)
    emit('close')
  }
  catch (error) {
    const fieldErrors = getApiFieldErrors(error)
    if (fieldErrors) await setErrors(fieldErrors)
    else toast.error(isEdit.value ? 'İçerik güncellenemedi' : 'İçerik oluşturulamadı', getApiErrorMessage(error))
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UiModal
    :open="open"
    :title="isEdit ? 'İçeriği düzenle' : 'Yeni içerik'"
    :description="isEdit ? 'İçerik bilgilerini ve durumunu güncelleyin.' : 'Bir müşteriye bağlı yeni içerik oluşturun.'"
    size="lg"
    :persistent="submitting"
    @close="requestClose"
  >
    <!-- Edit mode: loading / error states -->
    <div
      v-if="loadState === 'loading'"
      class="space-y-5"
      role="status"
      aria-label="İçerik yükleniyor"
    >
      <div
        v-for="row in 4"
        :key="row"
        class="space-y-2"
      >
        <UiSkeleton class="h-3.5 w-24" />
        <UiSkeleton class="h-10 w-full rounded-lg" />
      </div>
    </div>

    <UiErrorState
      v-else-if="loadState === 'error'"
      title="İçerik yüklenemedi"
      :message="loadError"
      @retry="loadContent"
    />

    <!-- No client yet: content cannot be created -->
    <UiEmptyState
      v-else-if="!isEdit && hasNoClients"
      :icon="Users"
      title="Önce bir müşteri ekleyin"
      description="İçerikler bir müşteriye bağlı olarak oluşturulur. Müşteri ekledikten sonra içerik oluşturabilirsiniz."
    >
      <UiButton
        to="/musteriler"
        variant="secondary"
        @click="emit('close')"
      >
        Müşterilere git
      </UiButton>
    </UiEmptyState>

    <form
      v-else
      :id="formId"
      ref="formElement"
      class="space-y-5"
      novalidate
      @submit.prevent="submit"
    >
      <UiFormField
        v-slot="field"
        label="Başlık"
        :error="errors.title"
        required
      >
        <UiInput
          :id="field.id"
          v-model="form.title"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          aria-required="true"
          placeholder="Örn. Sonbahar kampanyası lansman gönderisi"
          maxlength="200"
        />
      </UiFormField>

      <UiFormField
        v-slot="field"
        label="Müşteri"
        :error="errors.clientId"
        required
      >
        <UiSearchSelect
          :id="field.id"
          v-model="form.clientId"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          aria-required="true"
          :options="clientOptions"
          :placeholder="clientsLoading ? 'Müşteriler yükleniyor…' : 'Müşteri ara veya seçin'"
          empty-text="Bu adla bir müşteri yok"
          :disabled="clientsLoading"
        />
      </UiFormField>

      <ContentTypePicker
        v-model="form.type"
        legend="İçerik türü"
        :error="errors.type"
      />

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <UiFormField
          v-if="form.type === 'SOCIAL_POST'"
          v-slot="field"
          label="Platform"
          :error="errors.platform"
          optional
        >
          <UiListbox
            :id="field.id"
            v-model="form.platform"
            label="Platform"
            pin-selected
            :aria-describedby="field.describedBy"
            :options="platformOptions"
          />
        </UiFormField>
        <UiFormField
          v-slot="field"
          label="Planlanan yayın tarihi"
          :error="errors.scheduledAt"
          optional
          :class="form.type !== 'SOCIAL_POST' && 'sm:col-span-2'"
        >
          <UiDatePicker
            :id="field.id"
            v-model="form.scheduledAt"
            :invalid="field.invalid"
            :aria-describedby="field.describedBy"
          />
        </UiFormField>
      </div>

      <div>
        <ContentStatusPicker
          v-model="form.status"
          legend="Durum"
        />
        <p class="mt-1.5 text-[13px] text-ink-500">
          İçerik yayına alındığında yayın tarihi otomatik olarak kaydedilir.
        </p>
      </div>

      <UiFormField
        v-slot="field"
        label="İçerik metni"
        :error="errors.body"
        :hint="charHint"
        :hint-warning="overCharLimit"
        optional
      >
        <UiTextarea
          :id="field.id"
          v-model="form.body"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          rows="6"
          :maxlength="BODY_MAX_LENGTH"
          placeholder="İçerik metni, notlar veya brief…"
        />
      </UiFormField>

      <p
        v-if="errors._form"
        class="text-sm text-rose-600"
        role="alert"
      >
        {{ errors._form }}
      </p>
    </form>

    <template #footer>
      <UiButton
        variant="secondary"
        :disabled="submitting"
        @click="requestClose"
      >
        Vazgeç
      </UiButton>
      <UiButton
        v-if="loadState === 'ready' && (isEdit || !hasNoClients)"
        type="submit"
        :form="formId"
        :loading="submitting"
        :disabled="clientsLoading"
      >
        {{ isEdit ? 'Değişiklikleri kaydet' : 'İçeriği oluştur' }}
      </UiButton>
    </template>
  </UiModal>

  <UiConfirmDialog
    :open="discardOpen"
    title="Kaydedilmemiş değişiklikler var"
    description="Formu kapatırsanız yaptığınız değişiklikler kaybolacak."
    confirm-label="Değişiklikleri at"
    cancel-label="Düzenlemeye dön"
    @confirm="discardChanges"
    @cancel="discardOpen = false"
  />
</template>
