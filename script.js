// العناصر الرئيسية
const phoneInput = document.getElementById("phone");
const amountInput = document.getElementById("amount");
const displayPrefixInput = document.getElementById("displayPrefix"); // الحقل الجديد لعرض الـ Prefix
const savedNumbersDatalist = document.getElementById("savedNumbers");
const qrBox = document.getElementById("qrBox");
const codeInfo = document.getElementById("codeInfo");
const ussdCodeSpan = document.getElementById("ussdCode");
const copyButton = document.getElementById("copyBtn");
const genButton = document.getElementById("gen");
const genFixedButton = document.getElementById("genFixed");

// عناصر الإعدادات (الـ Dialog)
const settingsDialog = document.getElementById("settingsDialog");
const settingsBtn = document.getElementById("settingsBtn");
const prefixInput = document.getElementById("prefixInput"); // حقل الإدخال داخل الـ Dialog
const savePrefixBtn = document.getElementById("savePrefixBtn");

const DEFAULT_PREFIX = "*9*7*";
const PREFIX_STORAGE_KEY = "ussd_prefix";

/* ==========================
1. وظائف الـ QR والتنظيف
========================== */

function clearQR() {
  // حذف محتوى الـ QR وإعادة العرض الافتراضي
  qrBox.innerHTML =
    '<span class="qr-placeholder">سيظهر الـ QR هنا بعد الإدخال</span>';
  codeInfo.style.display = "none";
  ussdCodeSpan.innerText = "";
}

function addChangeListener(element) {
  // مسح الـ QR عند أي تغيير في حقول الإدخال
  element.addEventListener("input", clearQR);
}

addChangeListener(phoneInput);
addChangeListener(amountInput);

/* ==========================
2. وظائف الإعدادات
========================== */

function loadPrefix() {
  // تحميل رمز الكود من LocalStorage، أو استخدام القيمة الافتراضية
  const prefix = localStorage.getItem(PREFIX_STORAGE_KEY) || DEFAULT_PREFIX;
  displayPrefixInput.value = prefix; // تحديث حقل العرض (المخفي)
  return prefix;
}

function savePrefix() {
  const newPrefix = prefixInput.value.trim();
  if (newPrefix === "") {
    alert("الرجاء إدخال رمز كود USSD صالح.");
    return;
  }

  localStorage.setItem(PREFIX_STORAGE_KEY, newPrefix);
  loadPrefix(); // تحديث القيمة المعروضة
  clearQR(); // مسح الـ QR عند تغيير الرمز
  settingsDialog.style.display = "none"; // إغلاق الدايلوج
  alert("تم حفظ رمز الكود بنجاح!");
}

// فتح الـ Dialog
settingsBtn.onclick = () => {
  // تحميل القيمة الحالية في حقل الإدخال داخل الـ Dialog قبل الفتح
  prefixInput.value = loadPrefix();
  settingsDialog.style.display = "flex";
};

// إغلاق الـ Dialog عند الضغط على زر الحفظ
savePrefixBtn.onclick = savePrefix;

// إغلاق الـ Dialog عند الضغط خارج النافذة
settingsDialog.onclick = (e) => {
  if (e.target === settingsDialog) {
    settingsDialog.style.display = "none";
  }
};

/* ==========================
3. وظائف LocalStorage للأرقام
========================== */

function loadSavedNumbers() {
  let list = JSON.parse(localStorage.getItem("saved_numbers") || "[]");
  savedNumbersDatalist.innerHTML = "";

  list.forEach((num) => {
    let option = document.createElement("option");
    option.value = num;
    savedNumbersDatalist.appendChild(option);
  });

  if (list.length > 0) {
    phoneInput.value = list[list.length - 1];
  }
}

function saveNumber(num) {
  let list = JSON.parse(localStorage.getItem("saved_numbers") || "[]");
  if (!list.includes(num)) {
    list.push(num);
    localStorage.setItem("saved_numbers", JSON.stringify(list));
  }
}

/* ==========================
4. وظائف التوليد الأساسية
========================== */

function validatePhone(num) {
  return /^[0-9]{8,15}$/.test(num);
}

function generateQR(text) {
  qrBox.innerHTML = "";
  qrBox.classList.add("fade-in");

  new QRCode(qrBox, {
    text: text,
    width: 320,
    height: 320,
    colorDark: "#0d47a1",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });

  setTimeout(() => qrBox.classList.remove("fade-in"), 500);
}

function buildCode(includeAmount = true) {
  const phone = phoneInput.value.trim();
  const prefix = loadPrefix(); // استخدام القيمة المحفوظة/الافتراضية
  const amount = amountInput.value.trim();

  // 1. التحقق من صحة الإدخال
  if (!validatePhone(phone)) {
    alert("❌ الرجاء إدخال رقم مستفيد صحيح (8-15 رقم).");
    return;
  }

  if (includeAmount && (!amount || Number(amount) <= 0)) {
    alert("❌ لإنشاء كود كامل، يجب إدخال مبلغ صحيح أكبر من صفر.");
    return;
  }

  // 2. بناء كود USSD
  const ussd = includeAmount
    ? `${prefix}${phone}*${amount}#`
    : `${prefix}${phone}*`;

  const telUri = "tel:" + encodeURIComponent(ussd);

  // 3. توليد الـ QR وعرض المعلومات
  generateQR(telUri);
  ussdCodeSpan.innerText = ussd;
  codeInfo.style.display = "block";

  // 4. حفظ الرقم
  saveNumber(phone);
  loadSavedNumbers();
}

/* ==========================
5. معالجة الأحداث والتحميل
========================== */

genButton.onclick = () => buildCode(true);
genFixedButton.onclick = () => buildCode(false);

copyButton.onclick = () => {
  const txt = ussdCodeSpan.innerText;
  navigator.clipboard
    .writeText(txt)
    .then(() => {
      copyButton.innerText = "✅ تم النسخ!";
      setTimeout(() => {
        copyButton.innerText = "📋 نسخ الكود";
      }, 1500);
    })
    .catch((err) => {
      console.error("فشل في نسخ النص:", err);
      alert("فشل في نسخ الكود، حاول يدويًا.");
    });
};

// وظيفة التحميل عند بدء التشغيل
window.onload = () => {
  loadSavedNumbers();
  loadPrefix(); // تحميل وعرض رمز الكود عند بدء التشغيل
};

// دالة بسيطة بديلة لـ toast
function showToast(message, type = "error") {
  // يمكنك هنا استخدام مكتبة تنبيهات أو alert بسيط
  if (type === "error") {
    console.error(message);
    alert("خطأ: " + message);
  } else {
    console.log(message);
  }
}
