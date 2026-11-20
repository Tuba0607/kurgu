<script setup lang="ts">
import { clientCreateSchema } from '#shared/schemas/client'
import { toFieldErrors } from '#shared/utils/validation'
import type { ClientListItem } from '~/types/api'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
  close: []
  saved: [client: ClientListItem]
}>()

const toast = useToast()
const formElement = ref<HTMLFormElement | null>(null)
const formId = useId()
const submitting = ref(false)

const form = reactive({
  name: '',
  contactName: '',
  email: '',
  phone: '',
  industry: '',
})

const { errors, setErrors, clearErrors } = useFormErrors(form, formElement)

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, { name: '', contactName: '', email: '', phone: '', industry: '' })
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
    const client = await $fetch('/api/clients', { method: 'POST', body: result.data })
    toast.success('Müşteri eklendi', `${client.name} müşteri listesine eklendi.`)
    emit('saved', client)
    emit('close')
  }
  catch (error) {
    const fieldErrors = getApiFieldErrors(error)
    if (fieldErrors) await setErrors(fieldErrors)
    else toast.error('Müşteri eklenemedi', getApiErrorMessage(error))
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <UiModal
    :open="open"
    title="Yeni müşteri"
    description="Müşteri bilgilerini girin. Yalnızca firma adı zorunludur."
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
        />
      </UiFormField>

      <UiFormField
        v-slot="field"
        label="Sektör"
        :error="errors.industry"
        optional
      >
        <UiInput
          :id="field.id"
          v-model="form.industry"
          :invalid="field.invalid"
          :aria-describedby="field.describedBy"
          placeholder="Örn. Turizm"
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
          placeholder="+90 212 000 00 00"
          maxlength="20"
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
        Müşteriyi kaydet
      </UiButton>
    </template>
  </UiModal>
</template>
