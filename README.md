# Sooliva · Proje Yönetim Panosu

**Sooliva**, yapay zeka destekli B2B satış platformu geliştirme sürecini yönetmek için tasarlanmış **proje yönetim aracıdır**.

---

## Proje Yapısı

```
├── frontend/          # Next.js 14 + React 18 + Tailwind CSS
├── backend/          # Bun + ElysiaJS + Drizzle ORM
├── docker-compose.yml
└── README.md
```

### Teknoloji Yığını

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Zustand (State Management)

**Backend:**
- Bun Runtime
- ElysiaJS (API Framework)
- Drizzle ORM
- PostgreSQL
- Redis & BullMQ (Kuyruk Yönetimi)

**AI/ML:**
- Python
- LangChain
- OpenAI GPT-4
- Pinecone (Vector DB)

**DevOps:**
- Docker & Docker Compose
- AWS (ECS, EKS, RDS, S3)
- GitHub Actions (CI/CD)

---

## Kurulum

### Gereksinimler

- Bun runtime
- Docker & Docker Compose
- PostgreSQL veritabanı

### Adımlar

1. Bağımlılıkları yükleyin:

```bash
# Backend
cd backend && bun install

# Frontend
cd frontend && npm install
```

2. `.env` dosyasını oluşturun:

```bash
cp .env.example .env
```

3. Uygulamayı başlatın:

```bash
docker-compose up -d
```

veya geliştirme için:

```bash
# Backend
cd backend && bun run dev

# Frontend
cd frontend && npm run dev
```

---

## Proje Yönetim Aracı (`index.html`)

Bu projenin **kendisi bir proje yönetim aracıdır.** `frontend/public/index.html` dosyası, tarayıcıda doğrudan çalışan bağımsız bir **Single Page Application (SPA)** dashboard'udur.

### Özellikleri

- **localStorage ile çalışır** — Sunucuya veya veritabanına ihtiyaç duymaz, tüm veriler tarayıcıda saklanır
- **Agile/Scrum odaklı** — Sprint etiketleri (S1–S5), faz takvimi ve görev dağılımı
- **Ekip yönetimi** — 15 kişilik ekibin maaş, rol ve departman bilgilerini tutar
- **Görev takibi** — 39 sprint görevi, departmana göre filtreleme
- **Dinamik Gantt şeması** — 26 haftalık proje takvimi, hem faz bazlı hem kişi zaman çizelgesi
- **Bütçe planlama** — Personel maaşları + altyapı maliyetleri + %15 risk payı hesaplar

### Sekmeler

| Sekme | İçerik |
|-------|--------|
| 👥 **Ekip** | Ekip üyeleri kart görünümü (departman, maaş, rol) |
| 📋 **Görevler** | Sprint görevleri tablosu, departmana göre filtrelenebilir |
| 📅 **Gantt** | Faz takvimi ve kişi bazlı zaman çizelgesi |
| 💰 **Bütçe** | Personel ve altyapı maliyet kırılımı, toplam bütçe |
| 🔧 **Kaynaklar** | Teknoloji yığını, efor dağılımı, Scrum yapısı |

### Kullanım

`frontend/public/index.html` dosyasını herhangi bir tarayıcıda açmanız yeterli. Yaptığınız tüm değişiklikler tarayıcınızın localStorage'ına otomatik kaydedilir.

---

## Proje Yönetimi Özellikleri ve Açıklamaları

Bu bölüm, projede kullanılan proje yönetimi kavramlarını açıklar.

### 1. Ekip Yönetimi (Team Management)

Proje yönetiminde **kaynak planlaması** en kritik unsurlardan biridir. Bu araçta:

| Özellik | Proje Yönetimi Açıklaması |
|---------|---------------------------|
| Departman bazlı organizasyon | Projelerin doğru kişilere atanması için organizasyonel yapı |
| Rol ataması | Her ekip üyesinin sorumluluk alanının belirlenmesi |
| Maaş maliyeti | Proje bütçesi hesaplaması için insan kaynağı maliyeti |
| localStorage ile kayıt | Veri yönetimi ve veri kalıcılığı |

### 2. Görev Dağılımı (Task Distribution)

**WBS (Work Breakdown Structure)** prensibiyle görevler parçalara ayrılır:

- **Sprint etiketleri (S1, S2, S3, QA, Beta)** — Agile/Scrum metodolojisinde iterasyon yönetimi
- **Departman bazlı filtreleme** — Her ekibin kendi görevlerini görüntülemesi
- **Sorumlu ataması** — Accountability (sorumluluk) matrisi
- **Görev açıklaması** — SMART hedefleri (Specific, Measurable, Achievable, Relevant, Time-bound)

### 3. Gantt Şeması (Timeline Management)

Gantt şeması **zaman çizelgesi yönetimi** için temel bir araçtır:

| Bileşen | Açıklama |
|---------|----------|
| Faz takvimi | Projenin ana aşamalarının görselleştirilmesi |
| Kişi zaman çizelgesi | Bireysel kaynak tahsisi ve kapasite planlaması |
| Haftalık dilimler (W1–W26) | Milestone (kilita noktası) bazlı ilerleme takibi |
| Renk kodlaması | Farklı fazların kolay ayırt edilmesi |

### 4. Bütçe Planlama (Cost Management)

**Proje yönetiminin 5 ana süreci:** Planlama, Yürütme, İzleme, Kontrol ve Kapanış. Bütçe sekmesi bu prensipleri uygular:

```
Personel Maliyeti + Altyapı Maliyeti = Alt Toplam
Alt Toplam + %15 Risk Payı = Genel Toplam
```

- **Personel maliyeti** — İnsan kaynakları planlaması (6.5 ay × aylık maaş)
- **Altyapı maliyeti** — AWS, OpenAI API, SendGrid, Datadog gibi operasyonel giderler
- **Risk payı** — Proje yönetiminde standart uygulama (%10–20 arası)

### 5. Kaynak Yönetimi (Resource Management)

| Kavram | Uygulama |
|--------|----------|
| Efor dağılımı (%) | Her ekip üyesinin projeye ayırdığı zaman oranı |
| Aktif fazlar | Kişilerin hangi sprintlerde aktif olduğu |
| Scrum yapısı | Sprint velocity, planning, daily, review, retrospective |
| Araç seçimi | Jira, Confluence, Figma, Linear gibi proje yönetim araçları |

### 6. Agile/Scrum Metodolojisi

Bu proje **Scrum** çerçevesini kullanır:

| Scrum Öğesi | Bu Projede |
|-------------|-----------|
| Sprint | 2 haftalık iterasyonlar (S1–S5) |
| Product Owner | Selin Yıldırım (Ürün Sahibi/BA) |
| Scrum Master | Kerem Arslan (Proje Yöneticisi) |
| Definition of Done | Code review + QA onayı + deploy |
| Sprint Velocity | ~45 story point/sprint hedefi |

### LAN (Ağ) Dersleriyle İlişkisi

Bu proje yönetim aracı, aşağıdaki ağ ve BT ders konularını uygulamalar:

1. **Ağ topolojileri** — Gantt şemasındaki bağımlılıklar ve zaman çizelgesi
2. **Protokol katmanlaması** — Proje katmanları (Faz 0 Keşif → Faz 1 Tasarım → Sprint 1-5 → QA → Beta)
3. **IP adresleme mantığı** — Departman bazlı görev ataması (tıpkı ağ segmentasyonu gibi)
4. **Yedekleme ve kurtarma** — localStorage ile veri kalıcılığı
5. **Güvenlik duvarları** — Bütçe risk payı (%15) ile beklenmeyen durumlar için tampon

---

## API Endpoints (Backend)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/projects` | Tüm projeleri listele |
| POST | `/api/projects` | Yeni proje oluştur |
| GET | `/api/projects/:id` | Proje detayı |
| PUT | `/api/projects/:id` | Proje güncelle |
| DELETE | `/api/projects/:id` | Proje sil |
| GET | `/api/issues` | Tüm görevleri listele |
| POST | `/api/issues` | Yeni görev oluştur |
| PUT | `/api/issues/:id` | Görev güncelle |
| DELETE | `/api/issues/:id` | Görev sil |

---

## Lisans

MIT