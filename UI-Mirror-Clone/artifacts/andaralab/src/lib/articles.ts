export interface Article {
  slug: string;
  locale: "en" | "id";
  title: string;
  titleId?: string; // Indonesian translation (CMS-editable separately)
  excerpt: string;
  excerptId?: string;
  date: string;
  readTime: string;
  tag: string;
  tagId?: string;
  category: string;
  categoryHref: string;
  image?: string;
  body: string[];
  bodyId?: string[]; // Indonesian translation
}

export const articles: Article[] = [
  // ─── INDONESIAN ARTICLES ─────────────────────────────────────────────────
  {
    slug: "prospeks-makro-indonesia-2026",
    locale: "id",
    title: "Prospek Makro Indonesia: Menavigasi Angin Keringat Global 2026",
    titleId: "Prospek Makro Indonesia: Menavigasi Angin Keringat Global 2026",
    excerpt: "Dengan pertumbuhan global melambat dan ketegangan perdagangan meningkat, fundamental makroekonomi Indonesia tetap tangguh, didukung oleh konsumsi domestik yang kuat.",
    excerptId: "Dengan pertumbuhan global melambat dan ketegangan perdagangan meningkat, fundamental makroekonomi Indonesia tetap tangguh, didukung oleh konsumsi domestik yang kuat.",
    date: "26 Maret 2026", readTime: "8 menit baca", tag: "Makro",
    tagId: "Makro",
    category: "Prospek Makro",
    categoryHref: "/macro/macro-outlooks",
    body: [
      "Indonesia memasuki 2026 dengan salah satu profil makro paling tangguh di Asia Tenggara. Meskipun menghadapi hambatan dari perlambatan permintaan global, dollar AS yang lebih kuat, dan ketegangan perdagangan AS-Tiongkok yang belum terselesaikan, ekonomi domestik terus berkinerja di atas ekspektasi — mencatat pertumbuhan PDB 5,02% di K4 2024.",
      "Pendorong utama ketahanan ini adalah konsumsi rumah tangga yang kuat, yang menyumbang sekitar 57% PDB. Pendapatan kelas menengah yang meningkat, didukung oleh pasar tenaga kerja yang ketat, telah menjaga pertumbuhan penjualan ritel dalam kisaran 4-6% tahun-ke-tahun.",
      "Secara eksternal, Indonesia diuntungkan dari basis ekspor komoditas. Minyak kelapa sawit dan batu bara memang telah moderat dari puncak 2022, namun ekspor nikel dan tembaga melonjak seiring permintaan rantai pasok baterai EV. Ini partially menstabilkan transaksi berjalan.",
      "Risiko utama meliputi: pelemahan IDR jika The Fed menunda pemotongan suku bunga, perlambatan Tiongkok yang lebih tajam dari yang diharapkan, dan tekanan pengeluaran siklus pemilu domestik.",
    ],
    bodyId: [
      "Indonesia memasuki 2026 dengan salah satu profil makro paling tangguh di Asia Tenggara. Meskipun menghadapi hambatan dari perlambatan permintaan global, dollar AS yang lebih kuat, dan ketegangan perdagangan AS-Tiongkok yang belum terselesaikan, ekonomi domestik terus berkinerja di atas ekspektasi — mencatat pertumbuhan PDB 5,02% di K4 2024.",
      "Pendorong utama ketahanan ini adalah konsumsi rumah tangga yang kuat, yang menyumbang sekitar 57% PDB. Pendapatan kelas menengah yang meningkat, didukung oleh pasar tenaga kerja yang ketat, telah menjaga pertumbuhan penjualan ritel dalam kisaran 4-6% tahun-ke-tahun.",
      "Secara eksternal, Indonesia diuntungkan dari basis ekspor komoditas. Minyak kelapa sawit dan batu bara memang telah moderat dari puncak 2022, namun ekspor nikel dan tembaga melonjak seiring permintaan rantai pasok baterai EV. Ini partially menstabilkan transaksi berjalan.",
      "Risiko utama meliputi: pelemahan IDR jika The Fed menunda pemotongan suku bunga, perlambatan Tiongkok yang lebih tajam dari yang diharapkan, dan tekanan pengeluaran siklus pemilu domestik.",
    ],
  },
  {
    slug: "inflasi-indonesia-2026",
    locale: "id",
    title: "Inflasi Indonesia: Apa yang Perlu Dipahami?",
    titleId: "Inflasi Indonesia: Apa yang Perlu Dipahami?",
    excerpt: "Inflasi CPI Indonesia di 2,51% — apa artinya bagi kebijakan moneter dan investasi? Penjelasan mendalam.",
    excerptId: "Inflasi CPI Indonesia di 2,51% — apa artinya bagi kebijakan moneter dan investasi? Penjelasan mendalam.",
    date: "14 Maret 2026", readTime: "5 menit baca", tag: "Inflasi",
    tagId: "Inflasi",
    category: "Kebijakan & Moneter",
    categoryHref: "/macro/policy-monetary",
    body: [
      "Indeks Harga Konsumen (IHK) Indonesia tercatat 2,51% YoY untuk Maret 2026 — dengan baik berada dalam band sasaran BI 1,5-3,5%. Namun angka yang lebih relevan secara kebijakan adalah inflasi inti.",
      "Inflasi inti, yang mengecualikan komponen paling volatil seperti harga pangan mentah dan harga yang dikelola pemerintah, saat ini berada di 2,1%. Deselerasi ini mencerminkan keberhasilan siklus pengetatan moneter BI.",
      "Untuk kebijakan moneter, ambang batas utama adalah inflasi inti yang secara berkelanjutan di bawah 2,5% — kondisi yang tampaknya semakin dalam jangkauan.",
    ],
    bodyId: [
      "Indeks Harga Konsumen (IHK) Indonesia tercatat 2,51% YoY untuk Maret 2026 — dengan baik berada dalam band sasaran BI 1,5-3,5%. Namun angka yang lebih relevan secara kebijakan adalah inflasi inti.",
      "Inflasi inti, yang mengecualikan komponen paling volatil seperti harga pangan mentah dan harga yang dikelola pemerintah, saat ini berada di 2,1%. Deselerasi ini mencerminkan keberhasilan siklus pengetatan moneter BI.",
      "Untuk kebijakan moneter, ambang batas utama adalah inflasi inti yang secara berkelanjutan di bawah 2,5% — kondisi yang tampaknya semakin dalam jangkauan.",
    ],
  },

  // ─── MACRO OUTLOOKS ───────────────────────────────────────────────────────
  {
    slug: "indonesia-macro-outlook-2026",
    locale: "en",
    title: "Indonesia's Macro Outlook: Navigating Global Headwinds in 2026",
    excerpt: "With global growth slowing and trade tensions escalating, Indonesia's macroeconomic fundamentals remain resilient, supported by strong domestic consumption and a commodity export cushion.",
    date: "March 26, 2026", readTime: "8 min read", tag: "Macro",
    category: "Macro Outlooks", categoryHref: "/macro/macro-outlooks",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85",
    body: [
      "Indonesia enters 2026 with one of the most resilient macro profiles in Southeast Asia. Despite headwinds from slowing global demand, a stronger US dollar, and unresolved US-China trade tensions, the domestic economy continues to perform above expectations — logging 5.02% GDP growth in Q4 2024 and maintaining that momentum into 2025.",
      "The primary driver of this resilience is robust household consumption, which accounts for approximately 57% of GDP. Rising middle-class incomes, supported by a tight labor market and sustained remittance inflows, have kept retail sales growth in the 4-6% range year-on-year. Government capital expenditure, particularly in infrastructure, provides an additional floor.",
      "On the external side, Indonesia benefits from its commodity export base. Although palm oil and coal prices have moderated from 2022 peaks, nickel and copper exports are surging on EV battery supply chain demand. This is partially cushioning the current account, which narrowed to a slight deficit of 0.5% of GDP in Q3 2025.",
      "Key risks to watch include: (1) persistent IDR weakness if the Fed delays cuts beyond Q3 2026, (2) a sharper-than-expected China slowdown reducing commodity demand, and (3) domestic election-cycle spending pressures that could strain the fiscal position. Our base case maintains 5.0-5.2% GDP growth for full-year 2026, with downside risk to 4.6% in our bear scenario.",
      "For investors, the macro environment remains broadly supportive of Indonesian equities (JCI target: 7,400-7,600) and government bonds (SBN 10Y yield compression to 6.5-6.7% over 12 months). We recommend overweight domestic consumption and infrastructure names, with selective exposure to commodity exporters hedged against price volatility.",
    ],
  },
  {
    slug: "bi-rate-policy-2026",
    locale: "en",
    title: "Bank Indonesia Rate Policy: What's Next After the Hold?",
    excerpt: "After keeping rates at 6.00% for the third consecutive meeting, BI signals a potential cut window in H2 2026 if inflation stays benign.",
    date: "March 18, 2026", readTime: "5 min read", tag: "Monetary",
    category: "Macro Outlooks", categoryHref: "/macro/macro-outlooks",
    body: [
      "Bank Indonesia held its benchmark 7-Day Reverse Repo Rate (RRR) at 6.00% at the March 2026 meeting — the third consecutive hold since the November 2024 hike. The decision was unanimous, reflecting a cautious stance amid ongoing IDR volatility and global uncertainty.",
      "Governor Perry Warjiyo's statement struck a balanced tone: BI acknowledged that headline CPI has decelerated to 2.51% (well within the 1.5-3.5% target band) but emphasized that external risk factors — particularly USD strength and geopolitical uncertainty — warrant continued vigilance on the exchange rate.",
      "Our forward guidance analysis suggests the first cut window opens in Q3 2026 (July or September meetings), contingent on three conditions being met: (1) IDR stabilizing above 15,500/USD on a sustained basis, (2) core inflation remaining below 2.5%, and (3) the Fed beginning its own easing cycle.",
      "The market is pricing approximately 50bps of BI cuts over the next 12 months (implied by the JIBOR forward curve). We think this is roughly right but front-loaded — our house view is 25bps in Q3 and 25bps in Q4 2026. Bond markets have already partially priced this in, with 10Y SBN yields compressing ~35bps since the start of the year.",
      "For fixed income investors, we recommend extending duration modestly (adding 10Y SBN exposure) while maintaining IDR hedge through options rather than forwards given the asymmetric risk profile.",
    ],
  },
  {
    slug: "fiscal-consolidation-indonesia",
    locale: "en",
    title: "Fiscal Consolidation & Budget Deficit: Indonesia's Path to B3 Ratio",
    excerpt: "The government's 2026 budget targets a deficit at 2.5% of GDP, a strategic step toward the B3 threshold while maintaining growth-supportive spending.",
    date: "March 10, 2026", readTime: "6 min read", tag: "Fiscal",
    category: "Macro Outlooks", categoryHref: "/macro/macro-outlooks",
    body: [
      "Indonesia's 2026 State Budget (APBN) targets a fiscal deficit of 2.5% of GDP — narrower than the 2.7% realized in 2025 — signaling continued commitment to the fiscal consolidation path mandated by Law No. 17/2003.",
      "The consolidation is being achieved through a combination of expenditure rationalization and improved tax revenue collection. The Directorate General of Tax has implemented electronic invoice verification (e-faktur integration) that closed approximately Rp 85 trillion in VAT leakages in 2025 alone.",
      "Capital expenditure remains a protected budget item at Rp 720 trillion (2.4% of GDP), focused on Nusantara capital city infrastructure, Trans-Sumatra toll road completion, and rural electrification. The government views capex as the primary growth lever in the absence of monetary easing.",
      "The debt-to-GDP ratio stands at 39.2%, comfortably below the legal ceiling of 60% and the implicit benchmark of 40% that triggers IMF consultation. Debt composition has improved with the share of domestic currency debt rising to 74%, reducing FX rollover risk.",
      "Our fiscal sustainability assessment remains constructive. Indonesia's fiscal trajectory is consistent with maintaining its investment-grade sovereign ratings (Baa2/BBB-/BBB). The primary risk is election-cycle spending in 2029, which historically has caused transient deficit widening of 30-50bps of GDP.",
    ],
  },
  {
    slug: "current-account-balance-2026",
    locale: "en",
    title: "Current Account Balance: Surplus Narrowing as Imports Recover",
    excerpt: "Indonesia's current account returned to a slight deficit in Q4 2025, as capital goods imports surged amid infrastructure investment acceleration.",
    date: "February 28, 2026", readTime: "4 min read", tag: "Trade",
    category: "Macro Outlooks", categoryHref: "/macro/macro-outlooks",
    body: [
      "Indonesia's current account swung to a deficit of 0.5% of GDP in Q4 2025, ending six consecutive quarters of surplus. The reversal was driven primarily by a surge in capital goods imports — machinery and equipment imports rose 18% YoY as infrastructure projects accelerated ahead of the 2026 construction season.",
      "The goods trade balance remained in surplus at $2.3 billion in the latest available month, supported by nickel ore and processed nickel exports. However, services account deficits (tourism and transportation) widened, and primary income outflows (profit repatriation by foreign-owned enterprises) increased.",
      "We expect the current account to average a deficit of 1.0-1.5% of GDP through 2026 — a manageable level that is fully financeable via FDI and portfolio inflows. Indonesia's $150B foreign exchange reserves (equivalent to 6.5 months of imports) provide ample cushion.",
      "The key monitoring metric for IDR stability is not the current account per se, but the basic balance (current account + net FDI). Indonesia's basic balance remains positive, implying structural capital inflows exceed the current account gap.",
    ],
  },

  // ─── POLICY & MONETARY ────────────────────────────────────────────────────
  {
    slug: "bi-rate-hold-march-2026",
    locale: "en",
    title: "BI Holds Rates: Reading Between the Lines of the March Statement",
    excerpt: "The March 2026 BI board meeting delivered a unanimous hold, but the nuanced language in Governor Warjiyo's statement contained important forward guidance signals.",
    date: "March 22, 2026", readTime: "5 min read", tag: "Monetary",
    category: "Policy & Monetary Watch", categoryHref: "/macro/policy-monetary",
    body: [
      "Bank Indonesia's March 2026 Monetary Policy Board meeting delivered an unsurprising unanimous hold at 6.00%, but the communication contained several important signals worth unpacking for market participants.",
      "Most notably, the statement dropped the phrase 'remains focused on exchange rate stability' — language that had been present in every statement since November 2024. In its place, the board emphasized 'achieving the inflation target while supporting economic growth' — language more consistent with a dovish pivot ahead.",
      "Governor Warjiyo also noted that the global disinflation trend is 'increasingly supportive' of a more accommodative stance in the second half of 2026, subject to IDR performance. This marks a subtle but important shift from the February statement, which was neutral on the timing of any policy change.",
      "On the macro side, BI revised its 2026 GDP growth forecast marginally upward to 5.1% (from 5.0%) and maintained its CPI inflation forecast at 2.5-3.0% for year-end. Both are consistent with a gradual easing path.",
      "We maintain our call for a first 25bps cut in September 2026, with risks tilted toward July if the Fed delivers a cut at its June meeting and IDR remains stable.",
    ],
  },
  {
    slug: "indonesia-inflation-breakdown",
    locale: "en",
    title: "Indonesia Inflation Deep-Dive: Why Core is the One to Watch",
    excerpt: "Headline CPI at 2.51% tells only part of the story. Core inflation at 2.1% gives the real signal about demand conditions.",
    date: "March 14, 2026", readTime: "6 min read", tag: "Inflation",
    category: "Policy & Monetary Watch", categoryHref: "/macro/policy-monetary",
    body: [
      "Indonesia's headline Consumer Price Index (CPI) came in at 2.51% YoY for March 2026 — well within Bank Indonesia's 1.5-3.5% target band. However, the more policy-relevant number is core inflation, which strips out volatile food and administered prices, and currently stands at 2.1%.",
      "Core inflation's deceleration from a 2022-2023 peak of 3.4% reflects the success of BI's 225bps tightening cycle and the cooling of domestic demand post-pandemic boom. Rent and housing-related components — typically the stickiest — have eased to 2.8% YoY from over 4% in 2023.",
      "Food inflation remains the volatile wildcard. El Niño-related supply disruptions pushed food CPI to 4.8% in mid-2024, but subsequent normalization and government intervention via the Food Estate program have brought it back to 3.2%. Rice prices, which carry the largest weight in the Indonesian CPI basket (around 3.3%), are closely monitored by BI and the government.",
      "Administered prices (fuel, electricity) are another major swing factor. The government has maintained retail fuel price subsidies, suppressing this component, but subsidy reform risks remain a medium-term inflation upside risk.",
      "For monetary policy, the key threshold is core inflation sustainably below 2.5% — a condition that appears increasingly within reach. This is one of the three conditions we believe BI requires before initiating rate cuts.",
    ],
  },

  // ─── GEOPOLITICAL ─────────────────────────────────────────────────────────
  {
    slug: "us-china-trade-indonesia",
    locale: "en",
    title: "US-China Trade Tensions: Impact on Indonesian Exports",
    excerpt: "Indonesia's commodity exports remain resilient, but manufacturing faces tariff displacement risk as trade war escalates.",
    date: "March 22, 2026", readTime: "7 min read", tag: "Geopolitical",
    category: "Geopolitical & Structural Analysis", categoryHref: "/macro/geopolitical",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=85",
    body: [
      "The escalation of US-China trade tensions in 2025-2026 presents both risks and opportunities for Indonesia. Understanding the distinction is critical for positioning across asset classes.",
      "On the risk side: Indonesian manufacturing, particularly electronics and processed goods, faces tariff displacement. As US tariffs on Chinese goods increase, Chinese manufacturers seek alternative export platforms — often competing with Indonesian producers in third markets. Vietnam has captured more of this displacement than Indonesia due to superior supply chain integration.",
      "On the opportunity side: Indonesia benefits from trade diversion in commodities. As China diversifies commodity sourcing away from politically sensitive suppliers, Indonesia's nickel, coal, and palm oil exports receive incremental demand. In 2025, Indonesia's exports to China grew 12% despite overall global trade deceleration.",
      "The 'China Plus One' manufacturing strategy is creating selective investment opportunities in Indonesia's industrial estates. Batang Industrial Estate (Central Java) has attracted significant FDI from Japanese, Korean, and Taiwanese manufacturers seeking to diversify production footprints.",
      "Our geopolitical risk scenario analysis assigns 35% probability to further US tariff escalation (which would be net positive for Indonesian commodity exports), 45% to status quo (neutral), and 20% to de-escalation (slightly negative for commodity trade diversion benefits but positive for global growth).",
    ],
  },
  {
    slug: "asean-economic-integration",
    locale: "en",
    title: "ASEAN Economic Integration: Where Indonesia Sits in the New Supply Chain Map",
    excerpt: "The re-ordering of global supply chains is accelerating ASEAN's rise. Indonesia's strategic position offers both promise and competitive challenges.",
    date: "March 15, 2026", readTime: "8 min read", tag: "Geopolitical",
    category: "Geopolitical & Structural Analysis", categoryHref: "/macro/geopolitical",
    body: [
      "The global supply chain restructuring accelerated by COVID-19 and geopolitical tensions has created a historic opportunity for ASEAN nations. Indonesia, as the bloc's largest economy with the most abundant natural resources, is uniquely positioned — but is it capitalizing effectively?",
      "The honest answer is: partially. Indonesia has captured meaningful FDI in nickel downstream processing (supported by the ore export ban policy) and is building momentum in EV-related manufacturing. However, Vietnam, Thailand, and Malaysia continue to outperform on electronics and precision manufacturing FDI attraction.",
      "The primary bottleneck remains regulatory predictability and labor market flexibility. World Bank ease-of-doing-business metrics show Indonesia improving but still below ASEAN peers in contract enforcement and construction permitting. The Omnibus Law reforms of 2020-2021 addressed some of these gaps, but implementation gaps persist.",
      "The Nusantara capital city project, while politically complex, could catalyze logistics infrastructure development in East Kalimantan — a strategic node for connecting Indonesian resource extraction regions to global supply chains. Early-stage industrial estate development near Nusantara is attracting energy-intensive industries seeking to co-locate with planned renewable energy projects.",
    ],
  },

  // ─── SECTORAL: DEEP-DIVES ─────────────────────────────────────────────────
  {
    slug: "nickel-ev-indonesia",
    locale: "en",
    title: "Nickel & Battery Supply Chain: Indonesia's EV Ambitions",
    excerpt: "Indonesia controls over 40% of global nickel reserves. We analyze how the country is positioning itself as the epicenter of the global EV battery supply chain.",
    date: "March 22, 2026", readTime: "10 min read", tag: "Sectoral",
    category: "Strategic Industry Deep-dives", categoryHref: "/sectoral/deep-dives",
    image: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=1200&q=85",
    body: [
      "Indonesia holds the world's largest nickel reserves — approximately 21 million tonnes, representing over 40% of the global total. This resource endowment, combined with a strategic 2020 nickel ore export ban, has triggered a dramatic acceleration in domestic downstream processing investment.",
      "The downstream nickel ecosystem has evolved rapidly. As of early 2026, Indonesia operates 43 HPAL (High-Pressure Acid Leach) and rotary kiln electric furnace (RKEF) facilities, producing nickel pig iron (NPI), ferronickel, and mixed hydroxide precipitate (MHP) for battery-grade use. Total invested capital in the sector exceeds $30 billion, primarily from Chinese battery manufacturers and their Indonesian partners.",
      "The battery supply chain integration is deepening. CATL, LG Energy Solution, and Panasonic have all signed MoUs or binding agreements with Indonesian entities for precursor cathode active material (pCAM) and cathode active material (CAM) production. The government's BKPM estimates that by 2028, Indonesia could supply 40% of global battery-grade nickel demand.",
      "However, significant challenges remain. Environmental concerns around nickel processing — particularly HPAL tailings management — have drawn scrutiny from European automakers and ESG-focused investors. Indonesia's nickel may face friction in EU battery passport requirements if processing standards are not brought up to international benchmarks.",
      "Investment implications: Indonesian nickel downstream stocks (PT Vale, Nickel Industries via ASX, and unlisted entities through BUMN Holding) offer compelling exposure to the EV megatrend. However, investors should model in price risk — nickel spot prices have been volatile, and the structural narrative does not immunize against cyclical downturns. We rate the sector Overweight with a 2-3 year horizon.",
    ],
  },
  {
    slug: "palm-oil-esg-headwinds",
    locale: "en",
    title: "Palm Oil Sector: Pricing Dynamics & ESG Headwinds",
    excerpt: "Despite price normalization, the palm oil sector faces mounting ESG pressure from European import regulations and sustainability certification requirements.",
    date: "March 15, 2026", readTime: "7 min read", tag: "Sectoral",
    category: "Strategic Industry Deep-dives", categoryHref: "/sectoral/deep-dives",
    body: [
      "Indonesia's palm oil industry — generating $29 billion in export revenue annually — faces a structural headwind that commodity price cycles alone cannot resolve: the European Union Deforestation Regulation (EUDR), which took effect in December 2024.",
      "Under EUDR, palm oil products must be accompanied by geolocation data proving they were not produced on land deforested after December 2020. For Indonesia's fragmented smallholder sector (45% of total production area), this traceability requirement is operationally challenging and costly. Compliance is estimated to cost $180-250 per tonne of CPO for smallholders.",
      "Palm oil spot prices (CPO) have stabilized in the MYR 3,800-4,200/tonne range after the extreme volatility of 2022. Indonesian biodiesel mandates (B35 policy) continue to provide a domestic price floor, absorbing approximately 20% of total production. This partially insulates Indonesian producers from international price swings.",
      "The sector's ESG dynamics are complex. RSPO (Roundtable on Sustainable Palm Oil) certification covers 26% of Indonesian output, but certification is not synonymous with EUDR compliance. Smallholder capacity-building programs, often funded by the plantation levy (BPDPKS), are critical to the transition but underfunded relative to the scale of the challenge.",
      "We maintain a Neutral rating on large Indonesian palm oil companies. The valuation is reasonable (10-12x P/E), and B35 mandates provide earnings visibility. However, European market access risk and ESG discounting in institutional portfolios create a cap on re-rating potential.",
    ],
  },
  {
    slug: "digital-economy-130b",
    locale: "en",
    title: "Digital Economy: The $130B Opportunity",
    excerpt: "Indonesia's digital economy is set to reach $130B by 2028. We examine the sectors driving growth and where capital is flowing.",
    date: "March 8, 2026", readTime: "6 min read", tag: "Tech",
    category: "Strategic Industry Deep-dives", categoryHref: "/sectoral/deep-dives",
    body: [
      "Indonesia's digital economy, measured by Gross Merchandise Value (GMV), reached $82 billion in 2025 according to the Google-Temasek-Bain e-Conomy SEA report — and is projected to reach $130 billion by 2028. This trajectory makes Indonesia the largest digital economy in Southeast Asia.",
      "The growth is broad-based but concentrated in four verticals: e-commerce ($53B GMV, growing 18% YoY), ride-hailing and food delivery ($16B), digital financial services ($8B), and online travel ($5B). Fintech — particularly digital lending and payment infrastructure — is the fastest-growing segment on a penetration basis.",
      "Capital flows into the sector have normalized after the 2021-2022 venture capital boom. Early-stage VC funding fell 45% in 2024, but Series C and later-stage funding has stabilized as quality businesses separate from the pack. GoTo, Tokopedia (now within the TikTok ecosystem), and Bank Jago represent the most visible outcomes of Indonesia's digital economy build-out.",
      "Infrastructure remains a critical enabler. Telkom Indonesia's ongoing fiber rollout and expanding submarine cable connectivity are reducing the digital divide. The government's Palapa Ring project has achieved 97% regency-level connectivity, though last-mile penetration in Eastern Indonesia remains below 60%.",
      "Investment thesis: Indonesian digital economy exposure is best accessed via the banking sector (digital banks capturing MSME lending) and logistics (last-mile delivery infrastructure), rather than direct consumer platform plays which face persistent monetization challenges.",
    ],
  },
  {
    slug: "banking-sector-credit-npl",
    locale: "en",
    title: "Banking Sector: Credit Growth & NPL Risks",
    excerpt: "Indonesian banks show strong credit growth at 10-12% YoY, but rising consumer NPLs in the MSME segment warrant close monitoring.",
    date: "March 1, 2026", readTime: "5 min read", tag: "Finance",
    category: "Strategic Industry Deep-dives", categoryHref: "/sectoral/deep-dives",
    body: [
      "Indonesian banking system credit growth accelerated to 11.8% YoY in February 2026, the strongest pace since 2019. Corporate loans lead at 14.2% growth, driven by infrastructure project financing, while consumer credit at 9.8% and MSME lending at 8.4% show somewhat softer momentum.",
      "Bank capital adequacy ratios (CAR) average 23.4% — comfortably above BI's 14% requirement — and Net Interest Margins (NIM) remain healthy at 4.5-5.5% for major banks. This earnings buffer provides resilience even as the credit cycle matures.",
      "The NPL concern is concentrated in the MSME segment. MSME NPL ratios have drifted from 3.1% (end-2024) to 3.8% (February 2026), driven by small-ticket consumer loans extended by digital lending platforms and multifinance companies. Fintech P2P lending NPLs are a particular concern, with some platforms reporting >8% NPL rates.",
      "OJK's regulatory response includes: mandatory provisioning for loans >90 days past due, stricter onboarding requirements for digital lenders, and enhanced data sharing via the credit bureau (SLIK). These measures should moderate NPL accumulation but may temporarily slow credit growth.",
      "Sector stance: Big-4 banks (BRI, BCA, Mandiri, BNI) remain our preferred positioning — strong deposit franchises, retail scale, and provisioning buffers make them well-positioned for a moderate credit cycle downturn. We are more cautious on multifinance and digital lending sub-sectors.",
    ],
  },

  // ─── REGIONAL ─────────────────────────────────────────────────────────────
  {
    slug: "java-economic-corridor",
    locale: "en",
    title: "Java Economic Corridor: Growth Concentration & Disparity",
    excerpt: "Over 58% of Indonesia's GDP is generated in Java. We assess spillover effects and the role of Nusantara in redistributing economic activity.",
    date: "March 20, 2026", readTime: "8 min read", tag: "Regional",
    category: "Regional Economic Monitor", categoryHref: "/sectoral/regional",
    image: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=1200&q=85",
    body: [
      "Java's economic dominance is both Indonesia's greatest strength and its most persistent structural challenge. The island generates 58.5% of national GDP despite housing only 56% of the population — and the gap has been slowly widening over the past decade as agglomeration effects reinforce concentration.",
      "The Greater Jakarta metropolitan area (Jabodetabek) alone contributes 17% of national GDP. Its economic gravity — anchored by financial services, government, and consumer markets — continues to attract human capital and investment at rates that outpace other regions.",
      "Infrastructure investment is gradually shifting the equation. The completion of the Trans-Java Toll Road, connecting Merak (Banten) to Banyuwangi (East Java) via an 1,150km expressway, has catalyzed industrial relocation from the congested Jakarta-Karawang corridor to Central and East Java. Batang and Brebes SEZs are capturing manufacturing FDI previously concentrated in West Java.",
      "The Nusantara factor is real but modest in the near term. The new capital city is driving significant construction activity in East Kalimantan (GRDP growth: +8.2% in 2025), but the direct economic impact on Java deconcentration is limited until central government functions actually relocate — currently planned for completion in 2028-2030.",
      "Policy recommendation: Interregional fiscal transfer reform (Dana Alokasi Umum) should more aggressively weight productive capacity metrics rather than just population. Current formulas incentivize sub-national governments to optimize transfer receipts rather than develop productive economic capacity.",
    ],
  },
  {
    slug: "kalimantan-nusantara-investment",
    locale: "en",
    title: "Kalimantan: Beyond the Capital City — Investment Momentum",
    excerpt: "IKN continues to attract investment despite logistical challenges. We map the real estate, infrastructure, and services opportunities emerging in the region.",
    date: "March 12, 2026", readTime: "6 min read", tag: "Regional",
    category: "Regional Economic Monitor", categoryHref: "/sectoral/regional",
    body: [
      "Nusantara — Indonesia's new capital city under construction in East Kalimantan — has attracted $35 billion in committed investments as of Q1 2026, according to IKN Authority data. The mix spans government facilities, private residential developments, commercial real estate, and supporting infrastructure.",
      "The investment picture is more nuanced than headline numbers suggest. Committed investment differs substantially from realized investment — the IKN Authority reports 38% of committed funds have reached disbursement stage. Construction progress on core government buildings and supporting infrastructure is tracking broadly to plan, with Phase 1 expected to host initial government operations in 2028.",
      "Beyond the capital itself, the broader East Kalimantan investment case is compelling. The province holds significant coal reserves, emerging nickel deposits in North Kalimantan, and growing industrial estate capacity. The Kariangau Industrial Zone and JIIPE-East Kalimantan are attracting energy-intensive industries seeking proximity to both resources and the new administrative hub.",
      "Logistics infrastructure remains the critical constraint. The Balikpapan-Nusantara toll road is under construction (expected 2027 completion). Sepinggan Airport (Balikpapan) is undergoing expansion. The Samarinda railway feasibility study is advancing. Resolution of logistics bottlenecks will be the key unlock for broader regional development.",
    ],
  },
  {
    slug: "sumatra-connectivity",
    locale: "en",
    title: "Sumatra Connectivity: Trade Flows & Infrastructure Gap",
    excerpt: "Sumatra remains underserved by transport infrastructure relative to its economic potential. New toll roads are changing the calculus.",
    date: "March 5, 2026", readTime: "5 min read", tag: "Regional",
    category: "Regional Economic Monitor", categoryHref: "/sectoral/regional",
    body: [
      "Sumatra is Indonesia's second-largest island by economic output and the nation's primary agricultural commodity export corridor — yet its connectivity infrastructure has historically lagged Java by 15-20 years of development. This gap is beginning to close, with significant implications for regional economic performance.",
      "The Trans-Sumatra Toll Road, a 2,800km project connecting Lampung to Aceh, is now 78% complete. Sections through South Sumatra, Riau, and North Sumatra have opened, reducing intercity freight costs by 25-30% on completed routes. Full completion is targeted for 2028.",
      "The economic impact is tangible. Palm oil smallholders in areas adjacent to new toll road sections report 15-18% improvement in net farm prices due to reduced logistics costs. Industrial estates in Palembang (South Sumatra) are reporting accelerating FDI inquiries, particularly from companies seeking connectivity to the Sunda Strait crossing (linking to Java's port infrastructure).",
      "Sumatra's key economic anchors — Medan (North Sumatra's financial and industrial hub), Batam (free trade zone), and Pekanbaru (Riau's energy and agribusiness center) — all benefit from improved connectivity but require targeted investment in industrial and logistics infrastructure to fully capitalize on their potential.",
      "Batam deserves special mention: the recent expansion of its Special Economic Zone mandate and improved sea connectivity to Singapore position it well to capture electronics and precision manufacturing FDI in the context of Singapore's growing land and labor cost constraints.",
    ],
  },

  // ─── ESG ──────────────────────────────────────────────────────────────────
  {
    slug: "indonesia-green-bond-market",
    locale: "en",
    title: "Indonesia's Green Bond Market: Growth & Credibility Challenges",
    excerpt: "The Indonesian green bond market grew 45% in 2025, but greenwashing concerns persist. We assess the regulatory landscape and best practices.",
    date: "March 25, 2026", readTime: "7 min read", tag: "ESG",
    category: "ESG", categoryHref: "/sectoral/esg",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=85",
    body: [
      "Indonesia's sustainable finance market expanded rapidly in 2025, with green, social, sustainability, and sustainability-linked bond issuance reaching $12.4 billion — a 45% increase from 2024. The government's sovereign green sukuk program, which has attracted international institutional investors since its 2018 debut, continues to anchor market development.",
      "Corporate green bond issuance is broadening beyond the banking sector. Real estate, telecommunications, and manufacturing companies are accessing the market, though issuance quality is uneven. OJK's sustainable finance taxonomy (published 2023) provides the definitional framework but lacks the detailed technical screening criteria that mature markets employ.",
      "Greenwashing risk is a legitimate concern. AndaraLab's analysis of 2024-2025 corporate green bond offerings found that 23% of reported 'green' use-of-proceeds allocations were directed toward activities that would not meet ICMA Green Bond Principles or EU Taxonomy alignment requirements. This includes coal-adjacent infrastructure, natural gas distribution, and palm oil logistics.",
      "The regulatory response is developing. OJK issued Regulation No. 18/2023 mandating third-party verification for green bonds above Rp 500 billion, and the Financial Services Development (KSEI) is building a green bond registry. These are positive steps, but enforcement capacity and penalty frameworks need strengthening.",
      "For international investors: Indonesia sovereign green sukuk (tenor 5Y, yield ~6.3%) offers attractive yield-to-quality and is appropriate for ESG-mandated portfolios. Corporate green bonds require individual assessment — we recommend investors apply their own alignment screening rather than relying solely on Indonesian issuer self-labeling.",
    ],
  },
  {
    slug: "corporate-governance-reform",
    locale: "en",
    title: "Corporate Governance Reform: Impact on Foreign Investment",
    excerpt: "New OJK governance regulations are strengthening transparency requirements for listed companies, with significant implications for foreign investor confidence.",
    date: "March 17, 2026", readTime: "6 min read", tag: "Governance",
    category: "ESG", categoryHref: "/sectoral/esg",
    body: [
      "OJK's 2024 Corporate Governance Package — a comprehensive set of seven new regulations affecting IDX-listed companies — represents the most significant governance reform since the Sarbanes-Oxley-inspired reforms of 2012. The regulations cover board composition, independent commissioner requirements, related-party transaction approval, and mandatory audit committee reforms.",
      "The most impactful change is the independent commissioner quota expansion: by 2026, all companies with market capitalization above Rp 10 trillion must ensure at least 40% of board commissioners are independent, up from 30%. For companies with concentrated ownership structures (where controlling shareholders dominate through board representation), this is a material change.",
      "Foreign institutional investors have responded positively. EPFR data shows net inflows into Indonesian equities accelerated following the governance regulation announcements, with dedicated Asia ex-Japan EM funds increasing Indonesia weight by an average of 30bps. Governance quality is a key screen in many institutional mandates.",
      "The related-party transaction reforms are particularly important for minority shareholders in family-controlled conglomerates. New rules require: majority-of-minority approval for transactions above Rp 500 billion with affiliated parties, mandatory independent valuations, and enhanced disclosure timelines. These provisions materially strengthen minority rights.",
      "Challenges remain in implementation. OJK's enforcement capacity is limited, and administrative penalties for governance violations are still modest relative to the financial stakes. We recommend investors track governance metrics (via the ASEAN Corporate Governance Scorecard) as a complement to financial analysis.",
    ],
  },
  {
    slug: "indonesia-coal-exit-jetp",
    locale: "en",
    title: "Just Energy Transition: Indonesia's Coal Exit Timeline",
    excerpt: "Under JETP commitments, Indonesia targets coal phase-out by 2050. We model the economic impact and investment requirements.",
    date: "March 9, 2026", readTime: "8 min read", tag: "Energy",
    category: "ESG", categoryHref: "/sectoral/esg",
    body: [
      "Indonesia's Just Energy Transition Partnership (JETP) — a $20 billion international financing commitment to accelerate the country's clean energy transition — represents a landmark in climate finance, but the pathway from commitment to implementation is complex and contested.",
      "The core JETP target is peaking power sector emissions by 2030 and achieving net zero by 2050, with early retirement of coal power plants (PLTUs) as the central mechanism. Indonesia's coal power fleet totals 54 GW, much of it mid-life (average age: 12 years), creating significant stranded asset risk for state utility PLN and its private generation partners.",
      "The economics of coal retirement are challenging. Indonesian coal is cheap by global standards (domestic market obligation coal prices are capped at $70/tonne), and the PLN system is designed around this cost structure. Replacement with new renewables requires significant transmission investment and storage capacity that currently does not exist at scale.",
      "We model three scenarios. Base case: phased retirement of 15 GW of coal by 2035, replaced by 40 GW of new renewable capacity (solar, geothermal, hydro). This requires $80-100 billion of total investment over 10 years. The JETP financing covers approximately 25% of this, requiring Indonesian public and private capital to bridge the gap.",
      "The political economy dimension cannot be ignored. East Kalimantan, South Kalimantan, and South Sumatra provinces are heavily dependent on coal mining employment and tax revenues. A just transition requires sustained investment in economic diversification for coal-dependent regions — currently underfunded in the JETP implementation plan.",
    ],
  },

  // ─── BLOG ─────────────────────────────────────────────────────────────────
  {
    slug: "what-is-current-account-deficit",
    locale: "en",
    title: "What Is the Current Account Deficit (and Why Does It Matter)?",
    excerpt: "Many people confuse trade balance with current account. Here's a clear breakdown of what each metric measures and why Indonesia's current account matters for your portfolio.",
    date: "March 24, 2026", readTime: "5 min read", tag: "Education",
    category: "Economics 101", categoryHref: "/blog/economics-101",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85",
    body: [
      "The current account is one of the most cited — and most misunderstood — macroeconomic indicators. Let's demystify it.",
      "The current account measures a country's net transactions with the rest of the world across three sub-accounts: (1) the goods trade balance (exports minus imports of physical goods), (2) the services trade balance (tourism, financial services, transportation), and (3) primary and secondary income (profit remittances, worker remittances, foreign aid).",
      "A current account deficit means a country is importing more than it exports in aggregate — it is a net borrower from the rest of the world. This is not inherently bad. The US has run a current account deficit for decades while remaining the world's largest economy. What matters is whether the deficit is 'financeable' — i.e., whether foreign investors are willing to fund it through capital inflows.",
      "For Indonesia, the current account matters because the country relies on foreign capital inflows (portfolio investment and FDI) to finance its external position. When global risk appetite deteriorates, these inflows can reverse, putting pressure on the IDR. This is why BI watches the current account closely alongside reserve adequacy.",
      "Practical implication: when Indonesia's current account deficit widens above 3% of GDP, historical data shows IDR tends to weaken 5-10% over the following 12 months. At the current 0.5% deficit, the balance sheet is healthy — but monitor it as the import cycle accelerates.",
    ],
  },
  {
    slug: "cpi-vs-core-inflation",
    locale: "en",
    title: "Understanding Inflation: CPI vs Core Inflation",
    excerpt: "CPI and core inflation tell different stories. Learn which one the central bank cares about most and why.",
    date: "March 17, 2026", readTime: "4 min read", tag: "Education",
    category: "Economics 101", categoryHref: "/blog/economics-101",
    body: [
      "Inflation is not one number — it's a family of measures, each telling a different story. The two most important for understanding Indonesia's monetary policy are headline CPI and core inflation.",
      "Headline CPI (Consumer Price Index) measures the average price change across a basket of goods and services that a typical Indonesian household buys. This basket includes food, housing, transportation, healthcare, and education. BPS (Indonesia's statistics agency) publishes this monthly, and the March 2026 reading is 2.51% YoY.",
      "Core inflation excludes the most volatile components: raw food prices (which swing with weather and harvests) and administered prices (like subsidized fuel). It's a cleaner signal of underlying demand-driven inflation — the kind that monetary policy can actually influence. Core inflation currently stands at 2.1%.",
      "Bank Indonesia primarily targets core inflation when calibrating policy. Headline CPI can spike due to a bad harvest (outside BI's control), but core inflation rising signals genuine overheating that requires rate increases. Conversely, core inflation falling gives BI the room to cut rates without fearing inflationary consequences.",
      "Simple rule of thumb: When headline CPI and core inflation diverge significantly, dig into why. If headline is high but core is low, it's probably a supply shock (food, energy) — monetary policy tightening would be the wrong response. If both are rising, the economy may be overheating.",
    ],
  },
  {
    slug: "fx-reserves-indonesia",
    locale: "en",
    title: "FX Reserves: Indonesia's Buffer Against External Shocks",
    excerpt: "With $150B in reserves, Indonesia is relatively well-cushioned. But what constitutes 'adequate' reserves? We explain.",
    date: "March 10, 2026", readTime: "5 min read", tag: "Education",
    category: "Economics 101", categoryHref: "/blog/economics-101",
    body: [
      "Indonesia's foreign exchange reserves stand at approximately $150 billion as of early 2026 — a significant war chest that provides BI with firepower to defend the IDR and absorb external shocks. But how do we assess whether $150 billion is 'enough'?",
      "The most common adequacy metric is months of import cover. Indonesia's reserves cover approximately 6.5 months of goods and services imports — comfortably above the IMF's general guideline of 3 months. By this measure, Indonesia is well-buffered.",
      "A more sophisticated measure is the IMF's Assessing Reserve Adequacy (ARA) metric, which accounts for short-term external debt, M2 money supply, and export revenues. By this framework, Indonesia's reserves at ~105% of the ARA composite metric are in 'adequate to adequate plus' territory — solid but not excessively so.",
      "What could draw down reserves rapidly? The key risk is a sudden stop in capital flows — a scenario where portfolio investors (who hold ~35% of Indonesian government bonds) simultaneously exit. BI used $18 billion of reserves defending the IDR during the 2018 Taper Tantrum. Today's higher reserves provide more cushion, but the vulnerability remains.",
      "Monitoring signal: watch the weekly BI reserve data (published every two weeks). A decline of more than $5 billion in a single reporting period signals active intervention and elevated market stress. Current stable readings are a positive indicator.",
    ],
  },
  {
    slug: "interest-rate-cycles-investments",
    locale: "en",
    title: "Interest Rate Cycles: How BI Moves Affect Your Investments",
    excerpt: "Rising rates compress bond prices but boost savings yields. Here's the full picture of rate cycle effects across asset classes.",
    date: "March 3, 2026", readTime: "6 min read", tag: "Education",
    category: "Economics 101", categoryHref: "/blog/economics-101",
    body: [
      "Bank Indonesia's interest rate decisions ripple through every corner of the investment landscape — from government bonds to bank stocks, from property to equity valuations. Understanding these transmission mechanisms helps investors position for the cycle ahead.",
      "Bonds are the most direct beneficiary (or victim) of rate moves. When BI raises rates, existing bond prices fall because new bonds offer higher yields, making existing lower-yield bonds less attractive. The 10-year government bond (SBN) fell approximately 8% in price during BI's 2022-2024 tightening cycle. Conversely, when BI cuts rates, bond prices rise — which is why fixed income is now an attractive asset class heading into the expected easing cycle.",
      "Equities have a more complex relationship with rates. Higher rates increase the discount rate used in DCF valuation models, compressing price-to-earnings multiples — this is why growth stocks (with earnings far in the future) are hit hardest by rate hikes. Banks, however, benefit from higher rates in the short run through expanded net interest margins.",
      "Property markets respond with a lag. Higher mortgage rates (which track BI rate moves) cool demand for residential property, but the effect takes 6-12 months to fully materialize. Developer stocks (listed property companies) typically reprice more quickly than underlying property values.",
      "Savings and money market instruments benefit from rate hikes — deposit rates rise, and money market funds (reksa dana pasar uang) yield more. In a cutting cycle, savers face reinvestment risk as their deposits renew at lower rates. This dynamic historically pushes retail savings toward equity mutual funds and longer-duration bonds.",
    ],
  },

  // ─── MARKET PULSE ────────────────────────────────────────────────────────
  {
    slug: "jci-7200-bi-hold",
    locale: "en",
    title: "JCI Hits 7,200 on BI Hold — What Equity Investors Should Watch",
    excerpt: "The JCI breached 7,200 following BI's unchanged rate decision. We assess whether this rally has legs and identify key levels to monitor.",
    date: "March 17, 2026", readTime: "4 min read", tag: "Market",
    category: "Market Pulse", categoryHref: "/blog/market-pulse",
    body: [
      "The Jakarta Composite Index (JCI/IHSG) crossed the 7,200 mark for the first time in 8 months following Bank Indonesia's hold decision, closing at 7,214 on the day of the announcement. The move was driven by a risk-on rotation into Indonesian equities on improved rate outlook clarity.",
      "Banking stocks led the rally — BCA, Mandiri, and BRI collectively added Rp 45 trillion in market cap in the session. Financials tend to perform well in 'rate hold' environments because the hold eliminates the immediate compression on NIM that a cut would bring, while signaling future easing that supports credit growth and reduces NPL risk.",
      "Technical analysis: the JCI has now cleared resistance at 7,150 (the 200-day moving average) and the next meaningful resistance level is 7,400-7,450, which coincides with the February 2024 peak. Support is at 7,050 (former resistance, now support).",
      "Key catalysts to watch over the next 30 days: (1) April US CPI data (May 13 release) — a benign print could accelerate Fed cut expectations and support emerging market inflows; (2) Indonesia Q1 2026 GDP release (May 5) — consensus at 5.0%, a beat would be a positive catalyst; (3) OJK quarterly bank NPL data — any deterioration could weigh on financials.",
      "Our 12-month JCI target remains 7,500-7,600. We recommend overweight position in domestic consumption (retail, FMCG), infrastructure (toll road, cement), and selective financials (BCA, BRI). Underweight resource exporters given commodity price uncertainty.",
    ],
  },
  {
    slug: "idr-carry-trade-dynamics",
    locale: "en",
    title: "IDR Currency Dynamics: Carry Trade and What Drives the Exchange Rate",
    excerpt: "The IDR has appreciated 2.1% against the USD over the past month as BI signals a hold. We examine the carry trade dynamics at play.",
    date: "March 26, 2026", readTime: "6 min read", tag: "FX",
    category: "Market Pulse", categoryHref: "/blog/market-pulse",
    body: [
      "The Indonesian Rupiah (IDR) has strengthened from 17,500 to 17,094 per USD over the past four weeks — an appreciation of approximately 2.3%. For a currency that spent much of 2024 under pressure, this is a meaningful shift. What is driving it?",
      "The primary driver is carry trade dynamics. The IDR offers a positive carry — the return from holding IDR assets (government bond yield ~6.8%) versus USD assets (US 10Y at 4.28%) — of approximately 250bps. When global risk appetite is supportive and USD momentum is neutral or negative, this carry attracts capital flows into IDR assets.",
      "BI's hold decision reinforced the carry story by removing the downside risk of a surprise cut that would compress yield differentials. The market reads the hold as 'rates will stay high for a while yet' — extending the window for carry exploitation.",
      "However, carry trades can unwind rapidly. The key risk factor is a reassertion of USD strength, which could come from a hot US inflation print, a Fed hawkish surprise, or a global risk-off event. In such scenarios, carry traders exit IDR positions quickly, as seen in the 2018 Taper Tantrum and March 2020 COVID shock.",
      "Our IDR forecast: 15,700-16,000 range over the next 3 months (base case), with downside risk to 16,500 if the Fed delays cuts beyond September 2026. For corporates with USD obligations, we recommend opportunistic hedging at current levels given the relatively favorable spot rate.",
    ],
  },

  // ─── LAB NOTES ────────────────────────────────────────────────────────────
  {
    slug: "how-we-build-macro-models",
    locale: "en",
    title: "Inside AndaraLab: How We Build Our Macro Forecasting Models",
    excerpt: "A behind-the-scenes look at the data sources, statistical methods, and scenario frameworks we use to generate our economic outlook.",
    date: "March 20, 2026", readTime: "8 min read", tag: "Lab Notes",
    category: "Lab Notes", categoryHref: "/blog/lab-notes",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=85",
    body: [
      "Economic forecasting is part art, part science, and — if we're honest — part humility. At AndaraLab, we build our macro models on a foundation of three principles: data transparency, scenario-based thinking, and explicit uncertainty quantification.",
      "Our primary data sources for Indonesia are BPS (national accounts, trade, CPI), Bank Indonesia (monetary data, banking system statistics, BoP), DJPPR (government bond auction data), and BEI (equity market data). We supplement with IMF, World Bank, and CEIC for international comparisons and high-frequency indicators.",
      "For GDP forecasting, we use a short-run model combining demand-side components (consumption, investment, government spending, net exports) with high-frequency leading indicators (PMI, electricity consumption, motorcycle sales, cement dispatch). The leading indicator model has demonstrated better near-term accuracy than pure demand decomposition.",
      "Monetary policy modeling uses a modified Taylor Rule framework calibrated to BI's revealed preferences from 2015-2025 rate decisions. We estimate BI's implicit reaction function weights on inflation deviation (~0.8) and output gap (~0.4), with the exchange rate entering as a conditioning variable rather than a formal target.",
      "Crucially, we publish three scenarios for each major forecast: base case (60% probability), upside (20%), and downside (20%). The probability weights are informed by quantitative risk modeling but ultimately involve judgment. We find that explicit scenario frameworks discipline internal debate and make our uncertainty visible to clients — which is how it should be.",
    ],
  },
  {
    slug: "data-quality-indonesia-challenge",
    locale: "en",
    title: "The Data Quality Challenge: Working with Indonesian Economic Statistics",
    excerpt: "Pioneering research in a market like Indonesia requires navigating imperfect data. Here's how we approach the challenge.",
    date: "March 13, 2026", readTime: "6 min read", tag: "Lab Notes",
    category: "Lab Notes", categoryHref: "/blog/lab-notes",
    body: [
      "One of the first things researchers discover when working with Indonesian economic data is that it is improving — but imperfect. At AndaraLab, navigating data quality is a core competency, not an afterthought.",
      "The primary challenges are: (1) revision magnitude — BPS GDP data is frequently revised, sometimes by 0.2-0.3pp, making real-time analysis hazardous; (2) publication lag — key series like provincial GRDP data arrive 6-9 months after the reference period; (3) methodological change — Indonesia adopted SNA2008 national accounts standards in 2017, creating breaks in historical series.",
      "Our approach to data uncertainty is to triangulate. Rather than relying on a single official series, we cross-check GDP data with electricity consumption, fuel imports, and cement production data — all of which are more timely and harder to misreport. This triangulation approach catches anomalies and gives us earlier signals when official data may be revised.",
      "Sectoral data quality varies enormously. Financial sector data (BI banking statistics) is excellent — timely, granular, and well-governed. Agricultural data suffers from the most significant measurement challenges, with crop production surveys relying on outdated area estimates in some provinces.",
      "We believe research quality in emerging markets is a function of how rigorously you question your data sources, not just how sophisticated your models are. Garbage in, garbage out — but in Indonesia, even the garbage can be informative if you know how to read it.",
    ],
  },
  {
    slug: "nowcasting-indonesia-gdp",
    locale: "en",
    title: "Nowcasting Indonesia's GDP: Real-Time Indicators We Track",
    excerpt: "Official GDP data arrives with a 6-week lag. Here are the high-frequency indicators we monitor to estimate growth in real time.",
    date: "March 6, 2026", readTime: "7 min read", tag: "Lab Notes",
    category: "Lab Notes", categoryHref: "/blog/lab-notes",
    body: [
      "Indonesia's GDP data is released approximately 6 weeks after the end of each quarter — a lag that creates significant uncertainty for investors and policymakers making real-time decisions. Nowcasting is the practice of estimating current GDP growth using high-frequency, timely indicators before the official data arrives.",
      "Our nowcasting framework for Indonesia uses a Dynamic Factor Model (DFM) that extracts common factors from a panel of 28 monthly and weekly indicators. The model updates continuously as new data arrives, producing a running GDP growth estimate for the current quarter.",
      "The indicators with the highest factor loadings (i.e., most informative for GDP) are: motorcycle sales (Astra International monthly data), cement dispatch (ASI data), Purchasing Managers Index — Manufacturing (S&P Global, published 1st business day of each month), electricity consumption (PLN monthly), and Retail Sales Survey (BI monthly).",
      "The model's track record is reasonably good: over the past 12 quarters, our real-time nowcast for the final quarter has deviated from the official BPS estimate by an average of 0.18pp. The largest miss was Q3 2022 (+0.41pp error), when global commodity price effects disrupted normal relationships between leading indicators and GDP.",
      "One important caveat: nowcasting models are not crystal balls. They are 'weighted averages of information' and will fail when structural breaks occur (pandemics, sudden policy shifts, external shocks). We treat nowcasts as one input among many, not as a definitive forecast.",
    ],
  },
];

export function getArticle(slug: string, locale: "en" | "id" = "en"): Article | undefined {
  // If a locale-specific version exists, return it; otherwise fall back to the canonical (en) version
  return articles.find((a) => a.slug === slug && a.locale === locale)
    ?? articles.find((a) => a.slug === slug && a.locale === "en");
}

export function getRelated(slug: string, locale: "en" | "id" = "en", limit = 3): Article[] {
  const current = getArticle(slug, locale);
  if (!current) return [];
  return articles
    .filter((a) => a.slug !== slug && a.categoryHref === current.categoryHref && a.locale === locale)
    .slice(0, limit);
}

export function getArticlesByLocale(locale: "en" | "id" = "en"): Article[] {
  return articles.filter((a) => a.locale === locale);
}
