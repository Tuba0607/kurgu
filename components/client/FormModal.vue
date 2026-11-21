<script setup lang="ts">
import { clientCreateSchema } from '#shared/schemas/client'
import { PHONE_MAX_LENGTH, PHONE_PLACEHOLDER } from '#shared/utils/phone'
import { toFieldErrors } from '#shared/utils/validation'
import type { ClientListItem } from '~/types/api'

/** Fields of an existing client used to prefill the form in edit mode. */
interface EditableClient {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  industry: string | null
}

const props = withDefaults(defineProps<{
  open: boolean
  /** Edit mode when set: the form is prefilled and saved with PATCH. */
  client?: EditableClient | null
}>(), {
  client: null,
})

const emit = defineEmits<{
  close: []
  saved: [client: ClientListItem]
}>()

const toast = useToast()
const formElement = ref<HTMLFormElement | null>(null)
const formId = useId()
const submitting = ref(false)
const isEdit = computed(() => Boolean(props.client))

const form = reactive({
  name: '',
  contactName: '',
  email: '',
  phone: '',
  industry: '',
})

const { errors, setErrors, clearErrors } = useFormErrors(form, formElement)
// Formats the phone as "+90 5XX XXX XX XX" while typing (Zod still validates on submit).
const phoneMask = usePhoneMask()

// Existing industries are suggested; a new one can be typed and is title-cased on save.
const { data: industries, refresh: refreshIndustries } = useFetch<string[]>('/api/industries', {
  key: 'industries',
  lazy: true,
  server: false,
  immediate: false,
})

watch(() => props.open, (open) => {
  if (!open) return
  refreshIndustries()
  const client = props.client
  Object.assign(form, {
    name: client?.name ?? '',
    contactName: client?.contactName ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    industry: client?.industry ?? '',
  })
  clearErrors()
})

async function submit() {
  // Same Zod schema as the API, so client-side and server-side rules match.
  const result = clientCreateSchema.safeParse(form)
  if (!result.success) {
    await setErrors(toFieldErrors(result.error))
    return
  }

  submitting.value = true
  try {
    const client = props.client
      ? await $fetch<ClientListItem>(clientApiPath(props.client.id), { method: 'PATCH', body: result.data })
      : await $fetch<ClientListItem>('/api/clients', { method: 'POST', body: result.data })
    if (isEdit.value) toast.success('Müşteri bilgileri güncellendi', client.name)
    else toast.success('Müşteri eklendi', `${client.name} müşteri listesine eklendi.`)
    emit('saved', client)
    emit('close')
  }
  catch (error) {
    const fieldErrors = getApiFieldErrors(error)
    if (fieldErrors) await setErrors(fieldErrors)
    else toast.error(isEdit.value ? 'Müşteri güncellenemedi' : 'Müşteri eklenemedi', getApiErrorMessage(error))
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UiModal
    :open="open"
    :title="isEdit ? 'Müşteriyi düzenle' : 'Yeni müşteri'"
    :description="isEdit ? 'Müşteri bilgilerini güncelleyin. Yalnızca firma adı zorunludur.' : 'Müşteri bilgilerini girin. Yalnızca firma adı zorunludur.'"
    :persistent="submitting"
    @close="emit('close')"
  >
    <form
      :id="formId"
      ref="formElement"
      class="grid gap-4 sm:grid-cols-2"
      novalidate
      @submit.prevent="submit"
    >
      <UiFormField
        v-slot="field"
        class="sm:col-span-2"
        label="Firma adı"
        :error="errors.name"
        required
      >
        <UiInput
          :id="field.id"
          v-model="form.name"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          aria-required="true"
          autocomplete="organization"
          placeholder="Örn. Anadolu Kahve Evi"
          maxlength="120"
        />
      </UiFormField>

      <UiFormField
        v-slot="field"
        label="Yetkili kişi"
        :error="errors.contactName"
        optional
      >
        <UiInput
          :id="field.id"
          v-model="form.contactName"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          autocomplete="name"
          maxlength="120"
          placeholder="Örn. Elif Aydın"
        />
      </UiFormField>

      <UiFormField
        v-slot="field"
        label="Sektör"
        :error="errors.industry"
        optional
      >
        <UiCombobox
          :id="field.id"
          v-model="form.industry"
          :suggestions="industries ?? []"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          placeholder="Sektör seçin veya yazın"
          :create-label="value => `“${value}” sektörünü ekle`"
          maxlength="80"
        />
      </UiFormField>

      <UiFormField
        v-slot="field"
        label="E-posta"
        :error="errors.email"
        optional
      >
        <UiInput
          :id="field.id"
          v-model="form.email"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="ornek@firma.com"
          maxlength="254"
        />
      </UiFormField>

      <UiFormField
        v-slot="field"
        label="Telefon"
        :error="errors.phone"
        optional
      >
        <UiInput
          :id="field.id"
          v-model="form.phone"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          :placeholder="PHONE_PLACEHOLDER"
          :maxlength="PHONE_MAX_LENGTH"
          @input="phoneMask.onInput"
        />
      </UiFormField>
    </form>

    <template #footer>
      <UiButton
        variant="secondary"
        :disabled="submitting"
        @click="emit('close')"
      >
        Vazgeç
      </UiButton>
      <UiButton
        type="submit"
        :form="formId"
        :loading="submitting"
      >
        {{ isEdit ? 'Değişiklikleri kaydet' : 'Müşteriyi kaydet' }}
      </UiButton>
    </template>
  </UiModal>
</template>
