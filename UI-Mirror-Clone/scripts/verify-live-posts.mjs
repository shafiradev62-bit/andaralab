const BASE = "https://andaralab.id";

async function getJson(path) {
  const res = await fetch(BASE + path);
  const body = await res.json();
  return { status: res.status, body };
}

function bodyStats(post) {
  const lines = post.body || [];
  const joined = lines.join("\n");
  const textOnly = joined.replace(/\[IMG:[^\]]+\]/g, "").trim();
  const imgs = lines.filter((l) => l.includes("[IMG:")).length;
  return { lines: lines.length, chars: joined.length, textChars: textOnly.length, imgs };
}

const CHECK_IDS = [92, 59];

console.log("=== VERIFY LIVE (API = source of truth for SPA) ===\n");

for (const id of CHECK_IDS) {
  const admin = await getJson(`/api/blog/${id}`);
  const post = admin.body.data;
  const pub = await getJson(`/api/blog/slug/${encodeURIComponent(post.slug)}`);
  const live = pub.body.data;
  const adminStats = bodyStats(post);
  const liveStats = bodyStats(live);

  const ok =
    post.status === "published" &&
    live.status === "published" &&
    liveStats.textChars > 100 &&
    adminStats.textChars === liveStats.textChars;

  console.log(`Post ${id}: ${ok ? "✓ LIVE OK" : "✗ PROBLEM"}`);
  console.log(`  Title: ${post.title}`);
  console.log(`  Status: ${post.status} | Updated: ${post.updatedAt}`);
  console.log(`  Admin API: ${adminStats.lines} lines, ${adminStats.textChars} text chars, ${adminStats.imgs} imgs`);
  console.log(`  Public slug API: ${liveStats.lines} lines, ${liveStats.textChars} text chars, ${liveStats.imgs} imgs`);
  console.log(`  URL: ${BASE}/article/${post.slug}`);
  console.log(`  First text: ${(live.body || []).find((l) => l && !l.startsWith("[IMG:"))?.slice(0, 100) || "(empty)"}`);
  console.log("");
}

// Activity log cross-check
try {
  const act = await getJson("/api/activity?limit=50");
  const updates = (act.body.data || []).filter(
    (a) => a.action === "update" && String(a.resource || "").toLowerCase().includes("blog"),
  );
  const posts = (await getJson("/api/blog")).body.data;

  console.log("=== ACTIVITY LOG vs LIVE (recent blog updates) ===\n");
  const seen = new Set();
  for (const a of updates) {
    const detail = a.detail || a.message || "";
    const title = detail.replace(/^Updated post:\s*/i, "").replace(/^"|"$/g, "");
    if (seen.has(title)) continue;
    seen.add(title);

    const post = posts.find((p) => p.title === title || p.title.startsWith(title.slice(0, 40)));
    if (!post) {
      console.log(`? "${title.slice(0, 55)}" — tidak ketemu di API`);
      continue;
    }
    const pub = await getJson(`/api/blog/slug/${encodeURIComponent(post.slug)}`);
    const live = pub.body.data;
    const st = bodyStats(live);
    const ok = live.status === "published" && st.textChars > 50;
    console.log(`${ok ? "✓" : "✗"} id=${post.id} | ${live.status} | ${st.textChars} chars | ${title.slice(0, 55)}`);
  }
} catch (e) {
  console.log("Activity log skip:", e.message);
}
