import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { BIBLE_BOOKS } from "./bible-books";
import { BIBLE_TEXT } from "./bible-verses";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "kecemasan", name: "Kecemasan", icon: "wind" },
  { slug: "keluarga", name: "Keluarga", icon: "home" },
  { slug: "pekerjaan", name: "Pekerjaan", icon: "briefcase" },
  { slug: "pengampunan", name: "Pengampunan", icon: "hand-heart" },
  { slug: "iman", name: "Iman", icon: "flame" },
  { slug: "pengharapan", name: "Pengharapan", icon: "sunrise" },
  { slug: "syukur", name: "Syukur", icon: "gift" },
];

const DEVOTIONS: Array<{
  title: string;
  excerpt: string;
  body: string;
  bibleRefs: string;
  readingTimeMin: number;
  category: string;
  status: "published" | "pending" | "draft" | "rejected";
  daysAgo: number;
}> = [
  {
    title: "Tenang di Tengah Badai",
    excerpt: "Ketika kekhawatiran memenuhi pikiran, Tuhan mengundang kita untuk menyerahkan semuanya kepada-Nya.",
    body: "Kecemasan sering datang tanpa diundang — lewat tagihan yang menumpuk, kabar yang mengkhawatirkan, atau masa depan yang tidak pasti. Filipi 4:6-7 mengingatkan kita untuk tidak khawatir tentang apa pun, melainkan menyatakan setiap pergumulan kepada Allah dalam doa dan ucapan syukur.\n\nIni bukan berarti kita berpura-pura baik-baik saja. Justru sebaliknya: kita diundang untuk jujur di hadapan Tuhan dengan segala kekhawatiran kita. Dan janji-Nya luar biasa — damai sejahtera Allah yang melampaui akal akan menjaga hati dan pikiran kita.\n\nHari ini, cobalah tuliskan satu kekhawatiran terbesarmu, lalu doakan dengan ucapan syukur. Serahkan, dan biarkan damai sejahtera-Nya bekerja.",
    bibleRefs: "Filipi 4:6-7, 1 Petrus 5:6-7",
    readingTimeMin: 3,
    category: "kecemasan",
    status: "published",
    daysAgo: 0,
  },
  {
    title: "Rumah yang Dibangun di Atas Kasih",
    excerpt: "Keluarga yang kuat bukan yang tanpa masalah, tetapi yang berakar pada kasih dan pengampunan.",
    body: "Setiap keluarga punya musim sulitnya sendiri — kesalahpahaman, perbedaan pendapat, luka lama yang belum sembuh. Namun Kolose 3:12-14 mengajak kita mengenakan kasih sebagai pengikat yang mempersatukan segala kebajikan lainnya: kemurahan hati, kerendahan hati, kesabaran.\n\nRumah tangga yang kokoh bukan dibangun dari kesempurnaan, melainkan dari kesediaan untuk terus saling mengampuni dan bertumbuh bersama, hari demi hari.\n\nDoakan satu anggota keluargamu hari ini — bukan supaya mereka berubah, tetapi supaya kasihmu kepada mereka semakin serupa dengan kasih Kristus.",
    bibleRefs: "Kolose 3:12-14, Amsal 24:3",
    readingTimeMin: 4,
    category: "keluarga",
    status: "published",
    daysAgo: 1,
  },
  {
    title: "Bekerja Seperti untuk Tuhan",
    excerpt: "Pekerjaan sehari-hari, sekecil apa pun, punya makna kekal ketika dilakukan bagi Tuhan.",
    body: "Senin pagi bisa terasa berat. Deadline, atasan yang menuntut, rekan kerja yang sulit. Tapi Kolose 3:23 memberi perspektif baru: \"Apa pun juga yang kamu perbuat, perbuatlah dengan segenap hatimu seperti untuk Tuhan dan bukan untuk manusia.\"\n\nIni mengubah cara kita memandang pekerjaan — dari sekadar mencari nafkah menjadi bentuk ibadah. Ketekunan, kejujuran, dan integritas kita di tempat kerja adalah kesaksian nyata tentang siapa yang kita sembah.\n\nHari ini, kerjakanlah satu tugas dengan kesadaran bahwa Tuhan melihat, dan Ia berkenan pada ketekunanmu.",
    bibleRefs: "Kolose 3:23-24, Amsal 16:3",
    readingTimeMin: 3,
    category: "pekerjaan",
    status: "published",
    daysAgo: 2,
  },
  {
    title: "Beban yang Dilepaskan Lewat Pengampunan",
    excerpt: "Mengampuni bukan membenarkan kesalahan orang lain, tetapi membebaskan hati kita sendiri.",
    body: "Menyimpan dendam terasa seperti membawa batu berat kemana-mana. Efesus 4:32 mengajak kita untuk ramah dan penuh kasih mesra seorang terhadap yang lain, dan saling mengampuni sebagaimana Allah dalam Kristus telah mengampuni kita.\n\nPengampunan bukanlah perasaan yang datang tiba-tiba, melainkan keputusan yang kita ambil berulang kali, kadang setiap hari, sampai lukanya benar-benar sembuh. Dan kita bisa melakukannya karena kita sendiri telah menerima pengampunan yang jauh lebih besar dari Kristus.\n\nApakah ada seseorang yang perlu kau ampuni hari ini? Mulailah dengan mendoakan mereka.",
    bibleRefs: "Efesus 4:31-32, Matius 6:14-15",
    readingTimeMin: 4,
    category: "pengampunan",
    status: "published",
    daysAgo: 3,
  },
  {
    title: "Iman yang Tidak Melihat, Tetapi Percaya",
    excerpt: "Iman sejati bertumbuh justru di tempat kita tidak bisa melihat jalan ke depan.",
    body: "Ibrani 11:1 mendefinisikan iman sebagai dasar dari segala sesuatu yang kita harapkan, bukti dari segala sesuatu yang tidak kita lihat. Iman bukan tentang memiliki semua jawaban, melainkan tentang mempercayai Pribadi yang memegang semua jawaban itu.\n\nAbraham berjalan tanpa tahu ke mana tujuannya. Musa memimpin bangsa tanpa peta. Namun mereka melangkah karena percaya pada karakter Allah, bukan pada kepastian keadaan.\n\nDi bagian hidupmu yang terasa gelap hari ini, ingatlah: iman bukan berarti tidak ada keraguan, tetapi memilih untuk tetap melangkah bersama Tuhan meski belum melihat ujungnya.",
    bibleRefs: "Ibrani 11:1-6, 2 Korintus 5:7",
    readingTimeMin: 5,
    category: "iman",
    status: "published",
    daysAgo: 4,
  },
  {
    title: "Harapan yang Tidak Mengecewakan",
    excerpt: "Di tengah situasi yang tampak buntu, pengharapan dalam Kristus tetap kokoh berdiri.",
    body: "Roma 5:3-5 memberi urutan yang tak terduga: kesengsaraan menghasilkan ketekunan, ketekunan menghasilkan tahan uji, dan tahan uji menghasilkan pengharapan. Pengharapan Kristen bukan optimisme buta, melainkan keyakinan yang teruji melalui proses.\n\nDan pengharapan itu tidak mengecewakan, karena kasih Allah telah dicurahkan dalam hati kita oleh Roh Kudus. Apa pun yang sedang kau hadapi, itu bukan akhir dari ceritamu.\n\nTuliskan satu hal yang kau harapkan dari Tuhan hari ini, dan serahkan waktunya kepada-Nya.",
    bibleRefs: "Roma 5:3-5, Yeremia 29:11",
    readingTimeMin: 4,
    category: "pengharapan",
    status: "published",
    daysAgo: 5,
  },
  {
    title: "Bersyukur dalam Segala Keadaan",
    excerpt: "Syukur bukan reaksi terhadap keadaan sempurna, melainkan pilihan hati yang mengubah cara pandang kita.",
    body: "1 Tesalonika 5:18 memerintahkan sesuatu yang sulit: mengucap syukur dalam segala hal. Bukan untuk segala hal — karena tidak semua yang terjadi baik — tetapi di dalam segala hal, kita bisa menemukan alasan untuk bersyukur.\n\nSyukur mengubah fokus kita dari apa yang kurang menjadi apa yang sudah kita terima. Ia melatih hati untuk mengenali kebaikan Tuhan bahkan di musim yang sulit.\n\nCobalah tuliskan tiga hal yang kau syukuri hari ini, sekecil apa pun itu.",
    bibleRefs: "1 Tesalonika 5:16-18, Mazmur 107:1",
    readingTimeMin: 3,
    category: "syukur",
    status: "published",
    daysAgo: 6,
  },
  {
    title: "Ketika Doa Terasa Sunyi",
    excerpt: "Tuhan tetap hadir bahkan ketika jawaban doa belum kita dengar.",
    body: "Ada musim-musim ketika langit terasa diam, dan doa-doa kita seolah menggema tanpa balasan. Mazmur 13 mengajarkan kita bahwa jujur meratap di hadapan Tuhan adalah bagian sah dari iman.\n\nDaud berseru, \"Berapa lama lagi, TUHAN?\" — namun ia mengakhiri mazmurnya dengan keyakinan, \"Aku hendak bernyanyi untuk TUHAN, sebab Ia telah berbuat baik kepadaku.\"\n\nKesunyian bukan berarti ketiadaan. Terus berdoa, terus menanti — Tuhan mendengar bahkan ketika Ia tampak diam.",
    bibleRefs: "Mazmur 13, Habakuk 2:3",
    readingTimeMin: 4,
    category: "iman",
    status: "published",
    daysAgo: 7,
  },
  {
    title: "Menjadi Teladan Bagi Anak-anak",
    excerpt: "Warisan iman terbesar bukan harta, melainkan teladan hidup yang kita tinggalkan.",
    body: "Ulangan 6:6-7 memerintahkan orang tua untuk menaruh firman Tuhan di dalam hati mereka sendiri lebih dulu, lalu mengajarkannya berulang-ulang kepada anak-anak — dalam percakapan sehari-hari, bukan hanya saat momen rohani formal.\n\nAnak-anak belajar iman lebih banyak dari apa yang mereka lihat dibanding apa yang mereka dengar. Kesabaran kita saat lelah, kejujuran kita saat tergoda berbohong, cara kita berdoa saat menghadapi masalah — semua itu menjadi pelajaran hidup bagi mereka.\n\nHari ini, jadilah teladan kecil yang menunjukkan siapa Tuhan bagi keluargamu.",
    bibleRefs: "Ulangan 6:4-9, Amsal 22:6",
    readingTimeMin: 4,
    category: "keluarga",
    status: "published",
    daysAgo: 8,
  },
  {
    title: "Istirahat adalah Bentuk Kepercayaan",
    excerpt: "Berhenti sejenak dari pekerjaan bukan tanda kemalasan, melainkan tanda percaya pada Tuhan yang mencukupi.",
    body: "Kita hidup di budaya yang mengagungkan kesibukan. Namun Tuhan sendiri memberi teladan beristirahat pada hari ketujuh penciptaan (Kejadian 2:2-3) — bukan karena Ia lelah, tetapi untuk menunjukkan pentingnya ritme kerja dan istirahat.\n\nMatius 11:28 mengundang kita, \"Marilah kepada-Ku, semua yang letih lesu dan berbeban berat, Aku akan memberi kelegaan kepadamu.\" Istirahat sejati bukan sekadar berhenti bekerja, tetapi menyerahkan kendali kepada Tuhan.\n\nBeranikah kau berhenti sejenak hari ini, dan percaya bahwa dunia tidak akan runtuh tanpamu bekerja?",
    bibleRefs: "Kejadian 2:2-3, Matius 11:28-30",
    readingTimeMin: 3,
    category: "pekerjaan",
    status: "published",
    daysAgo: 9,
  },
  {
    title: "Draft: Mengelola Amarah dengan Bijak",
    excerpt: "Amarah bukan dosa, tetapi cara kita meresponnya bisa menjadi dosa.",
    body: "Konten sedang disusun — akan membahas Efesus 4:26-27 tentang marah tanpa berbuat dosa.",
    bibleRefs: "Efesus 4:26-27",
    readingTimeMin: 3,
    category: "keluarga",
    status: "draft",
    daysAgo: 0,
  },
  {
    title: "Menanti Waktu Tuhan yang Sempurna",
    excerpt: "Kesabaran menanti adalah bentuk kepercayaan tertinggi kepada rencana Tuhan.",
    body: "Menunggu adalah salah satu ujian iman yang paling sering kita alami — menunggu pekerjaan, menunggu jodoh, menunggu pemulihan. Pengkhotbah 3:1 mengingatkan bahwa untuk segala sesuatu ada masanya.\n\nTuhan tidak pernah terlambat, dan Ia tidak pernah terlalu cepat. Waktu-Nya selalu sempurna, meski sering tidak sesuai jadwal yang kita inginkan.",
    bibleRefs: "Pengkhotbah 3:1-8, Mazmur 27:14",
    readingTimeMin: 4,
    category: "pengharapan",
    status: "pending",
    daysAgo: 0,
  },
  {
    title: "Kasih yang Sabar dan Murah Hati",
    excerpt: "Kasih sejati diuji bukan dalam kata-kata indah, tetapi dalam tindakan sehari-hari.",
    body: "1 Korintus 13 sering dibacakan di pernikahan, namun maknanya jauh melampaui hubungan romantis. Kasih yang sabar dan murah hati ini adalah panggilan bagi setiap hubungan kita — keluarga, sahabat, rekan kerja, bahkan orang asing.\n\nKasih semacam ini tidak datang secara alami; ia adalah buah dari Roh yang bekerja dalam hidup kita ketika kita memilih untuk taat.",
    bibleRefs: "1 Korintus 13:4-8",
    readingTimeMin: 3,
    category: "keluarga",
    status: "pending",
    daysAgo: 0,
  },
  {
    title: "Konten yang Perlu Direvisi",
    excerpt: "Ditolak karena referensi Alkitab kurang tepat, mohon direvisi.",
    body: "Draf renungan ini memerlukan revisi pada bagian penerapan agar lebih sesuai konteks ayat yang dikutip.",
    bibleRefs: "Yohanes 15:5",
    readingTimeMin: 3,
    category: "iman",
    status: "rejected",
    daysAgo: 0,
  },
];

const SERMONS = [
  {
    title: "Hidup dalam Anugerah, Bukan Usaha",
    description: "Memahami perbedaan mendasar antara agama yang berbasis usaha dan Injil yang berbasis anugerah Kristus.",
    pastor: "Pdt. Yohanes Kristanto",
    church: "GKY Harapan Baru",
    category: "iman",
    durationSec: 2745,
  },
  {
    title: "Keluarga yang Berpusat pada Kristus",
    description: "Prinsip-prinsip membangun rumah tangga yang menjadikan Kristus sebagai fondasi, bukan sekadar tradisi.",
    pastor: "Pdt. Maria Angelina",
    church: "GBI Rehobot",
    category: "keluarga",
    durationSec: 3120,
  },
  {
    title: "Ketika Doa Belum Terjawab",
    description: "Bagaimana tetap setia berdoa saat jawaban Tuhan tak kunjung datang, dan belajar dari mazmur ratapan.",
    pastor: "Pdt. Daniel Wijaya",
    church: "GKI Pondok Indah",
    category: "pengharapan",
    durationSec: 2510,
  },
  {
    title: "Mengelola Kecemasan dengan Iman",
    description: "Pendekatan praktis dan alkitabiah untuk menghadapi kecemasan di tengah tekanan hidup modern.",
    pastor: "Pdt. Ruth Simanjuntak",
    church: "GSJA Bukit Zaitun",
    category: "kecemasan",
    durationSec: 2200,
  },
  {
    title: "Etos Kerja Seorang Murid Kristus",
    description: "Menemukan makna panggilan Tuhan dalam pekerjaan sehari-hari, dari kantor hingga rumah tangga.",
    pastor: "Pdt. Samuel Hartono",
    church: "GKY Grand Wisata",
    category: "pekerjaan",
    durationSec: 2890,
  },
  {
    title: "Kuasa Pengampunan yang Membebaskan",
    description: "Kesaksian dan pengajaran tentang bagaimana pengampunan memulihkan hati yang terluka.",
    pastor: "Pdt. Grace Halim",
    church: "GBI Graha Bethany",
    category: "pengampunan",
    durationSec: 2675,
  },
];

// Self-hosted placeholder clip (public/media/sample-sermon.webm) so sermon
// playback works end-to-end with zero external dependency — no licensed
// sermon footage is bundled with this build. Real contributors provide a
// hosted video URL through the contributor sermon form (see SermonForm).
const SAMPLE_VIDEOS = ["/media/sample-sermon.webm"];

function daysAgoDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Seeding categories...");
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    categoryBySlug.set(c.slug, cat.id);
  }

  console.log("Seeding users...");
  const commonPassword = await hashPassword("Livyn123!");

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@livyn.app" },
    update: {},
    create: { name: "Super Admin Livyn", email: "superadmin@livyn.app", passwordHash: commonPassword, role: "super_admin", emailVerified: true },
  });
  const admin = await prisma.user.upsert({
    where: { email: "admin@livyn.app" },
    update: {},
    create: { name: "Admin Livyn", email: "admin@livyn.app", passwordHash: commonPassword, role: "admin", emailVerified: true },
  });
  await prisma.user.upsert({
    where: { email: "moderator@livyn.app" },
    update: {},
    create: { name: "Moderator Livyn", email: "moderator@livyn.app", passwordHash: commonPassword, role: "moderator", emailVerified: true },
  });
  const contributor1 = await prisma.user.upsert({
    where: { email: "kontributor@livyn.app" },
    update: {},
    create: {
      name: "Pdt. Yohanes Kristanto",
      email: "kontributor@livyn.app",
      passwordHash: commonPassword,
      role: "contributor",
      emailVerified: true,
      contributorProfile: {
        create: { displayName: "Pdt. Yohanes Kristanto", bio: "Gembala sidang, penulis renungan harian.", church: "GKY Harapan Baru", verified: true },
      },
    },
  });
  const contributor2 = await prisma.user.upsert({
    where: { email: "kontributor2@livyn.app" },
    update: {},
    create: {
      name: "Maria Angelina",
      email: "kontributor2@livyn.app",
      passwordHash: commonPassword,
      role: "contributor",
      emailVerified: true,
      contributorProfile: {
        create: { displayName: "Maria Angelina", bio: "Konselor keluarga & penulis.", church: "GBI Rehobot", verified: true },
      },
    },
  });
  const demoUser = await prisma.user.upsert({
    where: { email: "warga@livyn.app" },
    update: {},
    create: { name: "Warga Livyn", email: "warga@livyn.app", passwordHash: commonPassword, role: "user", emailVerified: true },
  });

  console.log("Seeding Bible books...");
  const bookIdByCode = new Map<string, string>();
  for (const b of BIBLE_BOOKS) {
    const book = await prisma.bibleBook.upsert({ where: { code: b.code }, update: {}, create: b });
    bookIdByCode.set(b.code, book.id);
  }

  console.log("Seeding Bible verses...");
  for (const chapter of BIBLE_TEXT) {
    const bookId = bookIdByCode.get(chapter.book);
    if (!bookId) continue;
    for (const [verse, text] of chapter.verses) {
      await prisma.bibleVerse.upsert({
        where: { bookId_chapter_verse_translation: { bookId, chapter: chapter.chapter, verse, translation: "TB" } },
        update: { text },
        create: { bookId, chapter: chapter.chapter, verse, text, translation: "TB" },
      });
    }
  }

  console.log("Seeding devotions...");
  const contributors = [contributor1, contributor2];
  for (let i = 0; i < DEVOTIONS.length; i++) {
    const d = DEVOTIONS[i];
    const author = contributors[i % contributors.length];
    const slug = slugify(d.title);
    const fields = {
      title: d.title,
      excerpt: d.excerpt,
      body: d.body,
      bibleRefs: d.bibleRefs,
      readingTimeMin: d.readingTimeMin,
      status: d.status,
      authorId: author.id,
      categoryId: categoryBySlug.get(d.category),
      publishDate: d.status === "published" ? daysAgoDate(d.daysAgo) : null,
      rejectReason: d.status === "rejected" ? "Referensi Alkitab kurang sesuai dengan isi, mohon direvisi." : null,
    };
    await prisma.devotion.upsert({
      where: { slug },
      update: fields,
      create: { ...fields, slug, viewCount: d.status === "published" ? Math.floor(Math.random() * 400) + 20 : 0 },
    });
  }

  console.log("Seeding sermons...");
  for (let i = 0; i < SERMONS.length; i++) {
    const s = SERMONS[i];
    const author = contributors[i % contributors.length];
    const slug = slugify(s.title);
    const fields = {
      title: s.title,
      description: s.description,
      videoUrl: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
      durationSec: s.durationSec,
      pastor: s.pastor,
      church: s.church,
      status: "published",
      authorId: author.id,
      categoryId: categoryBySlug.get(s.category),
      publishDate: daysAgoDate(i),
    };
    await prisma.sermon.upsert({
      where: { slug },
      update: fields,
      create: { ...fields, slug, thumbnailUrl: null, viewCount: Math.floor(Math.random() * 900) + 50 },
    });
  }

  console.log("Seeding prayer reminders for demo user...");
  const reminders = [
    { label: "Doa Pagi", slot: "morning", time: "06:00" },
    { label: "Doa Malam", slot: "evening", time: "21:00" },
  ];
  for (const r of reminders) {
    const existing = await prisma.prayerReminder.findFirst({ where: { userId: demoUser.id, label: r.label } });
    if (!existing) {
      await prisma.prayerReminder.create({
        data: { userId: demoUser.id, label: r.label, slot: r.slot, time: r.time, daysOfWeek: "0,1,2,3,4,5,6" },
      });
    }
  }

  console.log("Seeding settings...");
  await prisma.setting.upsert({
    where: { key: "app_name" },
    update: {},
    create: { key: "app_name", value: "Livyn" },
  });

  console.log("Done. Demo accounts (password: Livyn123!):");
  console.log("  superadmin@livyn.app / admin@livyn.app / moderator@livyn.app");
  console.log("  kontributor@livyn.app / kontributor2@livyn.app");
  console.log("  warga@livyn.app");
  void superAdmin;
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
