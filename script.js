const CONTACTS_KEY = "wa_broadcast_contacts_v1";
const QUEUE_KEY = "wa_broadcast_queue_v1";

let contacts = JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]");
let queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function render() {
  $("totalContacts").textContent = contacts.length;
  $("optInContacts").textContent = contacts.filter(c => c.optIn).length;
  $("queuedMessages").textContent = queue.length;

  $("contactTable").innerHTML = contacts.length ? contacts.map((c, i) => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.phone)}</td>
      <td><span class="badge ${c.optIn ? "yes" : "no"}">${c.optIn ? "Ya" : "Tidak"}</span></td>
      <td><input type="checkbox" class="contact-check" data-index="${i}" ${c.optIn ? "" : "disabled"}></td>
    </tr>
  `).join("") : `<tr><td colspan="4" class="empty">Belum ada kontak.</td></tr>`;

  $("queueTable").innerHTML = queue.length ? queue.slice().reverse().map(q => `
    <tr>
      <td>${escapeHtml(q.time)}</td>
      <td>${escapeHtml(q.name)}<br><small>${escapeHtml(q.phone)}</small></td>
      <td>${escapeHtml(q.message)}</td>
      <td><span class="badge yes">${escapeHtml(q.status)}</span></td>
    </tr>
  `).join("") : `<tr><td colspan="4" class="empty">Antrean masih kosong.</td></tr>`;

  updateSelectedCount();
}

function updateSelectedCount() {
  const selected = document.querySelectorAll(".contact-check:checked").length;
  $("selectedCount").textContent = `${selected} kontak dipilih`;
}

$("contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("nameInput").value.trim();
  const phone = $("phoneInput").value.trim().replace(/\s+/g, "");
  const optIn = $("optInInput").checked;

  if (!/^62\d{8,15}$/.test(phone)) {
    alert("Nomor gunakan format internasional, contoh: 628123456789.");
    return;
  }

  contacts.push({ id: crypto.randomUUID(), name, phone, optIn });
  save();
  e.target.reset();
  render();
});

document.addEventListener("change", e => {
  if (e.target.classList.contains("contact-check")) updateSelectedCount();
});

$("queueBroadcast").addEventListener("click", () => {
  const message = $("messageInput").value.trim();
  const selected = [...document.querySelectorAll(".contact-check:checked")]
    .map(el => contacts[Number(el.dataset.index)]);

  if (!message) return alert("Tulis pesan terlebih dahulu.");
  if (!selected.length) return alert("Pilih minimal satu kontak opt-in.");

  const now = new Date().toLocaleString("id-ID");
  selected.forEach(c => {
    queue.push({
      time: now,
      name: c.name,
      phone: c.phone,
      message: message.replaceAll("{{nama}}", c.name),
      status: "Menunggu API"
    });
  });

  save();
  $("messageInput").value = "";
  document.querySelectorAll(".contact-check:checked").forEach(x => x.checked = false);
  $("notice").textContent = `${selected.length} pesan masuk antrean. Belum dikirim ke WhatsApp.`;
  $("notice").classList.remove("hidden");
  render();
});

$("clearContacts").addEventListener("click", () => {
  if (!contacts.length || confirm("Hapus semua kontak?")) {
    contacts = [];
    save();
    render();
  }
});

$("clearQueue").addEventListener("click", () => {
  if (!queue.length || confirm("Kosongkan antrean?")) {
    queue = [];
    save();
    render();
  }
});

render();
