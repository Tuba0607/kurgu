<script setup lang="ts">
import { CONTENT_TYPE_LABELS, SOCIAL_PLATFORM_CHAR_LIMITS, SOCIAL_PLATFORM_LABELS } from '#shared/constants/content'
import type { ContentDetail } from '~/types/api'

/**
 * Neutral, type-specific preview of a content, built only from its own data
 * (no images, no platform branding). The body is always rendered as text.
 */
const props = defineProps<{
  content: Pick<ContentDetail, 'title' | 'body' | 'type' | 'platform' | 'publishedAt' | 'createdAt'> & { client: { name: string } }
}>()

const paragraphs = computed(() => splitParagraphs(props.content.body))
const date = computed(() => formatDate(props.content.publishedAt ?? props.content.createdAt))
const characterCount = computed(() => (props.content.body ?? '').trim().length)
// Platform limit (X 280, Instagram 2200, LinkedIn 3000...) for social posts.
const charLimit = computed(() => (props.content.platform ? SOCIAL_PLATFORM_CHAR_LIMITS[props.content.platform] : null))
const overLimit = computed(() => charLimit.value !== null && characterCount.value > charLimit.value)
</script>

<template>
  <div>
    <!-- Social post: a single post card -->
    <article
      v-if="content.type === 'SOCIAL_POST'"
      class="mx-auto max-w-md rounded-2xl border border-ink-200 bg-surface p-4 shadow-card sm:p-5"
    >
      <header class="flex items-center gap-3">
        <span
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white"
          aria-hidden="true"
        >{{ getInitials(content.client.name) }}</span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-ink-900">
            {{ content.client.name }}
          </p>
          <p class="text-[13px] text-ink-500">
            {{ date }} · {{ content.platform ? SOCIAL_PLATFORM_LABELS[content.platform] : CONTENT_TYPE_LABELS[content.type] }}
          </p>
        </div>
      </header>
      <p
        v-if="paragraphs.length"
        class="mt-4 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink-800"
      >
        {{ content.body!.trim() }}
      </p>
      <p
        v-else
        class="mt-4 text-[15px] font-medium text-ink-900"
      >
        {{ content.title }}
      </p>
      <footer class="mt-4 border-t border-ink-100 pt-3 text-[13px] tabular-nums text-ink-500">
        <span
          class="tabular-nums"
          :class="overLimit ? 'font-semibold text-rose-700' : ''"
        >
          {{ formatNumber(characterCount) }}<template v-if="charLimit"> / {{ formatNumber(charLimit) }}</template> karakter
        </span>
        <span
          v-if="overLimit"
          class="mt-1 block text-rose-700"
          role="status"
        >
          {{ SOCIAL_PLATFORM_LABELS[content.platform!] }} sınırı {{ formatNumber(characterCount - charLimit!) }} karakter aşıldı; metni kısaltın.
        </span>
      </footer>
    </article>

    <!-- Blog post: article layout -->
    <article
      v-else-if="content.type === 'BLOG_POST'"
      class="mx-auto max-w-prose"
    >
      <p class="text-xs font-semibold uppercase tracking-wider text-brand">
        {{ CONTENT_TYPE_LABELS[content.type] }}
      </p>
      <h3 class="mt-2 break-words text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-[28px]">
        {{ content.title }}
      </h3>
      <p class="mt-3 text-[13px] text-ink-500">
        {{ content.client.name }} · {{ date }} · {{ estimateReadingMinutes(content.body) }} dk okuma
      </p>
      <div class="mt-6 space-y-4 border-t border-ink-100 pt-6">
        <p
          v-for="(paragraph, index) in paragraphs"
          :key="index"
          class="whitespace-pre-line break-words text-base leading-7 text-ink-700"
        >
          {{ paragraph }}
        </p>
      </div>
    </article>

    <!-- Web page: neutral browser frame -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-card"
    >
      <div class="flex items-center gap-3 border-b border-ink-200 bg-ink-50 px-3 py-2.5">
        <span
          class="flex shrink-0 gap-1.5"
          aria-hidden="true"
        >
          <span class="size-2.5 rounded-full bg-ink-300" />
          <span class="size-2.5 rounded-full bg-ink-300" />
          <span class="size-2.5 rounded-full bg-ink-300" />
        </span>
        <span class="min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-1 text-xs text-ink-500 ring-1 ring-inset ring-ink-200">
          {{ titleToPath(content.title) }}
        </span>
      </div>
      <div class="px-5 py-6 sm:px-8 sm:py-8">
        <p class="text-[13px] font-medium text-ink-500">
          {{ content.client.name }}
        </p>
        <h3 class="mt-1 break-words text-2xl font-semibold leading-tight tracking-tight text-ink-900">
          {{ content.title }}
        </h3>
        <div class="mt-5 space-y-4">
          <p
            v-for="(paragraph, index) in paragraphs"
            :key="index"
            class="whitespace-pre-line break-words text-[15px] leading-7 text-ink-700"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
