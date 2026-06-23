const adminConfig = window.AIPIMOO_CONFIG || {};
const loginPanel = document.querySelector("#loginPanel");
const dashboardPanel = document.querySelector("#dashboardPanel");
const loginForm = document.querySelector("#loginForm");
const loginNote = document.querySelector("#loginNote");
const assetNote = document.querySelector("#assetNote");
const caseNote = document.querySelector("#caseNote");
const caseForm = document.querySelector("#caseForm");
const adminCaseList = document.querySelector("#adminCaseList");
const logoutButton = document.querySelector("#logoutButton");

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = Number(adminConfig.maxImageSizeMb || 5) * 1024 * 1024;

if (!adminConfig.supabaseUrl || !adminConfig.supabaseAnonKey || !window.supabase) {
  loginNote.textContent = "尚未設定 Supabase。請先填寫 site-config.js。";
}

const supabaseClient =
  adminConfig.supabaseUrl && adminConfig.supabaseAnonKey && window.supabase
    ? window.supabase.createClient(adminConfig.supabaseUrl, adminConfig.supabaseAnonKey)
    : null;

function setNote(element, message) {
  if (element) element.textContent = message;
}

function validateImage(file) {
  if (!file) throw new Error("請選擇圖片。");
  if (!allowedTypes.includes(file.type)) throw new Error("圖片格式僅支援 jpg、png、webp。");
  if (file.size > maxImageSize) throw new Error(`圖片不可超過 ${adminConfig.maxImageSizeMb || 5}MB。`);
}

function fileExt(file) {
  return file.name.split(".").pop()?.toLowerCase() || "jpg";
}

function publicImageUrl(path) {
  const { data } = supabaseClient.storage.from(adminConfig.storageBucket).getPublicUrl(path);
  return data?.publicUrl || "";
}

async function uploadImage(file, folder) {
  validateImage(file);
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${fileExt(file)}`;
  const { error } = await supabaseClient.storage
    .from(adminConfig.storageBucket)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });
  if (error) throw error;
  return path;
}

async function showDashboard() {
  loginPanel.hidden = true;
  dashboardPanel.hidden = false;
  await loadCases();
}

async function showLogin() {
  loginPanel.hidden = false;
  dashboardPanel.hidden = true;
}

async function checkSession() {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    await showDashboard();
  } else {
    await showLogin();
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return;

  setNote(loginNote, "登入中...");
  const formData = new FormData(loginForm);
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    setNote(loginNote, "登入失敗，請確認帳號或密碼。");
    return;
  }
  setNote(loginNote, "");
  await showDashboard();
});

logoutButton?.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  await showLogin();
});

document.querySelectorAll(".asset-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return;

    const assetKey = form.dataset.assetKey;
    const file = new FormData(form).get("image");

    try {
      setNote(assetNote, "上傳中...");
      const path = await uploadImage(file, "site-assets");
      const { error } = await supabaseClient
        .from("site_assets")
        .upsert({ asset_key: assetKey, image_path: path, updated_at: new Date().toISOString() });
      if (error) throw error;
      form.reset();
      setNote(assetNote, "圖片已更新，回首頁重新整理即可看到。");
    } catch (error) {
      setNote(assetNote, error.message || "上傳失敗。");
    }
  });
});

caseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabaseClient) return;

  const formData = new FormData(caseForm);
  try {
    setNote(caseNote, "案例上傳中...");
    const beforePath = await uploadImage(formData.get("beforeImage"), "cases");
    const afterPath = await uploadImage(formData.get("afterImage"), "cases");
    const { error } = await supabaseClient.from("cases").insert({
      before_image_path: beforePath,
      after_image_path: afterPath,
      service_type: formData.get("serviceType")?.toString().trim(),
      area: formData.get("area")?.toString().trim(),
      crew_count: formData.get("crewCount")?.toString().trim(),
      work_hours: formData.get("workHours")?.toString().trim(),
      description: formData.get("description")?.toString().trim(),
      published: true
    });
    if (error) throw error;
    caseForm.reset();
    setNote(caseNote, "案例已新增，首頁重新整理後會顯示。");
    await loadCases();
  } catch (error) {
    setNote(caseNote, error.message || "案例新增失敗。");
  }
});

async function loadCases() {
  if (!supabaseClient || !adminCaseList) return;
  const { data, error } = await supabaseClient
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    adminCaseList.textContent = "案例讀取失敗。";
    return;
  }

  if (!data?.length) {
    adminCaseList.textContent = "目前尚無案例。";
    return;
  }

  adminCaseList.innerHTML = data
    .map(
      (item) => `
        <article class="admin-case-row">
          <img src="${publicImageUrl(item.before_image_path)}" alt="施工前縮圖" />
          <img src="${publicImageUrl(item.after_image_path)}" alt="完工後縮圖" />
          <div>
            <h3>${item.service_type || "未填服務類型"}</h3>
            <p>${item.area || "未填地區"}｜${item.crew_count || "未填人數"}｜${item.work_hours || "未填工時"}</p>
            <p>${item.description || ""}</p>
          </div>
        </article>
      `
    )
    .join("");
}

checkSession();
