/**
 * Idempotent seed script with fictional demo data.
 *
 * Every seeded record has a fixed, deterministic id and is written with `upsert`,
 * so running the seed multiple times never duplicates rows. Re-running resets
 * seeded records to the values below; records created through the app are untouched.
 */
import { ContentStatus, ContentType, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number, hour = 10): Date {
  const date = new Date(Date.now() - days * DAY_IN_MS)
  date.setHours(hour, 0, 0, 0)
  return date
}

interface SeedClient {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  industry: string | null
  createdDaysAgo: number
}

interface SeedContent {
  id: string
  clientId: string
  title: string
  body: string | null
  type: ContentType
  status: ContentStatus
  createdDaysAgo: number
  publishedDaysAgo?: number
}

// All companies, people, emails and phone numbers are fictional.
// Emails use the reserved ".example" TLD so they can never reach a real inbox.
const clients: SeedClient[] = [
  {
    id: 'seed_client_anadolu_kahve',
    name: 'Anadolu Kahve Evi',
    contactName: 'Elif Aydın',
    email: 'elif.aydin@anadolukahve.example',
    phone: '+90 212 000 00 01',
    industry: 'Yiyecek & İçecek',
    createdDaysAgo: 60,
  },
  {
    id: 'seed_client_mavi_rota',
    name: 'Mavi Rota Turizm',
    contactName: 'Burak Yılmaz',
    email: 'burak.yilmaz@mavirota.example',
    phone: '+90 242 000 00 02',
    industry: 'Turizm',
    createdDaysAgo: 52,
  },
  {
    id: 'seed_client_kuzey_yapi',
    name: 'Kuzey Yapı Mimarlık',
    contactName: 'Zeynep Kaya',
    email: 'zeynep.kaya@kuzeyyapi.example',
    phone: '+90 312 000 00 03',
    industry: 'İnşaat & Mimarlık',
    createdDaysAgo: 41,
  },
  {
    id: 'seed_client_lina_kozmetik',
    name: 'Lina Kozmetik',
    contactName: 'Deniz Arslan',
    email: 'deniz.arslan@linakozmetik.example',
    phone: '+90 216 000 00 04',
    industry: 'Kozmetik',
    createdDaysAgo: 30,
  },
  {
    id: 'seed_client_pusula_lojistik',
    name: 'Pusula Lojistik',
    contactName: 'Mert Demir',
    email: 'mert.demir@pusulalojistik.example',
    phone: '+90 232 000 00 05',
    industry: 'Lojistik',
    createdDaysAgo: 18,
  },
  {
    id: 'seed_client_ekin_organik',
    name: 'Ekin Organik Tarım',
    contactName: 'Selin Öztürk',
    email: 'selin.ozturk@ekinorganik.example',
    phone: null,
    industry: 'Tarım',
    createdDaysAgo: 7,
  },
]

const contents: SeedContent[] = [
  // Anadolu Kahve Evi
  {
    id: 'seed_content_01',
    clientId: 'seed_client_anadolu_kahve',
    title: 'Sonbahar menüsü lansman gönderisi',
    body: 'Yeni sezon tarçınlı latte ve balkabaklı kek için Instagram karusel gönderisi. Görseller ve kısa metin hazır.',
    type: ContentType.SOCIAL_POST,
    status: ContentStatus.PUBLISHED,
    createdDaysAgo: 45,
    publishedDaysAgo: 40,
  },
  {
    id: 'seed_content_02',
    clientId: 'seed_client_anadolu_kahve',
    title: 'Türk kahvesinin hikâyesi',
    body: 'Türk kahvesinin tarihçesi, pişirme yöntemleri ve sunum gelenekleri üzerine SEO odaklı blog yazısı.',
    type: ContentType.BLOG_POST,
    status: ContentStatus.IN_REVIEW,
    createdDaysAgo: 12,
  },
  {
    id: 'seed_content_03',
    clientId: 'seed_client_anadolu_kahve',
    title: 'Şubeler sayfası yenilemesi',
    body: 'Şube adresleri, çalışma saatleri ve harita entegrasyonu içeren web sayfası metinleri.',
    type: ContentType.WEB_PAGE,
    status: ContentStatus.DRAFT,
    createdDaysAgo: 3,
  },

  // Mavi Rota Turizm
  {
    id: 'seed_content_04',
    clientId: 'seed_client_mavi_rota',
    title: 'Kapadokya erken rezervasyon kampanyası',
    body: 'Erken rezervasyon indirimini duyuran sosyal medya gönderisi ve hikâye görselleri.',
    type: ContentType.SOCIAL_POST,
    status: ContentStatus.PUBLISHED,
    createdDaysAgo: 35,
    publishedDaysAgo: 33,
  },
  {
    id: 'seed_content_05',
    clientId: 'seed_client_mavi_rota',
    title: 'Ege’de keşfedilmemiş 7 koy',
    body: 'Ege kıyısındaki az bilinen koyları tanıtan, tur paketlerine bağlantı veren blog yazısı.',
    type: ContentType.BLOG_POST,
    status: ContentStatus.PUBLISHED,
    createdDaysAgo: 28,
    publishedDaysAgo: 21,
  },
  {
    id: 'seed_content_06',
    clientId: 'seed_client_mavi_rota',
    title: 'Kurumsal tur hizmetleri sayfası',
    body: 'Şirketlere özel tur ve etkinlik organizasyonlarını anlatan landing page metinleri.',
    type: ContentType.WEB_PAGE,
    status: ContentStatus.IN_REVIEW,
    createdDaysAgo: 6,
  },

  // Kuzey Yapı Mimarlık
  {
    id: 'seed_content_07',
    clientId: 'seed_client_kuzey_yapi',
    title: 'Proje portföyü sayfası',
    body: 'Tamamlanan konut ve ticari projelerin görsellerle sunulduğu portföy sayfası.',
    type: ContentType.WEB_PAGE,
    status: ContentStatus.PUBLISHED,
    createdDaysAgo: 38,
    publishedDaysAgo: 30,
  },
  {
    id: 'seed_content_08',
    clientId: 'seed_client_kuzey_yapi',
    title: 'Sürdürülebilir mimaride 5 trend',
    body: 'Enerji verimliliği ve yerel malzeme kullanımı odaklı uzman görüşü içeren blog yazısı.',
    type: ContentType.BLOG_POST,
    status: ContentStatus.DRAFT,
    createdDaysAgo: 9,
  },
  {
    id: 'seed_content_09',
    clientId: 'seed_client_kuzey_yapi',
    title: 'Şantiyeden kareler serisi',
    body: 'Devam eden projeden haftalık ilerleme fotoğraflarıyla LinkedIn gönderi serisi.',
    type: ContentType.SOCIAL_POST,
    status: ContentStatus.IN_REVIEW,
    createdDaysAgo: 4,
  },

  // Lina Kozmetik
  {
    id: 'seed_content_10',
    clientId: 'seed_client_lina_kozmetik',
    title: 'Yeni serum ürün tanıtımı',
    body: 'C vitamini serumu için ürün özelliklerini öne çıkaran Reels senaryosu ve gönderi metni.',
    type: ContentType.SOCIAL_POST,
    status: ContentStatus.PUBLISHED,
    createdDaysAgo: 20,
    publishedDaysAgo: 16,
  },
  {
    id: 'seed_content_11',
    clientId: 'seed_client_lina_kozmetik',
    title: 'Cilt tipine göre bakım rehberi',
    body: 'Kuru, yağlı ve karma cilt tipleri için adım adım bakım rutini öneren blog yazısı.',
    type: ContentType.BLOG_POST,
    status: ContentStatus.IN_REVIEW,
    createdDaysAgo: 8,
  },
  {
    id: 'seed_content_12',
    clientId: 'seed_client_lina_kozmetik',
    title: 'Hakkımızda sayfası',
    body: null,
    type: ContentType.WEB_PAGE,
    status: ContentStatus.DRAFT,
    createdDaysAgo: 2,
  },

  // Pusula Lojistik
  {
    id: 'seed_content_13',
    clientId: 'seed_client_pusula_lojistik',
    title: 'Soğuk zincir hizmetleri sayfası',
    body: 'Gıda ve ilaç sektörüne yönelik soğuk zincir taşımacılığı hizmet sayfası.',
    type: ContentType.WEB_PAGE,
    status: ContentStatus.PUBLISHED,
    createdDaysAgo: 15,
    publishedDaysAgo: 10,
  },
  {
    id: 'seed_content_14',
    clientId: 'seed_client_pusula_lojistik',
    title: 'Yılın filo yatırımı duyurusu',
    body: 'Yeni elektrikli araç filosunu duyuran LinkedIn gönderisi.',
    type: ContentType.SOCIAL_POST,
    status: ContentStatus.DRAFT,
    createdDaysAgo: 1,
  },

  // Ekin Organik Tarım
  {
    id: 'seed_content_15',
    clientId: 'seed_client_ekin_organik',
    title: 'Organik sertifika süreci nasıl işler?',
    body: 'Organik tarım sertifikasyonunun aşamalarını tüketiciye anlatan bilgilendirici blog yazısı.',
    type: ContentType.BLOG_POST,
    status: ContentStatus.DRAFT,
    createdDaysAgo: 5,
  },
  {
    id: 'seed_content_16',
    clientId: 'seed_client_ekin_organik',
    title: 'Hasat zamanı gönderisi',
    body: 'Yeni hasat ürünlerini tanıtan, sipariş bağlantısı içeren Instagram gönderisi.',
    type: ContentType.SOCIAL_POST,
    status: ContentStatus.IN_REVIEW,
    createdDaysAgo: 0,
  },
]

async function main(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const { id, createdDaysAgo, ...data } of clients) {
      await tx.client.upsert({
        where: { id },
        create: { id, ...data, createdAt: daysAgo(createdDaysAgo) },
        update: data,
      })
    }

    for (const { id, createdDaysAgo, publishedDaysAgo, ...data } of contents) {
      const publishedAt = publishedDaysAgo === undefined ? null : daysAgo(publishedDaysAgo, 9)
      await tx.content.upsert({
        where: { id },
        create: { id, ...data, publishedAt, createdAt: daysAgo(createdDaysAgo) },
        update: { ...data, publishedAt },
      })
    }
  })

  console.log(`Seed completed: ${clients.length} clients, ${contents.length} contents upserted.`)
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
