/**
 * Demo data: 8 fictional Turkish companies and 22 contents with status history.
 *
 * `resetDemoData` DELETES every client, content and status change and creates the
 * demo data again. Dates are relative to "now", so the overview always shows a
 * realistic picture (contents waiting for approval for more than 5 days, planned
 * dates this week, a few overdue). Used by `npm run db:seed` and the nightly
 * demo reset (server/api/cron/reset-demo.get.ts).
 */
import { ContentStatus, ContentType, type PrismaClient, SocialPlatform } from '@prisma/client'

const DAY = 24 * 60 * 60 * 1000

/** A moment relative to now: negative = past, positive = future. */
function at(days: number, hour = 10, minute = 0): Date {
  const date = new Date(Date.now() + days * DAY)
  date.setHours(hour, minute, 0, 0)
  return date
}

interface SeedClient {
  key: string
  name: string
  contactName: string
  email: string
  phone: string
  industry: string
  createdDays: number
}

const CLIENTS: SeedClient[] = [
  { key: 'anadolu_kahve', name: 'Anadolu Kahve Evi', contactName: 'Elif Aydın', email: 'elif.aydin@anadolukahve.example', phone: '+90 532 418 27 61', industry: 'Yiyecek & İçecek', createdDays: -60 },
  { key: 'mavi_rota', name: 'Mavi Rota Turizm', contactName: 'Burak Yılmaz', email: 'burak.yilmaz@mavirota.example', phone: '+90 533 702 15 48', industry: 'Turizm', createdDays: -56 },
  { key: 'kuzey_yapi', name: 'Kuzey Yapı Mimarlık', contactName: 'Zeynep Kaya', email: 'zeynep.kaya@kuzeyyapi.example', phone: '+90 542 391 66 02', industry: 'İnşaat & Mimarlık', createdDays: -52 },
  { key: 'lina_kozmetik', name: 'Lina Kozmetik', contactName: 'Deniz Arslan', email: 'deniz.arslan@linakozmetik.example', phone: '+90 505 284 73 19', industry: 'Kozmetik', createdDays: -48 },
  { key: 'pusula_lojistik', name: 'Pusula Lojistik', contactName: 'Mert Demir', email: 'mert.demir@pusulalojistik.example', phone: '+90 544 610 82 35', industry: 'Lojistik', createdDays: -45 },
  { key: 'ekin_organik', name: 'Ekin Organik Tarım', contactName: 'Selin Öztürk', email: 'selin.ozturk@ekinorganik.example', phone: '+90 536 157 40 92', industry: 'Tarım', createdDays: -41 },
  { key: 'atlas_finans', name: 'Atlas Finans Teknolojileri', contactName: 'Kaan Şahin', email: 'kaan.sahin@atlasfintek.example', phone: '+90 530 948 21 07', industry: 'Finans', createdDays: -38 },
  { key: 'isil_dis', name: 'Işıl Diş Kliniği', contactName: 'Dr. Işıl Güneş', email: 'iletisim@isildis.example', phone: '+90 549 233 58 14', industry: 'Sağlık', createdDays: -34 },
]

interface SeedContent {
  client: string
  title: string
  body: string
  type: ContentType
  platform?: SocialPlatform
  status: ContentStatus
  /** Days relative to now (negative = past). */
  created: number
  /** IN_REVIEW: when it was sent for approval. PUBLISHED: when it went to review before publishing. */
  review?: number
  published?: number
  scheduled?: number
}

const { SOCIAL_POST, BLOG_POST, WEB_PAGE } = ContentType
const { DRAFT, IN_REVIEW, PUBLISHED } = ContentStatus
const { INSTAGRAM, LINKEDIN, X, FACEBOOK } = SocialPlatform

const CONTENTS: SeedContent[] = [
  // --- Published (8) ---
  { client: 'mavi_rota', title: 'Ege’de keşfedilmemiş 7 koy', type: BLOG_POST, status: PUBLISHED, created: -40, review: -37, published: -35, scheduled: -35,
    body: 'Kalabalıktan uzak bir yaz tatili arayanlar için Ege kıyılarında az bilinen yedi koyu derledik.\n\nHer koy için ulaşım bilgisi, en uygun ziyaret saatleri ve yakındaki konaklama önerileri yazının sonunda yer alıyor.' },
  { client: 'anadolu_kahve', title: 'Türk kahvesinin hikâyesi', type: BLOG_POST, status: PUBLISHED, created: -38, review: -34, published: -31, scheduled: -31,
    body: 'Türk kahvesinin tarihçesi, pişirme yöntemleri ve sunum gelenekleri üzerine SEO odaklı bir blog yazısı.\n\nYazı; cezve seçimi, kahve-su oranı ve köpük püf noktalarıyla devam ediyor.' },
  { client: 'lina_kozmetik', title: 'Cilt tipine göre bakım rehberi', type: BLOG_POST, status: PUBLISHED, created: -33, review: -30, published: -27, scheduled: -27,
    body: 'Kuru, yağlı, karma ve hassas ciltler için sabah ve akşam bakım rutinleri.\n\nHer cilt tipi için önerilen ürün grupları ve kaçınılması gereken içerikler ayrı başlıklar halinde anlatılıyor.' },
  { client: 'kuzey_yapi', title: 'Kurumsal web sitesi: Projeler sayfası', type: WEB_PAGE, status: PUBLISHED, created: -30, review: -26, published: -22,
    body: 'Tamamlanan konut ve ticari projelerin fotoğraflarla anlatıldığı proje vitrini sayfası.\n\nSayfa; proje künyesi, kullanılan malzemeler ve sürdürülebilirlik yaklaşımı bölümlerinden oluşuyor.' },
  { client: 'ekin_organik', title: 'Hasat zamanı gönderisi', type: SOCIAL_POST, platform: INSTAGRAM, status: PUBLISHED, created: -24, review: -22, published: -20, scheduled: -20,
    body: 'Tarladan sofranıza: yeni sezon domateslerimiz hasat edildi. 🍅 Sipariş bağlantısı profilimizde. #organik #hasat #yerelüretim' },
  { client: 'atlas_finans', title: 'Ödeme altyapısı lansman duyurusu', type: SOCIAL_POST, platform: LINKEDIN, status: PUBLISHED, created: -19, review: -17, published: -14, scheduled: -14,
    body: 'KOBİ’ler için tasarladığımız yeni ödeme altyapısı bugün yayında. Tek entegrasyonla kartlı ödeme, havale ve taksit seçeneklerini sunabilirsiniz. Detaylar ve erken erişim için bağlantıdaki formu doldurabilirsiniz.' },
  { client: 'pusula_lojistik', title: 'Soğuk zincir hizmetimiz', type: WEB_PAGE, status: PUBLISHED, created: -16, review: -13, published: -10,
    body: 'Gıda ve ilaç sevkiyatları için uçtan uca sıcaklık takibi sunan soğuk zincir hizmet sayfası.\n\nSayfada araç filosu, sertifikalar ve teklif formu yer alıyor.' },
  { client: 'isil_dis', title: 'Diş beyazlatma hakkında 5 yanlış bilinen', type: BLOG_POST, status: PUBLISHED, created: -12, review: -9, published: -6, scheduled: -6,
    body: 'Diş beyazlatmanın diş minesine zarar verdiği doğru mu? Uzman diş hekimimiz en sık sorulan beş soruyu yanıtlıyor.\n\nYazı, tedavi sonrası bakım önerileriyle tamamlanıyor.' },

  // --- Waiting for approval (7): two for more than 5 days, one past its date ---
  { client: 'kuzey_yapi', title: 'Şantiyeden kareler serisi', type: SOCIAL_POST, platform: INSTAGRAM, status: IN_REVIEW, created: -15, review: -12, scheduled: 2,
    body: 'Bornova konut projemizde kaba inşaat tamamlandı. Şantiyeden haftalık kareleri bu seride paylaşıyoruz. #mimarlık #şantiye #kuzeyyapı' },
  { client: 'mavi_rota', title: 'Kapadokya balon turu kampanyası', type: SOCIAL_POST, platform: FACEBOOK, status: IN_REVIEW, created: -11, review: -8, scheduled: -1,
    body: 'Erken rezervasyona özel Kapadokya balon turu paketlerinde %20 indirim! Konaklama ve transfer dahil paketler için hemen yerinizi ayırtın.' },
  { client: 'ekin_organik', title: 'Organik sertifika süreci nasıl işler?', type: BLOG_POST, status: IN_REVIEW, created: -9, review: -4, scheduled: 4,
    body: 'Organik tarım sertifikasının hangi aşamalardan geçtiğini, denetimlerin nasıl yapıldığını ve tüketicinin etikette nelere dikkat etmesi gerektiğini anlatan rehber yazı.' },
  { client: 'atlas_finans', title: 'Fintek dünyasında bu ay', type: SOCIAL_POST, platform: X, status: IN_REVIEW, created: -6, review: -3, scheduled: 1,
    body: 'Bu ay fintek dünyasında öne çıkanlar: anlık ödemelerde yeni dönem, açık bankacılık düzenlemeleri ve KOBİ finansmanında yapay zekâ destekli kredi skorlaması. Hepsini tek bir başlıkta topladık; kısa okumalar ve kaynak bağlantıları için profilimizdeki bağlantıya göz atın. Sizce en çok hangisi işinizi etkileyecek?' },
  { client: 'lina_kozmetik', title: 'Hakkımızda sayfası', type: WEB_PAGE, status: IN_REVIEW, created: -5, review: -2,
    body: 'Lina Kozmetik’in kuruluş hikâyesini, değerlerini ve üretim yaklaşımını anlatan kurumsal sayfa metni.' },
  { client: 'anadolu_kahve', title: 'Yeni şube açılış duyurusu', type: SOCIAL_POST, platform: INSTAGRAM, status: IN_REVIEW, created: -3, review: -1, scheduled: 3,
    body: 'Kadıköy şubemiz cumartesi kapılarını açıyor! ☕ Açılış haftasına özel her kahvenin yanında ikram tatlımız sizden.' },
  { client: 'isil_dis', title: 'Hizmetlerimiz sayfası yenilemesi', type: WEB_PAGE, status: IN_REVIEW, created: -2, review: -1,
    body: 'İmplant, ortodonti ve estetik diş hekimliği hizmetlerinin ayrı bölümlerle anlatıldığı yeni hizmetler sayfası.' },

  // --- Drafts (7): one past its scheduled date, one scheduled this week ---
  { client: 'pusula_lojistik', title: 'Yılın filo yatırımı duyurusu', type: SOCIAL_POST, platform: LINKEDIN, status: DRAFT, created: -7, scheduled: -2,
    body: 'Filomuza 40 yeni elektrikli kamyon katıldı. Karbon ayak izimizi azaltma hedefimizde önemli bir adım daha attık.' },
  { client: 'anadolu_kahve', title: 'Şubeler sayfası yenilemesi', type: WEB_PAGE, status: DRAFT, created: -10,
    body: 'Şube adresleri, çalışma saatleri ve harita entegrasyonu içeren web sayfası metinleri.' },
  { client: 'lina_kozmetik', title: 'Kış bakım rutini önerileri', type: SOCIAL_POST, platform: INSTAGRAM, status: DRAFT, created: -4, scheduled: 5,
    body: 'Soğuk havalarda cildinizi korumak için 3 adımlık kış rutini. Kaydedin, sonra deneyin! ❄️' },
  { client: 'atlas_finans', title: 'Güvenli ödeme için 6 ipucu', type: BLOG_POST, status: DRAFT, created: -3,
    body: 'Online alışverişte kart bilgilerinizi korumak için uygulayabileceğiniz altı pratik öneri.' },
  { client: 'kuzey_yapi', title: 'Sürdürülebilir mimaride 5 trend', type: BLOG_POST, status: DRAFT, created: -2,
    body: '' },
  { client: 'ekin_organik', title: 'Üretici hikâyeleri: Ayşe Teyze', type: SOCIAL_POST, platform: FACEBOOK, status: DRAFT, created: -1, scheduled: 6,
    body: 'Ödemiş’te 30 yıldır organik zeytin yetiştiren Ayşe Teyze’nin hikâyesini dinlediniz mi?' },
  { client: 'mavi_rota', title: 'Kurumsal tur hizmetleri sayfası', type: WEB_PAGE, status: DRAFT, created: 0,
    body: 'Şirketlere özel motivasyon gezileri, kongre ve toplantı organizasyonlarını anlatan hizmet sayfası.' },
]

/** Replaces all data with the demo data in one transaction. Returns the new counts. */
export async function resetDemoData(prisma: PrismaClient): Promise<{ clients: number, contents: number }> {
  await prisma.$transaction(async (tx) => {
    // Order matters only for clarity: contents cascade with their client anyway.
    await tx.contentStatusChange.deleteMany()
    await tx.content.deleteMany()
    await tx.client.deleteMany()

    const clientIds = new Map<string, string>()
    for (const client of CLIENTS) {
      const { key, createdDays, ...data } = client
      // Fixed ids keep links and API tests stable across re-seeds.
      const created = await tx.client.create({ data: { id: `seed_client_${key}`, ...data, createdAt: at(createdDays, 9) } })
      clientIds.set(key, created.id)
    }

    for (const [index, content] of CONTENTS.entries()) {
      const createdAt = at(content.created, 9 + (index % 8), (index * 7) % 60)
      const reviewAt = content.review !== undefined ? at(content.review, 14) : undefined
      const publishedAt = content.published !== undefined ? at(content.published, 11) : null

      // Status history always starts as a draft at creation time.
      const history: Array<{ fromStatus: ContentStatus | null, toStatus: ContentStatus, changedAt: Date }> = [
        { fromStatus: null, toStatus: DRAFT, changedAt: createdAt },
      ]
      if (reviewAt) history.push({ fromStatus: DRAFT, toStatus: IN_REVIEW, changedAt: reviewAt })
      if (publishedAt) history.push({ fromStatus: IN_REVIEW, toStatus: PUBLISHED, changedAt: publishedAt })

      await tx.content.create({
        data: {
          id: `seed_content_${String(index + 1).padStart(2, '0')}`,
          title: content.title,
          body: content.body || null,
          type: content.type,
          platform: content.type === SOCIAL_POST ? content.platform ?? null : null,
          status: content.status,
          clientId: clientIds.get(content.client)!,
          scheduledAt: content.scheduled !== undefined ? at(content.scheduled, 10) : null,
          publishedAt,
          createdAt,
          statusChangedAt: history.at(-1)!.changedAt,
          updatedAt: history.at(-1)!.changedAt,
          statusChanges: { create: history },
        },
      })
    }
  })
  return { clients: CLIENTS.length, contents: CONTENTS.length }
}
