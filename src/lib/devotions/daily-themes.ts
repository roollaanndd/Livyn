/**
 * Curated daily devotion library.
 *
 * Rotates by Jakarta day key so every day of the year gets a themed devotion.
 * Content is deliberately kept in code (not DB) because the feature spec is
 * "one devotion per day, pre-designed themes" — not a CMS-editable list.
 */

export type DailyDevotion = {
  id: string;
  theme: string;
  title: string;
  verseRef: string;
  verseText: string;
  opening: string;
  unpacking: string;
  application: string;
  reflection: string[];
  prayer: string;
  accent: "sage" | "amber" | "rose" | "sky" | "violet" | "teal";
};

export const DAILY_DEVOTIONS: DailyDevotion[] = [
  {
    id: "kekuatan-di-tengah-badai",
    theme: "Ketenangan",
    title: "Kekuatan di Tengah Badai",
    verseRef: "Yesaya 41:10",
    verseText:
      "Janganlah takut, sebab Aku menyertai engkau, janganlah bimbang, sebab Aku ini Allahmu; Aku akan meneguhkan, bahkan akan menolong engkau; Aku akan memegang engkau dengan tangan kanan-Ku yang membawa kemenangan.",
    opening:
      "Pernahkah kamu merasa dunia seperti runtuh di sekitarmu? Pekerjaan yang tidak menentu, hubungan yang retak, kesehatan yang menurun — semua datang bersamaan seperti badai yang tidak terduga. Di momen-momen seperti itu, kata-kata di Yesaya 41:10 bukan sekadar ayat penghibur. Ini adalah janji nyata dari Tuhan yang mengenal setiap ketakutanmu.",
    unpacking:
      "Perhatikan urutan janji Tuhan di ayat ini: Aku menyertai — Aku meneguhkan — Aku menolong — Aku memegang. Tuhan tidak memulai dengan mengubah keadaanmu. Ia memulai dengan hadir. Karena kadang yang paling kita butuhkan bukan solusi, tapi kepastian bahwa kita tidak berjalan sendirian. Dan tangan yang memegangmu — kata Ibrani aslinya menunjuk pada tangan yang aktif menopang, bukan sekadar menyentuh. Ini gambaran seorang Bapa yang menggenggam anaknya erat-erat saat menyeberang jalan yang ramai.",
    application:
      "Coba jujur pada dirimu hari ini: apa yang paling kamu takutkan? Deadline yang menumpuk? Diagnosis yang belum jelas? Anak yang belum juga pulih? Bawa ketakutan itu ke hadapan Tuhan dengan spesifik — bukan doa umum, tapi doa yang menyebutkan nama, situasi, dan perasaanmu. Tuhan tidak takut dengan detail terberatmu. Ia justru ingin kamu datang tanpa filter.",
    reflection: [
      "Ketakutan apa yang paling nyata di hatimu saat ini?",
      "Kapan terakhir kamu merasakan penyertaan Tuhan secara konkret?",
      "Apa langkah kecil yang bisa kamu ambil hari ini sebagai bentuk percaya?",
    ],
    prayer:
      "Bapa, aku datang dengan hati yang lelah dan takut. Tapi aku percaya Engkau menyertaiku. Peganglah tanganku hari ini. Berikan aku kekuatan untuk melangkah, sekalipun aku belum tahu jalannya. Dalam nama Yesus, amin.",
    accent: "sage",
  },
  {
    id: "menemukan-damai-dalam-kekacauan",
    theme: "Damai",
    title: "Menemukan Damai dalam Kekacauan",
    verseRef: "Filipi 4:6-7",
    verseText:
      "Janganlah hendaknya kamu kuatir tentang apapun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur. Damai sejahtera Allah, yang melampaui segala akal, akan memelihara hati dan pikiranmu dalam Kristus Yesus.",
    opening:
      "Damai bukan berarti tidak ada masalah. Damai adalah tenang di tengah masalah. Rasul Paulus menulis kata-kata ini dari penjara — tempat yang seharusnya tidak melahirkan kalimat tentang damai. Tapi justru dari sana ia mengingatkan kita: damai sejahtera Allah tidak bergantung pada kondisi hidup.",
    unpacking:
      "Paulus tidak berkata 'jangan punya masalah'. Ia berkata 'jangan kuatir'. Ada perbedaan besar. Kekuatiran adalah pilihan; masalah kadang tidak. Kuncinya ada di kata 'nyatakanlah' — bukan simpan sendiri, bukan pura-pura kuat, bukan cari distraksi. Nyatakan pada Tuhan. Dan perhatikan: 'dengan ucapan syukur'. Bersyukur bukan karena masalahnya, tapi karena Tuhan yang mendengarkan. Damai yang dijanjikan bahkan 'melampaui segala akal' — artinya kadang kamu tidak bisa menjelaskan mengapa kamu tenang, tapi kamu tenang.",
    application:
      "Coba lakukan ini malam ini: tulis di kertas atau di HP tiga hal yang membuatmu kuatir. Lalu di sebelahnya, tulis tiga hal yang bisa kamu syukuri hari ini — sekecil apapun. Bawa keduanya dalam doa. Kamu akan terkejut betapa cepat perspektif berubah ketika syukur dan permohonan bertemu di hadapan Tuhan.",
    reflection: [
      "Apa yang paling menguras energi mentalmu minggu ini?",
      "Kapan terakhir kamu benar-benar mengucap syukur, bukan sekadar rutinitas?",
      "Bagaimana bentuk damai yang paling kamu rindukan hari ini?",
    ],
    prayer:
      "Tuhan, ampuni aku yang sering menyimpan kekuatiran sendiri seolah aku bisa menanggung semuanya. Aku serahkan hari ini dengan segala isinya. Beri aku damai-Mu yang melampaui akal, sehingga aku bisa istirahat sungguh-sungguh. Amin.",
    accent: "teal",
  },
  {
    id: "kasih-yang-tak-bersyarat",
    theme: "Kasih",
    title: "Kasih yang Tak Bersyarat",
    verseRef: "Roma 8:38-39",
    verseText:
      "Sebab aku yakin, bahwa baik maut, maupun hidup, baik malaikat-malaikat, maupun pemerintah-pemerintah, baik yang ada sekarang, maupun yang akan datang, atau kuasa-kuasa, baik yang di atas, maupun yang di bawah, ataupun sesuatu makhluk lain, tidak akan dapat memisahkan kita dari kasih Allah, yang ada dalam Kristus Yesus, Tuhan kita.",
    opening:
      "Kita hidup di dunia yang mengukur segalanya dengan syarat. Kamu diterima kalau berprestasi. Kamu dicintai kalau menyenangkan. Kamu dihargai kalau berguna. Setelah bertahun-tahun terbiasa dengan itu, wajar kalau kita membawa cara berpikir yang sama ketika mendekati Tuhan — seolah kasih-Nya juga harus 'dipantaskan'. Padahal Roma 8 mengatakan sebaliknya.",
    unpacking:
      "Perhatikan daftar Paulus: maut, hidup, malaikat, pemerintah, kuasa, masa lalu, masa depan, di atas, di bawah. Ia sengaja menyebut semua kategori yang bisa dipikirkan manusia — lalu berkata: tidak satupun bisa memisahkanmu. Bukan hanya kondisi eksternal — bahkan dirimu sendiri yang jatuh, gagal, atau menyimpang, tidak masuk daftar 'yang dapat memisahkan'. Kasih Tuhan bukan cair-mengalir; ia terikat pada karakter Tuhan sendiri, bukan pada performa kita.",
    application:
      "Hari ini, coba ganti cara kamu bicara pada dirimu sendiri. Ketika kamu gagal — dan pasti gagal, semua orang gagal — jangan langsung berpikir 'Tuhan pasti kecewa sama aku'. Ganti dengan: 'Tuhan masih mengasihiku, bahkan sekarang.' Bukan berarti dosa jadi ringan; berarti anugerah jadi lebih besar dari dosamu.",
    reflection: [
      "Apa yang selama ini membuatmu merasa 'kurang layak' di hadapan Tuhan?",
      "Kalau kamu tahu Tuhan mengasihimu tanpa syarat, apa yang akan berubah dalam hidupmu?",
      "Kepada siapa hari ini kamu bisa menunjukkan kasih 'tanpa syarat' yang serupa?",
    ],
    prayer:
      "Bapa, sulit rasanya menerima kasih yang tidak harus kubayar. Tapi hari ini aku belajar untuk berhenti berusaha 'layak' — dan mulai menerima kasih-Mu sebagai anugerah. Ubah cara aku memandang diriku dari mata-Mu. Amin.",
    accent: "rose",
  },
  {
    id: "mengampuni-bukan-melupakan",
    theme: "Pengampunan",
    title: "Mengampuni Bukan Melupakan",
    verseRef: "Efesus 4:32",
    verseText:
      "Tetapi hendaklah kamu ramah seorang terhadap yang lain, penuh kasih mesra dan saling mengampuni, sebagaimana Allah di dalam Kristus telah mengampuni kamu.",
    opening:
      "Ada perbedaan besar antara 'melupakan' dan 'mengampuni'. Melupakan berarti tidak mengingat lagi. Mengampuni berarti mengingat tapi memilih tidak menagih. Dan itulah yang paling sulit — karena mengampuni berarti melepaskan hakmu untuk membalas, sekalipun kamu memang berhak marah.",
    unpacking:
      "Paulus tidak menyuruh kita mengampuni seolah rasa sakit itu tidak nyata. Ia menyuruh kita mengampuni 'sebagaimana Allah dalam Kristus telah mengampuni kamu'. Pikirkan itu sejenak — Tuhan mengampuni kita bukan karena dosa kita kecil, tapi karena Ia besar. Bukan karena Ia tidak ingat, tapi karena Ia menanggung ingatannya di kayu salib. Pengampunan yang dituntut dari kita berasal dari sumur yang sama — bukan kekuatan kita untuk 'move on', tapi kesadaran akan seberapa besar kita sendiri diampuni.",
    application:
      "Ada nama yang terlintas di pikiranmu ketika membaca ini? Mungkin orang tua yang gagal memahami, pasangan yang mengkhianati, teman yang mengecewakan. Pengampunan tidak berarti hubungannya harus dipulihkan seperti sebelumnya — kadang batas tetap perlu. Tapi kamu bisa melepaskan beban ingin membalas. Doakan orang itu — sekalipun kamu tidak merasakan apa-apa saat berdoa. Perasaan menyusul komitmen.",
    reflection: [
      "Kepada siapa hatimu masih 'menyimpan tagihan'?",
      "Apa yang membuatmu sulit melepaskan luka itu?",
      "Bagaimana ingatanmu tentang diampuni Tuhan bisa membantumu hari ini?",
    ],
    prayer:
      "Tuhan Yesus, Engkau tahu betapa dalam luka yang aku tanggung. Tapi aku tahu juga betapa dalam Engkau mengampuniku. Beri aku kekuatan untuk melepaskan — bukan karena orang itu pantas, tapi karena aku ingin hidupku bebas. Amin.",
    accent: "amber",
  },
  {
    id: "ketika-doa-terasa-hambar",
    theme: "Doa",
    title: "Ketika Doa Terasa Hambar",
    verseRef: "Roma 8:26",
    verseText:
      "Demikian juga Roh membantu kita dalam kelemahan kita; sebab kita tidak tahu, bagaimana sebenarnya harus berdoa; tetapi Roh sendiri berdoa untuk kita kepada Allah dengan keluhan-keluhan yang tidak terucapkan.",
    opening:
      "Kita semua pernah di sana. Berlutut, tapi kata-kata tidak keluar. Membuka mulut, tapi terasa hampa. Seolah doa hanya memantul di langit-langit kamar. Rasanya seperti gagal jadi orang Kristen. Padahal justru di sanalah janji Roh Kudus paling relevan.",
    unpacking:
      "Paulus mengaku — 'kita tidak tahu bagaimana sebenarnya harus berdoa'. Bukan 'kita kurang latihan'. Bukan 'kita kurang iman'. Kita memang tidak tahu. Dan justru di situ Roh Kudus masuk. Ia berdoa untuk kita dengan 'keluhan yang tidak terucapkan' — bahasa asli menunjukkan erangan yang terlalu dalam untuk kata-kata. Artinya: hatimu yang sedih, yang bingung, yang kosong — Roh Kudus menerjemahkannya sempurna kepada Bapa. Doamu tidak bergantung pada kefasihanmu.",
    application:
      "Hari ini, izinkan dirimu berdoa dengan jujur — tidak perlu puitis, tidak perlu panjang. Kalau yang keluar hanya 'Tuhan, aku lelah', itu doa. Kalau yang keluar hanya airmata, itu doa. Kalau kamu bahkan tidak tahu harus bilang apa, duduk saja di hadirat-Nya — itu doa. Roh Kudus mengerti bahasa hati.",
    reflection: [
      "Kenapa doa terkadang terasa 'hambar' bagimu?",
      "Apa harapanmu tentang doa yang selama ini mungkin salah?",
      "Bagaimana rasanya tahu bahwa Roh Kudus berdoa untukmu?",
    ],
    prayer:
      "Roh Kudus, aku bersyukur Engkau berdoa untukku ketika aku tidak bisa berdoa untuk diriku sendiri. Ajari aku berdoa bukan dengan kata-kata besar, tapi dengan hati yang jujur. Amin.",
    accent: "violet",
  },
  {
    id: "percaya-di-tengah-ketidakpastian",
    theme: "Iman",
    title: "Percaya di Tengah Ketidakpastian",
    verseRef: "Amsal 3:5-6",
    verseText:
      "Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri. Akuilah Dia dalam segala lakumu, maka Ia akan meluruskan jalanmu.",
    opening:
      "Manusia tidak dirancang untuk hidup dengan ketidakpastian. Itu sebabnya kita membuat rencana, mengasuransikan segalanya, dan menganalisis setiap kemungkinan. Tapi hidup punya cara untuk mengingatkan kita: kontrol adalah ilusi. Dan justru di tengah ketidakpastian itu, Tuhan mengajak kita untuk percaya.",
    unpacking:
      "Perhatikan tiga hal di ayat ini: percaya 'segenap hati' — bukan setengah, bukan cadangan. Jangan bersandar pada 'pengertianmu sendiri' — bukan berarti tidak pakai otak, tapi jangan jadikan pengertianmu sebagai jangkar utama. Dan 'akuilah Dia dalam segala lakumu' — dalam bahasa Ibrani, kata 'akuilah' berarti 'kenali, sadari, libatkan'. Jadi bukan hanya doa singkat sebelum makan; ini gaya hidup di mana Tuhan dilibatkan dalam setiap keputusan.",
    application:
      "Ada keputusan yang sedang kamu pertimbangkan? Pekerjaan baru, hubungan, pilihan sekolah anak? Sebelum menganalisis semua pro dan kontra, mulai dari doa. Bukan 'Tuhan, berkati keputusanku' — tapi 'Tuhan, tunjukkan keinginan-Mu, dan beri aku hati yang mau taat, apapun jawaban-Mu'. Perbedaannya besar.",
    reflection: [
      "Di area mana kamu paling sulit 'melepas kontrol'?",
      "Kapan terakhir kamu mengambil keputusan besar dengan sungguh-sungguh melibatkan Tuhan?",
      "Apa artinya 'percaya segenap hati' bagimu hari ini?",
    ],
    prayer:
      "Tuhan, aku sering percaya kepada rencana dan pengertianku sendiri. Ampuni aku. Hari ini aku serahkan keputusan-keputusan yang di depanku ke tangan-Mu. Luruskan jalanku sesuai kehendak-Mu. Amin.",
    accent: "sky",
  },
  {
    id: "ketika-kegagalan-menghantui",
    theme: "Pemulihan",
    title: "Ketika Kegagalan Menghantui",
    verseRef: "2 Korintus 12:9",
    verseText:
      "Tetapi jawab Tuhan kepadaku: Cukuplah kasih karunia-Ku bagimu, sebab justru dalam kelemahanlah kuasa-Ku menjadi sempurna. Sebab itu terlebih suka aku bermegah atas kelemahanku, supaya kuasa Kristus turun menaungi aku.",
    opening:
      "Kegagalan tidak pernah terasa 'produktif' saat terjadi. Rasanya seperti diri kita dilecehkan oleh kenyataan. Bisnis yang bangkrut, hubungan yang berakhir, ujian yang tidak lulus, keputusan yang menyesal — kegagalan punya cara untuk menempel di identitas kita, seolah gagalnya berarti kita gagal sebagai manusia. Tapi Paulus menawarkan cara pandang lain.",
    unpacking:
      "Paulus berulang kali meminta Tuhan mengangkat 'duri dalam daging' — kelemahan yang menyiksanya. Tapi jawaban Tuhan bukan 'oke, aku angkat', melainkan 'cukuplah kasih karunia-Ku'. Kata Yunani 'sempurna' di ayat ini berarti 'menjadi utuh, mencapai tujuannya'. Kuasa Tuhan tidak dipertunjukkan paling nyata saat kita hebat. Justru saat kita rapuh, kekuatan-Nya terlihat paling jelas — karena tidak ada lagi kekuatan kita yang bisa mengambil kredit.",
    application:
      "Berhenti sebentar. Apa kegagalan yang kamu bawa hari ini? Tuhan tidak mengukur kamu dari sana. Ia justru berkata: dari titik itulah aku bisa mulai membangunmu — asal kamu berhenti pura-pura kuat. Berikan kegagalanmu sebagai bahan baku, bukan bukti kekalahan.",
    reflection: [
      "Kegagalan mana yang masih membuatmu malu atau minder?",
      "Bagaimana cara Tuhan bisa memakai kelemahanmu untuk kebaikan?",
      "Apa yang perlu kamu lepaskan dari 'perfeksionisme' hari ini?",
    ],
    prayer:
      "Bapa, terima kasih karena kegagalanku tidak menakutkan-Mu. Aku serahkan luka-luka dari kegagalanku. Pakai kelemahanku untuk menyatakan kuasa-Mu. Aku tidak perlu sempurna — aku hanya perlu Engkau. Amin.",
    accent: "sage",
  },
  {
    id: "menerima-diri-apa-adanya",
    theme: "Identitas",
    title: "Menerima Diri Apa Adanya",
    verseRef: "Mazmur 139:14",
    verseText:
      "Aku bersyukur kepada-Mu oleh karena kejadianku dahsyat dan ajaib; ajaib apa yang Kaubuat, dan jiwaku benar-benar menyadarinya.",
    opening:
      "Media sosial adalah museum orang lain hidup di versi terbaiknya. Dan kita — dengan wajah tanpa filter, hidup dengan pergumulan yang tidak di-upload — merasa seperti kita ketinggalan. Padahal Daud, jauh sebelum ada Instagram, sudah menuliskan kebenaran ini: kamu adalah karya Tuhan yang dahsyat dan ajaib.",
    unpacking:
      "Kata Ibrani untuk 'dahsyat' di ayat ini berarti 'terpisah, berbeda, dibedakan dengan hormat'. Bukan sekadar 'unik' seperti obrolan motivator. Tuhan sengaja membuatmu berbeda — bukan karena kekurangan-Nya untuk membuat duplikat, tapi karena setiap orang punya panggilan yang tidak bisa digantikan orang lain. Tinggi badan, warna kulit, gaya berpikir, bahkan luka masa lalumu — semuanya dipakai Tuhan untuk membentuk siapa kamu hari ini.",
    application:
      "Coba lihat cermin hari ini bukan dengan mata kritik, tapi dengan mata syukur. Bukan 'aku kurang ini, kurang itu' — tapi 'Tuhan, terima kasih Engkau membuatku seperti ini, karena ada tujuan yang Engkau siapkan untuk hidup ini'. Perubahan hati mulai dari cara kita berbicara pada diri sendiri.",
    reflection: [
      "Bagian dari dirimu mana yang paling sulit kamu terima?",
      "Bagaimana kalau Tuhan justru merancang bagian itu untuk tujuan tertentu?",
      "Apa satu hal yang bisa kamu syukuri tentang dirimu hari ini?",
    ],
    prayer:
      "Bapa, terima kasih karena Engkau membuatku dengan sengaja. Ampuni aku yang sering membanding-bandingkan diri. Ajari aku menerima diriku sebagai karya-Mu, bukan sebagai kesalahan. Amin.",
    accent: "rose",
  },
  {
    id: "bersyukur-ketika-sulit",
    theme: "Syukur",
    title: "Bersyukur Ketika Sulit",
    verseRef: "1 Tesalonika 5:16-18",
    verseText:
      "Bersukacitalah senantiasa. Tetaplah berdoa. Mengucap syukurlah dalam segala hal, sebab itulah yang dikehendaki Allah di dalam Kristus Yesus bagi kamu.",
    opening:
      "Ada yang terasa kejam dari perintah 'mengucap syukur dalam segala hal'. Termasuk ketika kehilangan? Termasuk ketika sakit? Termasuk ketika difitnah? Rasanya seperti gaslighting rohani. Tapi Paulus bukan mengajak kita mengabaikan rasa sakit — ia mengajak kita menemukan Tuhan di dalamnya.",
    unpacking:
      "Perhatikan: 'mengucap syukurlah DALAM segala hal', bukan 'UNTUK segala hal'. Bedanya penting. Kita tidak dituntut bersyukur untuk kanker, untuk perceraian, untuk PHK. Tapi bahkan di dalam situasi itu, ada hal-hal yang bisa disyukuri: pelukan teman, air mata yang keluar, iman yang bertahan, doa orang tua, kesehatan kaki yang masih bisa berjalan. Syukur bukan sikap mengabaikan; ia adalah sikap menyaring dan menemukan sisa terang.",
    application:
      "Malam ini sebelum tidur, coba tulis tiga hal yang kamu syukuri hari ini — sekecil apapun. Kopi pagi yang enak. Sinar matahari yang menembus kamar. Anak yang tertawa. Nafas yang masih kamu punya. Latihan ini mengalihkan fokus dari 'apa yang kurang' ke 'apa yang ada'. Dalam waktu, kamu akan melihat: berkat Tuhan lebih banyak dari yang kamu sadari.",
    reflection: [
      "Kapan terakhir kamu sungguh-sungguh berhenti untuk bersyukur?",
      "Situasi apa yang saat ini paling sulit untuk 'dicari sisi baiknya'?",
      "Apa satu berkat kecil yang bisa kamu syukuri sekarang juga?",
    ],
    prayer:
      "Tuhan, ampuni aku yang lebih mudah menghitung masalah daripada menghitung berkat. Bukalah mataku untuk melihat kebaikan-Mu bahkan di tengah kesulitan. Terima kasih untuk hari ini. Amin.",
    accent: "amber",
  },
  {
    id: "menghadapi-rasa-cemas",
    theme: "Ketenangan",
    title: "Menghadapi Rasa Cemas",
    verseRef: "Matius 6:34",
    verseText:
      "Sebab itu janganlah kamu kuatir akan hari besok, karena hari besok mempunyai kesusahannya sendiri. Kesusahan sehari cukuplah untuk sehari.",
    opening:
      "Kecemasan modern jarang tentang hari ini. Ia hampir selalu tentang 'apa yang akan terjadi kalau...'. Bagaimana kalau bulan depan kena PHK? Bagaimana kalau anak salah bergaul? Bagaimana kalau relasiku memburuk? Otak kita sibuk membangun skenario yang mungkin tidak pernah terjadi — dan kita hidup dalam ketegangan permanen. Yesus mengajarkan cara lain.",
    unpacking:
      "Ayat ini tidak berkata 'jangan rencanakan besok'. Ada perbedaan antara merencanakan dan mencemaskan. Merencanakan itu bijak; mencemaskan itu menyakiti dirimu untuk masalah yang belum tentu ada. Yesus mengingatkan: kesusahan hari ini sudah cukup. Fokusmu untuk hari ini adalah menghidupinya dengan setia. Besok, Tuhan yang sama akan hadir. Dan besok, Ia akan memberikan anugerah untuk masalah besok — bukan hari ini.",
    application:
      "Coba latihan sederhana ini: ketika pikiran mulai berputar ke 'bagaimana kalau...', tarik napas dan tanya diri 'apa yang bisa aku lakukan HARI INI?'. Kalau ada yang bisa dilakukan, lakukan. Kalau tidak ada, serahkan. Rumus sederhana ini bisa mengurangi 80% kecemasanmu.",
    reflection: [
      "Skenario 'apa kalau...' apa yang paling sering menghantuimu?",
      "Berapa banyak dari kecemasanmu tahun lalu yang ternyata benar-benar terjadi?",
      "Apa satu langkah kecil untuk 'HARI INI' yang bisa kamu lakukan?",
    ],
    prayer:
      "Bapa, ajari aku hidup satu hari pada satu waktu. Aku serahkan hari besok kepada-Mu — karena Engkau sudah di sana lebih dulu daripada aku. Hari ini, aku memilih taat, tidak takut. Amin.",
    accent: "teal",
  },
  {
    id: "kekuatan-kata-kata",
    theme: "Karakter",
    title: "Kekuatan Kata-Kata",
    verseRef: "Amsal 18:21",
    verseText: "Hidup dan mati dikuasai lidah, siapa suka menggemakannya, akan memakan buahnya.",
    opening:
      "Kata-kata bisa membangun atau menghancurkan lebih cepat daripada tindakan. Ingatkah kamu satu kalimat menyakitkan yang diucapkan orang tua bertahun-tahun lalu? Atau satu pujian tulus dari guru yang masih membekas sampai sekarang? Kata-kata punya umur panjang di hati manusia. Dan setiap hari, kita punya pilihan: mau menjadi sumber hidup atau sumber luka.",
    unpacking:
      "Amsal berkata 'hidup dan mati dikuasai lidah'. Ini bukan hiperbola. Kata-kata mengubah realitas — pernikahan hancur karena kata-kata, karir naik karena kata-kata, anak-anak jadi percaya diri atau minder karena kata-kata orang tuanya. Dan bagian penting: 'siapa suka menggemakannya, akan memakan buahnya'. Kata-katamu tidak hanya mempengaruhi orang lain — kamu sendiri yang akan hidup dari buahnya, entah pahit atau manis.",
    application:
      "Hari ini, coba puasa dari satu jenis kata-kata: keluhan, kritik tajam, atau gosip. Ganti dengan doa dan pujian tulus. Kirim satu pesan singkat ke seseorang yang perlu didengar. Ucapkan satu kalimat penguatan ke pasangan atau anak. Kata-kata kecil, dampak besar.",
    reflection: [
      "Kata-kata siapa yang paling membentuk cara kamu memandang dirimu?",
      "Kata-kata apa yang kamu ucapkan yang mungkin melukai orang lain tanpa kamu sadari?",
      "Kepada siapa kamu bisa mengirimkan kata-kata yang membangun hari ini?",
    ],
    prayer:
      "Tuhan, jagalah mulutku. Biarlah kata-kataku menjadi sumber hidup, bukan racun. Ajari aku memilih kata dengan hati-hati, dan berani meminta maaf ketika salah. Amin.",
    accent: "amber",
  },
  {
    id: "rendah-hati-di-puncak",
    theme: "Karakter",
    title: "Rendah Hati di Puncak",
    verseRef: "Yakobus 4:10",
    verseText: "Rendahkanlah dirimu di hadapan Tuhan, dan Ia akan meninggikan kamu.",
    opening:
      "Rendah hati sering dianggap sifat pemenang yang gagal — orang yang seharusnya bangga tapi 'malu' menerima pujian. Padahal rendah hati bukan meremehkan diri; itu tahu tepat siapa dirimu di hadapan Tuhan. Dan justru orang yang paling stabil di puncak adalah mereka yang tahu semua yang mereka miliki adalah pemberian, bukan pencapaian.",
    unpacking:
      "Ayat ini menawarkan paradoks Kerajaan: jalan naik adalah jalan turun. Dunia mengajarkan 'promosikan dirimu' — Yakobus mengajarkan 'rendahkan dirimu'. Tapi bukan berarti pasif. Kata Yunani 'rendahkanlah' aktif — ini pilihan sadar untuk melihat diri dengan jujur dan tidak membesar-besarkan. Dan janjinya jelas: 'Ia akan meninggikan kamu'. Waktu Tuhan berbeda dari waktu kita, tapi karakter-Nya tidak berubah.",
    application:
      "Kalau kamu sedang di posisi kuat — pekerjaan, pengaruh, keluarga — ingat: itu bukan trofi. Itu tanggung jawab. Pertanyaan bagusnya bukan 'seberapa tinggi aku bisa naik?', tapi 'siapa yang bisa kubantu naik bersamaku?'. Kalau kamu sedang di posisi rendah, jangan minder. Rendah hati bukan rendah diri — kamu berharga di hadapan Tuhan, apapun posisi sosialmu.",
    reflection: [
      "Di area mana kamu sedang tergoda untuk 'mengambil kredit' yang seharusnya milik Tuhan?",
      "Bagaimana kamu bisa merayakan pencapaian tanpa kehilangan kerendahan hati?",
      "Siapa yang bisa kamu angkat naik bersamamu hari ini?",
    ],
    prayer:
      "Tuhan, jauhkan aku dari kesombongan yang halus. Ingatkan aku bahwa semua yang kupunya berasal dari-Mu. Ajari aku menggunakan apa yang Engkau berikan untuk memberkati orang lain. Amin.",
    accent: "sage",
  },
  {
    id: "sabar-menantikan-tuhan",
    theme: "Iman",
    title: "Sabar dalam Menantikan Tuhan",
    verseRef: "Mazmur 27:14",
    verseText:
      "Nantikanlah TUHAN! Kuatkanlah dan teguhkanlah hatimu! Ya, nantikanlah TUHAN!",
    opening:
      "Menunggu adalah ujian iman yang paling halus tapi paling menguras. Kita bisa taat dalam bertindak, tapi menunggu — tanpa jawaban, tanpa timeline — itu berat. Kesabaran diuji bukan saat mudah, tapi saat kita sudah berdoa berbulan-bulan dan seolah 'langit membisu'. Daud tahu perasaan itu. Dan ia mengulang perintah yang sama dua kali: 'Nantikanlah TUHAN!'",
    unpacking:
      "Kata Ibrani 'nantikan' di ayat ini bukan pasif — ia berarti 'menanti dengan penuh pengharapan, seperti orang yang menegangkan tali'. Bukan duduk mengeluh, tapi menanti dengan sikap aktif percaya. Dan perhatikan pengulangannya — Daud mengulang bukan karena lupa, tapi karena tahu betapa mudahnya kita menyerah. Menanti itu berat, tapi Tuhan menghargai orang yang menanti tanpa mengambil jalan pintas.",
    application:
      "Apa yang sedang kamu tunggu dari Tuhan? Jodoh, kesembuhan, kelahiran anak, karir yang diprediksi? Sambil menunggu, jangan biarkan hati mengeras. Latih iman: baca Firman setiap hari, dikelilingi komunitas yang sehat, layani orang lain sekalipun kamu belum menerima jawabanmu. Waktu menunggu adalah waktu Tuhan sedang bekerja — kadang mengubah situasi, kadang mengubah kamu.",
    reflection: [
      "Apa yang paling sulit kamu tunggu dari Tuhan saat ini?",
      "Apakah kamu tergoda mengambil 'jalan pintas' yang kamu tahu bukan kehendak-Nya?",
      "Bagaimana kamu bisa menanti dengan aktif, bukan pasif, hari ini?",
    ],
    prayer:
      "Bapa, sulit menunggu tanpa tahu sampai kapan. Beri aku hati yang tetap percaya bahkan ketika jawaban belum kelihatan. Aku pilih menanti-Mu, bukan mengambil jalan pintas. Amin.",
    accent: "violet",
  },
  {
    id: "kasih-sesama-yang-sulit",
    theme: "Kasih",
    title: "Kasih untuk Sesama yang Sulit",
    verseRef: "Lukas 6:27-28",
    verseText:
      "Kasihilah musuhmu, berbuatlah baik kepada orang yang membenci kamu; mintalah berkat bagi orang yang mengutuk kamu; berdoalah bagi orang yang mencaci kamu.",
    opening:
      "Perintah ini terdengar tidak realistis. Bagaimana mungkin mengasihi orang yang menyakiti kita? Tapi Yesus tidak sedang minta perasaan yang berubah dulu — Ia minta tindakan yang berubah dulu. Kasih Kristen bukan emosi; itu keputusan.",
    unpacking:
      "Perhatikan empat perintah Yesus, semuanya kata kerja: kasihilah, berbuatlah baik, mintalah berkat, berdoalah. Tidak satupun tentang perasaan. Ini bukan berarti perasaan tidak penting — tapi Yesus tahu perasaan sering menyusul tindakan. Ketika kamu memilih memberkati orang yang menyakiti, ada sesuatu di hatimu yang perlahan berubah. Bukan orang itu yang berubah — kamu yang berubah, dilepaskan dari rantai pahit.",
    application:
      "Ada orang di hidupmu yang membuat darahmu naik hanya dengan mendengar namanya? Doakan orang itu hari ini. Bukan doa 'Tuhan, sadarkan dia' — tapi doa berkat: 'Tuhan, berkati dia, ubah dia dengan kasih-Mu'. Rasanya aneh dan sulit di awal. Tapi lakukan. Perasaan menyusul komitmen.",
    reflection: [
      "Siapa yang paling sulit kamu kasihi saat ini?",
      "Apa yang membuatmu enggan mendoakan berkat baginya?",
      "Bagaimana Tuhan bisa mengubah hatimu jika kamu mulai memberkati dia hari ini?",
    ],
    prayer:
      "Tuhan Yesus, Engkau memberkati mereka yang menyalibkan-Mu. Ajari aku mengasihi dengan cara yang sama. Beri aku hati yang bisa memberkati bahkan orang yang menyakiti. Amin.",
    accent: "rose",
  },
  {
    id: "ketika-merasa-sendirian",
    theme: "Kehadiran Tuhan",
    title: "Ketika Merasa Sendirian",
    verseRef: "Ibrani 13:5",
    verseText:
      "Aku sekali-kali tidak akan membiarkan engkau dan Aku sekali-kali tidak akan meninggalkan engkau.",
    opening:
      "Kesepian modern jarang berarti tidak ada orang di sekeliling kita. Ia berarti tidak ada yang benar-benar mengerti. Kamu bisa di ruangan penuh orang dan tetap merasa asing. Kamu bisa punya keluarga besar dan tetap kehilangan siapa yang bisa dipercaya untuk cerita 'yang sebenarnya'. Di titik ini, janji Ibrani 13:5 bukan pemanis — itu penopang.",
    unpacking:
      "Bahasa Yunani ayat ini menggunakan bentuk penekanan berlapis — bisa diterjemahkan harfiah: 'Aku sekali-kali, sekali-kali, sekali-kali tidak akan meninggalkan engkau'. Penulis Ibrani ingin memastikan kita tidak salah dengar. Tuhan tahu bagaimana rasa kesepian bisa membuat kita meragukan kasih-Nya. Jadi Ia berjanji dengan bahasa paling kuat: kehadiran-Nya bukan bergantung pada perasaanmu; ia fakta yang tidak tergoyahkan.",
    application:
      "Ketika kesepian datang, jangan segera cari distraksi — media sosial, makanan, kerja lembur. Coba diam sebentar dan sadar: Tuhan hadir di sini, sekarang. Bicara pada-Nya seperti pada teman yang duduk di sebelahmu. Karena secara rohani, itulah realitasnya.",
    reflection: [
      "Kapan kamu paling sering merasa sendirian?",
      "Apa yang biasanya kamu lakukan untuk melarikan diri dari perasaan itu?",
      "Bagaimana kamu bisa mengundang Tuhan ke momen paling sepimu?",
    ],
    prayer:
      "Tuhan, terima kasih Engkau selalu bersamaku sekalipun aku tidak merasakannya. Latih hatiku untuk sadar akan kehadiran-Mu, terutama di momen-momen sepi. Amin.",
    accent: "sky",
  },
  {
    id: "berjalan-dalam-terang",
    theme: "Kekudusan",
    title: "Berjalan dalam Terang",
    verseRef: "1 Yohanes 1:7",
    verseText:
      "Tetapi jika kita hidup di dalam terang sama seperti Dia ada di dalam terang, maka kita beroleh persekutuan seorang dengan yang lain, dan darah Yesus, Anak-Nya itu, menyucikan kita dari pada segala dosa.",
    opening:
      "Ada godaan halus untuk 'menyembunyikan' bagian gelap dari hidup kita — dari Tuhan, dari komunitas, bahkan dari diri sendiri. Kita berpikir kalau kita ignore, itu akan hilang. Padahal justru sebaliknya: yang tersembunyi tumbuh lebih besar. Berjalan dalam terang berarti berani jujur, dengan Tuhan dan dengan orang percaya lainnya.",
    unpacking:
      "Yohanes menghubungkan dua hal: berjalan dalam terang → persekutuan dengan sesama → penyucian dari dosa. Persekutuan sejati tidak mungkin terjadi di kegelapan. Sebaliknya, ketika kita berani jujur tentang pergumulan, di situ terjadi pemulihan. Bukan berarti setiap orang perlu tahu segalanya — tapi kita perlu setidaknya satu orang yang tahu 'semuanya' dan tetap mendukung kita.",
    application:
      "Adakah dosa atau pergumulan yang kamu sembunyikan? Rahasia itu justru yang paling menahan pertumbuhanmu. Doakan Tuhan menunjukkan satu orang yang dapat kamu percaya untuk cerita — pendeta, mentor, teman rohani. Cahaya menghancurkan kekuatan yang gelap.",
    reflection: [
      "Ada bagian hidupmu yang kamu 'sembunyikan' dari Tuhan atau sesama?",
      "Siapa satu orang yang bisa jadi tempatmu jujur secara aman?",
      "Apa langkah kecil menuju kehidupan yang lebih transparan hari ini?",
    ],
    prayer:
      "Tuhan, aku sering takut jujur karena takut dihakimi. Beri aku keberanian untuk berjalan dalam terang-Mu. Kirimkan orang-orang percaya yang bisa menemaniku dengan aman. Amin.",
    accent: "amber",
  },
  {
    id: "menghadapi-godaan",
    theme: "Kekudusan",
    title: "Menghadapi Godaan",
    verseRef: "1 Korintus 10:13",
    verseText:
      "Pencobaan-pencobaan yang kamu alami ialah pencobaan-pencobaan biasa, yang tidak melebihi kekuatan manusia. Sebab Allah setia dan karena itu Ia tidak akan membiarkan kamu dicobai melampaui kekuatanmu. Pada waktu kamu dicobai Ia akan memberikan kepadamu jalan ke luar, sehingga kamu dapat menanggungnya.",
    opening:
      "Setiap orang tergoda. Perbedaannya bukan siapa yang bergumul dan siapa yang tidak — perbedaannya bagaimana kita merespon. Godaan bukan dosa; menyerah pada godaan itu yang dosa. Dan Paulus mengingatkan: kamu tidak sendirian dalam pergumulanmu, dan selalu ada jalan keluar.",
    unpacking:
      "Ayat ini memberikan tiga fakta penting: (1) godaanmu 'biasa' — orang lain juga bergumul dengan hal serupa, jadi jangan malu. (2) Tuhan tidak akan membiarkan lebih dari yang sanggup kamu tanggung — bukan karena Ia meremehkan, tapi karena Ia mengetahui kapasitasmu. (3) Selalu ada jalan keluar. Bukan berarti pintu ajaib, tapi opsi yang bisa kamu ambil: berdoa, pergi dari situasi, hubungi teman rohani, ingat konsekuensi.",
    application:
      "Kalau kamu sedang bergumul dengan godaan spesifik — pornografi, keserakahan, gosip, kemarahan — buatlah 'jalan keluar' konkret sebelum godaan datang. Misalnya: instal filter di HP, hindari lokasi tertentu, beri tahu satu orang yang bisa menegurmu. Persiapan mengalahkan reaksi.",
    reflection: [
      "Godaan apa yang paling sering kamu hadapi?",
      "Kapan biasanya godaan itu paling kuat menyerang?",
      "'Jalan keluar' apa yang bisa kamu siapkan hari ini?",
    ],
    prayer:
      "Tuhan, aku tahu Engkau setia sekalipun aku sering jatuh. Beri aku kepekaan untuk melihat jalan keluar yang Engkau sediakan. Kuatkan aku untuk memilih taat, bukan menyerah. Amin.",
    accent: "sage",
  },
  {
    id: "kekuatan-sukacita",
    theme: "Sukacita",
    title: "Kekuatan Sukacita",
    verseRef: "Nehemia 8:11",
    verseText:
      "Lalu berkatalah ia kepada mereka: Pergilah kamu, makanlah sedap-sedapan dan minumlah minuman manis dan kirimlah sebagian kepada mereka yang tidak sedia apa-apa, karena hari ini adalah kudus bagi Tuhan kita! Jangan kamu bersusah hati, sebab sukacita karena TUHAN itulah perlindunganmu!",
    opening:
      "Sukacita berbeda dari kebahagiaan. Kebahagiaan bergantung pada 'happening' — hal-hal yang terjadi. Sukacita adalah anugerah yang tidak berubah dengan cuaca hidup. Nehemia menemukan bangsa Israel menangis mendengar Firman — tapi ia justru mengingatkan mereka: hari ini kudus. Bergembiralah. Karena sukacita bukan sekadar mood — ia perlindungan.",
    unpacking:
      "Kata Ibrani 'perlindungan' di ayat ini bisa juga diterjemahkan 'benteng' atau 'kekuatan'. Sukacita di dalam Tuhan bukan sesuatu yang lemah — ia justru berfungsi sebagai benteng. Orang yang punya sukacita rohani tidak mudah dirobohkan oleh badai. Bukan karena hidupnya mudah, tapi karena sumber sukacitanya tidak tergantung pada situasi.",
    application:
      "Sukacita dilatih, bukan ditunggu. Mulailah dengan hal kecil: bersyukur pagi ini, ingat satu kebaikan Tuhan minggu lalu, kirim pesan penguatan ke seseorang, dengar lagu pujian di perjalanan. Latihan-latihan kecil ini membangun benteng sukacita di hatimu.",
    reflection: [
      "Kapan terakhir kamu merasa sukacita rohani yang murni?",
      "Apa yang paling menguras sukacitamu belakangan ini?",
      "Apa satu praktik kecil yang bisa memelihara sukacita hari ini?",
    ],
    prayer:
      "Bapa, ampuni aku yang membiarkan situasi mencuri sukacitaku. Kembalikan sukacita karena mengenal Engkau. Biarlah itu jadi benteng yang menjagaku dari keputusasaan. Amin.",
    accent: "amber",
  },
  {
    id: "pengharapan-yang-tak-padam",
    theme: "Pengharapan",
    title: "Pengharapan yang Tak Padam",
    verseRef: "Roma 15:13",
    verseText:
      "Semoga Allah, sumber pengharapan, memenuhi kamu dengan segala sukacita dan damai sejahtera dalam iman kamu, supaya oleh kekuatan Roh Kudus kamu berlimpah-limpah dalam pengharapan.",
    opening:
      "Pengharapan berbeda dari optimisme. Optimisme berkata 'semoga hal baik terjadi'. Pengharapan Kristen berkata 'Tuhan yang berdaulat menghidupi masa depanku, jadi apapun terjadi, ada tujuan'. Perbedaannya besar. Optimisme runtuh saat kenyataan sulit; pengharapan tetap berdiri.",
    unpacking:
      "Paulus menyebut Allah sebagai 'sumber pengharapan' — bukan objek pengharapan, tapi sumbernya. Artinya pengharapan sejati mengalir dari mengenal Tuhan, bukan dari mengatur kondisi hidup. Dan ada urutan menarik: iman → sukacita dan damai → berlimpah pengharapan. Ketika iman kita kuat, damai dan sukacita hadir sebagai buah, dan itulah yang membuat pengharapan meluap.",
    application:
      "Kalau pengharapanmu sedang tipis, jangan mulai dari 'aku harus optimis'. Mulai dari 'aku harus mengenal Tuhan lebih dalam'. Baca Alkitab bukan untuk kewajiban, tapi untuk mendengar suara-Nya. Doakan bukan sekadar daftar, tapi percakapan. Pengharapan lahir dari intimasi, bukan dari afirmasi diri.",
    reflection: [
      "Di area mana pengharapanmu sedang tipis?",
      "Apa yang selama ini kamu andalkan sebagai 'sumber' pengharapan?",
      "Bagaimana kamu bisa mendalam relasimu dengan Tuhan minggu ini?",
    ],
    prayer:
      "Bapa, Engkau sumber pengharapanku, bukan kondisi hidupku. Penuhi aku dengan sukacita dan damai dalam iman. Biarlah pengharapan berlimpah dari-Mu memenuhi hatiku hari ini. Amin.",
    accent: "sky",
  },
  {
    id: "ketika-merasa-tidak-cukup",
    theme: "Identitas",
    title: "Ketika Merasa Tidak Cukup",
    verseRef: "2 Korintus 3:5",
    verseText:
      "Dengan diri kami sendiri kami tidak sanggup untuk memperhitungkan sesuatu seolah-olah pekerjaan kami sendiri; tidak, kesanggupan kami adalah pekerjaan Allah.",
    opening:
      "Ada suara kecil di kepala kita yang sering berbisik: 'kamu tidak cukup'. Tidak cukup pintar untuk pekerjaan itu. Tidak cukup baik untuk pernikahan itu. Tidak cukup rohani untuk pelayanan itu. Suara itu bisa melumpuhkan. Padahal Paulus mengingatkan: memang kita tidak cukup — dan itu bukan masalah. Kesanggupan kita berasal dari Tuhan.",
    unpacking:
      "Perhatikan pengakuan Paulus: 'kami tidak sanggup'. Ini datang dari rasul yang menulis sepertiga Perjanjian Baru! Kalau Paulus mengaku tidak sanggup, kita tidak perlu berpura-pura. Justru dari titik pengakuan itulah anugerah Tuhan mengalir. Dunia mengajarkan 'kamu cukup, percaya pada dirimu sendiri'. Injil mengajarkan 'kamu tidak cukup, tapi Tuhan cukup — dan Ia bekerja melaluimu'.",
    application:
      "Kalau kamu di posisi merasa 'tidak cukup', berhenti mencoba 'membuktikan diri'. Datang pada Tuhan dengan tangan kosong dan berkata: 'Tuhan, aku tidak sanggup. Aku butuh Engkau'. Kekosongan yang kamu akui adalah tempat Tuhan mengisi.",
    reflection: [
      "Di area mana kamu paling sering merasa 'tidak cukup'?",
      "Apa yang selama ini kamu andalkan untuk menutupi rasa tidak cukup itu?",
      "Bagaimana rasanya membiarkan Tuhan yang menjadi 'kesanggupanmu'?",
    ],
    prayer:
      "Tuhan, aku mengaku aku tidak sanggup. Tapi aku tahu Engkau cukup. Ambil kelemahanku dan pakai untuk kemuliaan-Mu. Aku tidak perlu 'membuktikan diri' — aku hanya perlu setia. Amin.",
    accent: "violet",
  },
  {
    id: "iman-sebesar-biji-sesawi",
    theme: "Iman",
    title: "Iman Sebesar Biji Sesawi",
    verseRef: "Matius 17:20",
    verseText:
      "Sesungguhnya sekiranya kamu mempunyai iman sebesar biji sesawi saja kamu dapat berkata kepada gunung ini: Pindah dari tempat ini ke sana, maka gunung ini akan pindah, dan takkan ada yang mustahil bagimu.",
    opening:
      "Kita sering berpikir iman itu tentang ukuran — seberapa yakin, seberapa besar. Padahal Yesus mengubah cara pandang itu. Iman sebesar biji sesawi — bijinya kecil banget, sekitar 1-2 mm — cukup untuk memindahkan gunung. Kuncinya bukan ukuran iman, tapi obyek iman.",
    unpacking:
      "Yesus tidak berkata 'kamu perlu iman raksasa'. Ia berkata 'iman sebesar biji sesawi cukup'. Kenapa? Karena yang membuat iman bekerja bukan besarnya iman, tapi besarnya Tuhan yang jadi obyek iman itu. Iman kecil pada Tuhan yang besar lebih berkuasa daripada iman besar pada diri sendiri. Ini melepaskan tekanan — kamu tidak perlu jadi 'raksasa iman'. Kamu hanya perlu mengarahkan iman kecilmu pada Tuhan yang tak terbatas.",
    application:
      "Ada 'gunung' di hidupmu — masalah yang kelihatan mustahil digerakkan? Kamu tidak perlu punya iman raksasa untuk berdoa tentangnya. Yang kamu perlu adalah keberanian untuk membawa gunung itu ke hadapan Tuhan yang bisa memindahkannya. Doakan hari ini dengan spesifik.",
    reflection: [
      "Apa 'gunung' yang selama ini kamu anggap terlalu besar untuk diberkati Tuhan?",
      "Bagaimana kamu bisa mengarahkan iman kecilmu kepada Tuhan yang besar hari ini?",
      "Kapan terakhir kamu melihat 'gunung berpindah' dalam hidupmu?",
    ],
    prayer:
      "Tuhan, aku sering merasa imanku terlalu kecil. Ingatkan aku bahwa yang penting bukan besarnya imanku, tapi besarnya Engkau. Aku bawa gunung-gunungku ke hadapan-Mu hari ini. Amin.",
    accent: "sage",
  },
  {
    id: "menyerahkan-beban",
    theme: "Ketenangan",
    title: "Menyerahkan Beban",
    verseRef: "Mazmur 55:23",
    verseText:
      "Serahkanlah kuatirmu kepada TUHAN, maka Ia akan memelihara engkau! Tidak untuk selama-lamanya dibiarkan-Nya orang benar itu goyah.",
    opening:
      "Ada bedanya antara 'membawa beban' dan 'digerus beban'. Kita tidak dirancang menanggung semua sendiri. Tuhan menciptakan bahu manusia untuk beberapa hal — bukan semuanya. Karena itu Daud memerintah dengan lembut: serahkanlah.",
    unpacking:
      "Kata Ibrani 'serahkanlah' berarti 'lemparkan' — bukan letakkan pelan-pelan, tapi lempar dengan sengaja. Ini bahasa yang aktif. Menyerahkan bukan sekadar 'melepaskan' — ini pilihan untuk menaruh beban di tempat yang mampu menanggungnya. Dan janjinya: 'Ia akan memelihara engkau'. Bukan berarti kamu tidak punya masalah, tapi kamu tidak sendirian dalam masalah itu.",
    application:
      "Hari ini, ambil selembar kertas. Tulis semua yang membebanimu — pekerjaan, hubungan, keuangan, kesehatan, orang yang kamu kuatirkan. Setelah selesai, doakan satu per satu: 'Tuhan, aku serahkan ini kepada-Mu. Aku tidak sanggup, Engkau sanggup'. Lalu robek atau simpan kertas itu sebagai pengingat.",
    reflection: [
      "Beban apa yang selama ini kamu paksakan tanggung sendiri?",
      "Kenapa kamu enggan menyerahkannya kepada Tuhan?",
      "Bagaimana rasanya membayangkan Tuhan yang memikul bebanmu?",
    ],
    prayer:
      "Bapa, aku lelah menanggung semua sendiri. Hari ini aku menyerahkan bebanku ke tangan-Mu. Peliharalah aku seperti janji-Mu. Aku pilih istirahat di dalam-Mu. Amin.",
    accent: "teal",
  },
  {
    id: "mendengar-suara-tuhan",
    theme: "Doa",
    title: "Mendengar Suara Tuhan",
    verseRef: "1 Raja-raja 19:12",
    verseText: "...dan sesudah gempa itu datanglah api. Tetapi TUHAN tidak ada dalam api itu. Dan sesudah api itu datanglah bunyi angin sepoi-sepoi basa.",
    opening:
      "Kita hidup di zaman kebisingan. Notifikasi, media sosial, deadline, obrolan tak berujung. Wajar kalau kita mengharapkan Tuhan bicara dengan suara yang mengalahkan semua itu — dramatis, jelas, tidak mungkin salah dengar. Tapi kisah Elia mengingatkan kita: Tuhan sering bicara dalam angin sepoi-sepoi.",
    unpacking:
      "Elia sedang di titik terlemahnya. Ia baru saja mengalahkan nabi Baal, tapi lalu diancam Izebel dan lari ketakutan. Di gunung Horeb, Tuhan lewat — bukan dalam angin ribut, bukan dalam gempa, bukan dalam api. Tuhan lewat dalam angin sepoi. Ini bukan sekadar puisi rohani. Ini prinsip: Tuhan sering bicara di tempat sunyi, bukan di tengah kebisingan. Untuk mendengar-Nya, kita harus berhenti bicara dulu.",
    application:
      "Coba luangkan 10 menit hari ini tanpa HP, tanpa musik, tanpa distraksi. Duduk saja dengan Alkitab terbuka. Bukan untuk 'produktif' baca berapa pasal — hanya untuk hadir. Bicara pada Tuhan dengan singkat, lalu diam. Latih telingamu untuk mendengar suara sepoi-Nya di tengah kebisingan hidup.",
    reflection: [
      "Kapan terakhir kamu benar-benar diam di hadapan Tuhan?",
      "Apa yang paling sering mengalahkan 'suara sepoi' Tuhan dalam hidupmu?",
      "Bagaimana kamu bisa menciptakan ruang sunyi hari ini?",
    ],
    prayer:
      "Tuhan, terima kasih Engkau tidak pergi ketika aku sibuk. Ajari aku diam. Latih telingaku mendengar suara-Mu bahkan di tengah kebisingan. Amin.",
    accent: "violet",
  },
  {
    id: "kasih-yang-melimpah",
    theme: "Kasih",
    title: "Kasih yang Melimpah",
    verseRef: "1 Korintus 13:4-5",
    verseText:
      "Kasih itu sabar; kasih itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong. Ia tidak melakukan yang tidak sopan dan tidak mencari keuntungan diri sendiri. Ia tidak pemarah dan tidak menyimpan kesalahan orang lain.",
    opening:
      "Definisi kasih di 1 Korintus 13 sering dibaca di pernikahan. Tapi Paulus tidak menulisnya untuk acara resepsi — ia menulisnya untuk jemaat yang bertengkar tentang karunia rohani. Kasih ini bukan romansa; ini karakter yang dibentuk oleh Roh, yang bisa ditunjukkan kepada siapa saja — pasangan, rekan kerja, tetangga, bahkan orang yang menyebalkan di komentar Instagram.",
    unpacking:
      "Perhatikan: kata 'kasih itu...' tidak dilanjutkan dengan perasaan, tapi tindakan. Sabar. Murah hati. Tidak cemburu. Tidak sombong. Ini semua bisa dipilih, bahkan ketika perasaan berkata sebaliknya. Kasih Kristen adalah keputusan yang konsisten untuk memilih kepentingan orang lain sekalipun sulit. Ini bukan kasih yang mudah — ini kasih yang biaya. Tapi ini juga kasih yang mengubah dunia.",
    application:
      "Coba tes cepat: ganti kata 'kasih' di ayat ini dengan namamu. 'Sarah itu sabar. Sarah itu murah hati. Sarah tidak pemarah'. Bagaimana rasanya? Kalau tidak cocok, jangan berkecil hati — inilah tujuan pertumbuhan Kristen. Pilih satu sifat dari daftar itu untuk kamu latih hari ini.",
    reflection: [
      "Sifat kasih mana yang paling sulit kamu terapkan?",
      "Kepada siapa kamu paling perlu menunjukkan kasih ini hari ini?",
      "Bagaimana kamu bisa 'memilih' kasih ketika perasaanmu berkata sebaliknya?",
    ],
    prayer:
      "Roh Kudus, kasih semacam ini bukan alami bagiku. Bentuk aku dari dalam. Beri aku hati yang bisa sabar, murah hati, dan tidak menyimpan kesalahan. Amin.",
    accent: "rose",
  },
  {
    id: "waktu-tuhan-sempurna",
    theme: "Kepercayaan",
    title: "Waktu Tuhan Sempurna",
    verseRef: "Pengkhotbah 3:1",
    verseText: "Untuk segala sesuatu ada masanya, untuk apapun di bawah langit ada waktunya.",
    opening:
      "Salah satu kesulitan iman modern adalah kesabaran. Kita ingin jawaban sekarang, hasil sekarang, kesembuhan sekarang. Padahal Tuhan bekerja dalam musim — dan setiap musim punya tujuan. Belajar mengenali musim adalah kunci kedewasaan rohani.",
    unpacking:
      "Salomo tidak berkata 'segala sesuatu terjadi karena alasan' seperti klise. Ia berkata 'ada masanya' — ada waktu yang tepat untuk setiap hal. Kata Ibrani di sini bukan 'chronos' (waktu jam) tapi 'kairos' (waktu momen yang tepat). Tuhan bekerja dalam kairos-Nya, bukan dalam kalender kita. Kadang kita berdoa 'tolong sekarang!' dan Ia menjawab 'sebentar' — bukan karena Ia lambat, tapi karena Ia menunggu momen yang tepat.",
    application:
      "Kalau kamu sedang di 'musim menunggu', jangan sia-siakan. Musim menunggu adalah musim persiapan. Yusuf menunggu bertahun-tahun di penjara sebelum jadi perdana menteri Mesir. Musa 40 tahun di padang gurun sebelum memimpin Israel. Waktu yang kelihatan 'sia-sia' sering yang paling produktif secara rohani. Setia hari ini, sekalipun jawaban belum datang.",
    reflection: [
      "Musim apa yang sedang kamu jalani sekarang?",
      "Apa yang mungkin Tuhan ingin bentuk dalam dirimu di musim ini?",
      "Bagaimana kamu bisa 'setia dalam musim' hari ini?",
    ],
    prayer:
      "Bapa, aku sering ingin 'sekarang'. Tapi aku percaya waktu-Mu sempurna. Ajari aku setia dalam musim ini, sekalipun aku belum melihat hasilnya. Amin.",
    accent: "amber",
  },
  {
    id: "kekuatan-kehadiran-tuhan",
    theme: "Kehadiran Tuhan",
    title: "Kekuatan dalam Kehadiran-Nya",
    verseRef: "Yosua 1:9",
    verseText:
      "Bukankah telah Kuperintahkan kepadamu: kuatkan dan teguhkanlah hatimu? Janganlah kecut dan tawar hati, sebab TUHAN, Allahmu, menyertai engkau, ke manapun engkau pergi.",
    opening:
      "Yosua diminta mengambil alih kepemimpinan setelah Musa — tugas yang membuat siapapun ciut. Menyeberang sungai Yordan, menghadapi kota berbenteng, memimpin bangsa yang keras kepala. Wajar kalau ia takut. Tapi janji Tuhan bukan 'jangan takut karena musuhnya lemah'. Janjinya: 'Aku menyertaimu, ke manapun engkau pergi'.",
    unpacking:
      "Ke manapun. Bukan hanya di tempat ibadah. Bukan hanya saat berdoa. Bukan hanya di momen 'rohani'. Ke manapun — di kantor, di jalan macet, di ruang tunggu rumah sakit, di kamar tidur di malam yang gelap. Kehadiran Tuhan bukan syarat kondisi. Ia menyertai selalu, di setiap tempat, di setiap musim. Ini kekuatan yang paling stabil yang bisa kita miliki.",
    application:
      "Hari ini, coba latihan sederhana: setiap kali kamu masuk ke tempat baru — ruang kerja, toko, rumah — ucapkan dalam hati 'Tuhan menyertaiku di sini'. Latihan ini melatih hatimu untuk sadar bahwa kamu tidak pernah sendirian, di manapun kamu berada.",
    reflection: [
      "Di tempat mana kamu paling sering lupa bahwa Tuhan hadir?",
      "Kapan terakhir kamu merasakan kehadiran Tuhan yang menguatkan?",
      "Bagaimana kesadaran akan kehadiran-Nya bisa mengubah hari ini?",
    ],
    prayer:
      "Tuhan, terima kasih Engkau menyertaiku ke manapun aku pergi. Latih hatiku untuk sadar akan kehadiran-Mu di tempat-tempat yang biasa aku anggap 'sekuler'. Beri aku keberanian dari kehadiran-Mu. Amin.",
    accent: "sky",
  },
  {
    id: "melayani-dengan-kasih",
    theme: "Pelayanan",
    title: "Melayani dengan Kasih",
    verseRef: "Galatia 5:13",
    verseText:
      "Saudara-saudara, memang kamu telah dipanggil untuk merdeka. Tetapi janganlah kamu mempergunakan kemerdekaan itu sebagai kesempatan untuk kehidupan dalam dosa, melainkan layanilah seorang akan yang lain oleh kasih.",
    opening:
      "Kemerdekaan Kristen sering disalahpahami. Bukan berarti 'bebas melakukan apa saja'. Kita bebas dari perbudakan dosa untuk menjadi 'hamba' bagi kasih. Merdeka Kristen berarti bebas untuk melayani — bukan bebas dari melayani.",
    unpacking:
      "Paulus menempatkan dua realitas berdampingan: kamu merdeka DAN kamu melayani. Ini paradoks Kerajaan. Yesus, yang paling merdeka di antara semua, menjadi hamba semua. Dan dalam kerendahan itu Ia menemukan kemuliaan yang sejati. Melayani dari kasih berbeda dari melayani karena kewajiban. Yang pertama membangun; yang kedua menghabiskan.",
    application:
      "Ada satu orang di hidupmu hari ini yang bisa kamu layani dengan cara kecil. Pasangan yang lelah — buatkan kopi. Anak yang butuh perhatian — matikan HP, duduk bersama. Rekan kerja yang kewalahan — tawarkan bantuan tanpa diminta. Pelayanan tidak perlu besar untuk berdampak. Kasih dalam tindakan kecil sering yang paling terasa.",
    reflection: [
      "Siapa yang bisa kamu layani hari ini dengan tindakan kecil?",
      "Apa yang selama ini menghalangi kamu melayani dari kasih?",
      "Bagaimana kamu bisa menemukan sukacita dalam melayani, bukan beban?",
    ],
    prayer:
      "Tuhan Yesus, Engkau melayani sampai mati di kayu salib. Ajari aku melayani dengan hati seperti-Mu — dari kasih, bukan dari kewajiban. Buat aku peka pada kebutuhan orang di sekitarku. Amin.",
    accent: "sage",
  },
  {
    id: "kebenaran-yang-membebaskan",
    theme: "Kebenaran",
    title: "Kebenaran yang Membebaskan",
    verseRef: "Yohanes 8:32",
    verseText: "Dan kamu akan mengetahui kebenaran, dan kebenaran itu akan memerdekakan kamu.",
    opening:
      "Kita hidup di zaman 'kebenaran' sudah cair. Setiap orang punya versi 'kebenarannya' sendiri. Tapi Yesus tidak berkata 'temukan kebenaranmu sendiri'. Ia berkata 'kamu akan mengetahui Kebenaran' — Kebenaran dengan huruf besar. Dan ada janji: Kebenaran itu memerdekakan.",
    unpacking:
      "Di konteks aslinya, Yesus baru saja berkata pada murid-Nya: 'jikalau kamu tetap dalam firman-Ku, kamu benar-benar murid-Ku'. Kebenaran yang membebaskan bukan sekadar fakta — ia adalah Pribadi (Yesus sendiri) dan cara hidup (firman-Nya). Kebenaran ini membebaskan dari kebohongan yang mengikat kita — kebohongan tentang identitas kita, tentang siapa Tuhan, tentang apa yang penting dalam hidup.",
    application:
      "Kebohongan apa yang selama ini kamu percayai? 'Aku tidak berharga', 'Tuhan tidak peduli', 'Aku tidak akan pernah berubah', 'Kesuksesan menentukan nilai diriku'. Kebohongan-kebohongan ini mengikat. Lawan dengan Kebenaran Firman. Cari ayat yang kontradiksi dengan kebohongan itu, tulis, hafalkan, doakan. Kebenaran bertambah — kebohongan meluruh.",
    reflection: [
      "Kebohongan apa yang selama ini kamu percayai tentang dirimu?",
      "Apa yang Firman katakan sebagai kebenaran tentang siapa kamu?",
      "Bagaimana Kebenaran ini bisa memerdekakan langkahmu hari ini?",
    ],
    prayer:
      "Tuhan Yesus, Engkau adalah Kebenaran. Bebaskan aku dari kebohongan yang mengikatku. Bukalah mataku untuk melihat kebenaran Firman-Mu sebagai realitas hidupku. Amin.",
    accent: "sky",
  },
  {
    id: "rest-in-the-storm",
    theme: "Ketenangan",
    title: "Istirahat di Tengah Badai",
    verseRef: "Markus 4:39",
    verseText:
      "Iapun bangun, menghardik angin itu dan berkata kepada danau itu: Diam! Tenanglah! Lalu angin itu reda dan danau itu menjadi teduh sekali.",
    opening:
      "Ada sesuatu yang menarik dari kisah ini. Ketika badai datang, murid-murid panik. Yesus? Tidur. Bukan karena Ia tidak peduli — tapi karena Ia percaya. Kadang badai terbesar dalam hidup kita bukan tentang perahu — tapi tentang cara kita meresponnya.",
    unpacking:
      "Yesus tidak bangun karena panik. Ia bangun karena dibangunkan. Dan responnya? Bukan panik, bukan doa yang lama — hanya tiga kata: 'Diam! Tenanglah!'. Kekuatan-Nya tidak berkurang karena badai. Dan yang penting: setelah badai teduh, Ia bertanya pada murid, 'Mengapa kamu takut? Belum ada percayakah kamu?'. Fokus Yesus bukan hanya menghentikan badai; Ia ingin mengubah cara mereka merespon badai berikutnya.",
    application:
      "Kamu tidak bisa mengontrol badai yang datang. Tapi kamu bisa memilih siapa yang kamu bangunkan. Ketika krisis datang, respon pertamamu mengungkap iman terdalammu. Bukan 'aku harus menyelesaikan ini sendiri', tapi 'Yesus, aku butuh Engkau'. Kadang Ia menenangkan badai. Kadang Ia menenangkan kamu di dalam badai. Kedua-duanya adalah mukjizat.",
    reflection: [
      "Badai apa yang sedang kamu hadapi saat ini?",
      "Apa respon pertama hatimu ketika krisis datang?",
      "Bagaimana kamu bisa 'istirahat' di dalam kepercayaan pada Yesus?",
    ],
    prayer:
      "Yesus, ada banyak badai dalam hidupku. Aku sering panik dan lupa Engkau di sampingku. Ajari aku istirahat dalam-Mu, sekalipun ombak masih tinggi. Amin.",
    accent: "teal",
  },
  {
    id: "berkat-dalam-ketidaksempurnaan",
    theme: "Anugerah",
    title: "Berkat dalam Ketidaksempurnaan",
    verseRef: "Roma 5:20",
    verseText:
      "Tetapi hukum Taurat ditambahkan, supaya pelanggaran menjadi semakin banyak; dan di mana dosa bertambah banyak, di sana kasih karunia menjadi berlimpah-limpah.",
    opening:
      "Ada ironi indah dalam Injil. Bukan orang sempurna yang paling banyak menerima anugerah — tapi orang yang mengaku tidak sempurna. Karena anugerah datang kepada tangan yang kosong, bukan tangan yang penuh dengan kebanggan diri.",
    unpacking:
      "Paulus tidak sedang membenarkan dosa. Ia sedang menegaskan realitas: kasih karunia Tuhan lebih besar dari dosa terburuk. Kata Yunani 'berlimpah-limpah' berarti 'jauh melebihi'. Dosa manusia besar; anugerah Tuhan lebih besar lagi. Ini bukan izin untuk berbuat sesuka hati (Paulus menjelaskan hal ini di pasal berikutnya). Ini penghiburan untuk yang jatuh — kamu tidak akan pernah kehabisan anugerah.",
    application:
      "Kalau kamu jatuh hari ini — jangan sembunyikan dari Tuhan. Justru datang. Anugerah-Nya tidak tergantung pada 'kualitasmu' sebagai pendosa yang bertobat. Ia tergantung pada karakter-Nya sebagai Bapa yang mengasihi. Bangkit, akui, terima anugerah, dan lanjutkan berjalan. Jatuh bukan akhir — menyerah yang akhir.",
    reflection: [
      "Ada dosa yang membuatmu merasa 'terlalu jauh' dari Tuhan?",
      "Bagaimana anugerah-Nya bisa lebih besar dari kegagalanmu?",
      "Apa langkah kecil untuk kembali kepada Tuhan hari ini?",
    ],
    prayer:
      "Bapa, terima kasih anugerah-Mu tidak habis. Ampuni aku, angkat aku, dan mampukan aku berjalan lagi. Tidak ada dosaku yang lebih besar dari kasih-Mu. Amin.",
    accent: "amber",
  },
  {
    id: "kasih-yang-mengubah",
    theme: "Kasih",
    title: "Kasih yang Mengubah",
    verseRef: "Yohanes 13:34-35",
    verseText:
      "Aku memberikan perintah baru kepada kamu, yaitu supaya kamu saling mengasihi; sama seperti Aku telah mengasihi kamu demikian pula kamu harus saling mengasihi. Dengan demikian semua orang akan tahu, bahwa kamu adalah murid-Ku, yaitu jikalau kamu saling mengasihi.",
    opening:
      "Yesus tidak berkata 'orang akan tahu kamu murid-Ku karena kamu punya doktrin yang benar' atau 'karena kamu rajin ke gereja'. Ia berkata: 'karena kamu saling mengasihi'. Ini radikal. Identitas Kristen yang paling terlihat bukan label — melainkan kasih yang nyata di antara sesama percaya.",
    unpacking:
      "Kata 'baru' di ayat ini menarik. Perintah mengasihi bukan baru — sudah ada di Perjanjian Lama. Yang baru adalah standarnya: 'sama seperti Aku telah mengasihi kamu'. Yesus mengasihi sampai menyerahkan nyawa. Kasih ini bukan sekadar afeksi — ini komitmen berkorban. Dan hasilnya? Dunia melihat sesuatu yang tidak biasa terjadi di kalangan pengikut Yesus, dan mereka jadi bertanya-tanya tentang Tuhan yang kita sembah.",
    application:
      "Siapa saudara seiman di sekelilingmu yang butuh diberkati hari ini? Sesama jemaat yang bergumul, teman kelompok kecil yang jarang muncul akhir-akhir ini, orang yang di gereja tapi jarang kamu sapa. Kirim pesan, ajak makan, doakan spesifik. Kasih Kristen tidak abstrak — ia konkret, personal, dan menyentuh.",
    reflection: [
      "Bagaimana kualitas kasih di komunitas rohanimu saat ini?",
      "Kepada saudara seiman mana kamu bisa menunjukkan kasih hari ini?",
      "Apa yang orang lain lihat dari 'kekristenanmu' — doktrin atau kasih?",
    ],
    prayer:
      "Tuhan Yesus, ajari aku mengasihi seperti Engkau mengasihi. Buat komunitas rohani kami menjadi cermin kasih-Mu di dunia yang haus kasih. Biarlah orang lain melihat-Mu di dalam kami. Amin.",
    accent: "rose",
  },
];

// Days since epoch in Asia/Jakarta (UTC+7, no DST).
export function jakartaDayKey(): number {
  return Math.floor((Date.now() + 7 * 60 * 60 * 1000) / 86_400_000);
}

export function getTodaysDevotion(): DailyDevotion {
  const dayKey = jakartaDayKey();
  return DAILY_DEVOTIONS[dayKey % DAILY_DEVOTIONS.length];
}

export function formatTodaysDate(): string {
  return new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
