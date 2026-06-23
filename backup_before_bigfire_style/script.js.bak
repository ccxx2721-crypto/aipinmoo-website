const form = document.querySelector("#serviceForm");
const note = document.querySelector("#formNote");
const config = window.AIPIMOO_CONFIG || {};

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = data.get("name")?.toString().trim();
  const phone = data.get("phone")?.toString().trim();
  const service = data.get("service")?.toString().trim();
  const message = data.get("message")?.toString().trim();

  const summary = `您好，我是 ${name}，電話 ${phone}。想詢問「${service}」：${message}`;

  if (!navigator.clipboard) {
    note.textContent = summary;
    return;
  }

  navigator.clipboard
    .writeText(summary)
    .then(() => {
      note.textContent = "已整理並複製諮詢內容，可直接貼到 LINE 傳給噯拼哞。";
    })
    .catch(() => {
      note.textContent = summary;
    });
});

const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);

function getSupabaseClient() {
  if (!hasSupabaseConfig) return null;
  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

function publicImageUrl(client, path) {
  if (!client || !path) return "";
  const { data } = client.storage.from(config.storageBucket || "aipimoo-images").getPublicUrl(path);
  return data?.publicUrl || "";
}

function updateImage(selector, url) {
  if (!url) return;
  document.querySelectorAll(selector).forEach((image) => {
    image.src = url;
  });
}

function caseCardTemplate(item, beforeUrl, afterUrl) {
  const safe = (value) => String(value || "未填寫");
  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <article class="case-card">
        <div class="case-compare">
          <figure>
            <span>施工前</span>
            <img src="${beforeUrl}" alt="${safe(item.service_type)}施工前照片" loading="lazy" />
          </figure>
          <figure>
            <span>完工後</span>
            <img src="${afterUrl}" alt="${safe(item.service_type)}完工後照片" loading="lazy" />
          </figure>
        </div>
        <div class="case-content">
          <span class="case-tag">${safe(item.service_type)}</span>
          <dl>
            <div><dt>地區</dt><dd>${safe(item.area)}</dd></div>
            <div><dt>出工人數</dt><dd>${safe(item.crew_count)}</dd></div>
            <div><dt>工時</dt><dd>${safe(item.work_hours)}</dd></div>
            <div><dt>處理內容</dt><dd>${safe(item.description)}</dd></div>
          </dl>
        </div>
      </article>
    </div>
  `;
}

async function loadSiteAssets(client) {
  const { data, error } = await client.from("site_assets").select("asset_key,image_path");
  if (error || !data) return;

  const assets = Object.fromEntries(data.map((item) => [item.asset_key, item.image_path]));
  updateImage(".brand-logo img, .footer-brand img", publicImageUrl(client, assets.logo));
  updateImage(".hero-brand-image", publicImageUrl(client, assets.hero));
}

async function loadCases(client) {
  const grid = document.querySelector("#caseGrid");
  const emptyState = document.querySelector("#caseEmptyState");
  if (!grid || !emptyState) return;

  const { data, error } = await client
    .from("cases")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return;

  const cards = data
    .map((item) => {
      const beforeUrl = publicImageUrl(client, item.before_image_path);
      const afterUrl = publicImageUrl(client, item.after_image_path);
      if (!beforeUrl || !afterUrl) return "";
      return caseCardTemplate(item, beforeUrl, afterUrl);
    })
    .join("");

  if (!cards) return;
  grid.innerHTML = cards;
  grid.hidden = false;
  emptyState.hidden = true;
}

async function loadDynamicContent() {
  const client = getSupabaseClient();
  if (!client) return;
  await Promise.all([loadSiteAssets(client), loadCases(client)]);
}

loadDynamicContent();
