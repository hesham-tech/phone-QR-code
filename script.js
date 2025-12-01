// العناصر الرئيسية
const phoneInput = document.getElementById("phone");
const amountInput = document.getElementById("amount");
const displayPrefixInput = document.getElementById("displayPrefix"); // الحقل الجديد لعرض الـ Prefix
// تم استبدال savedNumbersDatalist بالقوائم المخصصة
const savedNumbersDropdown = document.getElementById("savedNumbersDropdown");
const savedNumbersList = document.getElementById("savedNumbersList");

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
const SAVED_NUMBERS_KEY = "saved_numbers";

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
3. وظائف LocalStorage للأرقام + القائمة المخصصة
========================== */

let allSavedNumbers = []; // مصفوفة لتخزين كل الأرقام المحفوظة

function hideSavedNumbersDropdown() {
  savedNumbersDropdown.classList.add("hidden");
}

function showSavedNumbersDropdown() {
  // إظهار فقط إذا كانت هناك عناصر مرئية في القائمة
  const visibleItems = Array.from(savedNumbersList.children).some(
    (li) => li.style.display !== "none"
  );
  if (visibleItems) {
    savedNumbersDropdown.classList.remove("hidden");
  } else {
    hideSavedNumbersDropdown();
  }
}

function loadSavedNumbers(initialLoad = false) {
  // يتم تحميل كل الأرقام إلى allSavedNumbers
  allSavedNumbers = JSON.parse(localStorage.getItem(SAVED_NUMBERS_KEY) || "[]");

  if (initialLoad && allSavedNumbers.length > 0 && phoneInput.value === "") {
    // تعيين آخر رقم محفوظ في حقل الإدخال عند التحميل الأولي
    phoneInput.value = allSavedNumbers[allSavedNumbers.length - 1];
  }

  // إعادة بناء عناصر الـ HTML للقائمة
  savedNumbersList.innerHTML = "";
  if (allSavedNumbers.length === 0) {
    hideSavedNumbersDropdown();
    return;
  }

  allSavedNumbers.forEach((num) => {
    let li = document.createElement("li");
    li.textContent = num;
    li.setAttribute("dir", "ltr"); // لإجبار اتجاه النص لليسار لليمين للأرقام
    li.onclick = () => {
      phoneInput.value = num;
      clearQR();
      hideSavedNumbersDropdown();
    };
    savedNumbersList.appendChild(li);
  });

  // بعد إعادة البناء، نقوم بتصفية القائمة بناءً على النص الحالي
  filterSavedNumbers();
}

function saveNumber(num) {
  let list = JSON.parse(localStorage.getItem(SAVED_NUMBERS_KEY) || "[]");
  // إزالة الرقم إذا كان موجودًا وإضافته كآخر عنصر (لجعل الأحدث يظهر في القائمة)
  list = list.filter((n) => n !== num);

  if (list.length >= 10) {
    // حد أقصى لحفظ الأرقام (مثلاً 10)
    list.shift(); // حذف أقدم رقم
  }

  list.push(num);
  localStorage.setItem(SAVED_NUMBERS_KEY, JSON.stringify(list));
}

/**
 * دالة البحث والتصفية الأساسية
 */
function filterSavedNumbers() {
  const searchTerm = phoneInput.value.trim();
  const listItems = savedNumbersList.children;
  let matchesFound = false;

  for (let i = 0; i < listItems.length; i++) {
    const listItem = listItems[i];
    const numberText = listItem.textContent;

    // البحث عن تطابق الرقم المُدخل مع بداية أي رقم محفوظ
    if (searchTerm === "" || numberText.startsWith(searchTerm)) {
      listItem.style.display = ""; // إظهار
      matchesFound = true;
    } else {
      listItem.style.display = "none"; // إخفاء
    }
  }

  // التحكم في إظهار وإخفاء القائمة المنسدلة بناءً على نتائج البحث
  if (searchTerm.length > 0 && matchesFound) {
    showSavedNumbersDropdown();
  } else {
    hideSavedNumbersDropdown();
  }
}

// إضافة منطق إظهار وتصفية القائمة عند التركيز أو الكتابة
phoneInput.addEventListener("focus", () => {
  loadSavedNumbers(); // تأكد من تحميل الأرقام قبل التركيز
  filterSavedNumbers();
});

// الحدث الجديد لتصفية القائمة أثناء الكتابة
phoneInput.addEventListener("input", filterSavedNumbers);

// إخفاء القائمة عند النقر خارجها
document.addEventListener("click", (e) => {
  const isClickInside =
    savedNumbersDropdown.contains(e.target) || phoneInput.contains(e.target);
  if (!isClickInside) {
    hideSavedNumbersDropdown();
  }
});

/* ==========================
4. وظائف التوليد الأساسية + التحقق الموحد
========================== */

/**
 * دالة التحقق الصامتة: تفحص الرقم وتُرجع مصفوفة بالأخطاء.
 * هذه الدالة موحدة ويتم استخدامها من contact-picker.js
 * @param {string} num - الرقم المراد التحقق منه.
 * @returns {string[]} - مصفوفة رسائل الأخطاء (فارغة إذا كان صالحاً).
 */
function getPhoneValidationErrors(num) {
  let errors = [];

  // 1. التحقق من الطول: يجب أن يكون 11 رقمًا
  if (num.length !== 11) {
    errors.push(
      `- يجب أن يحتوي علي 11 رقمًا. (الرقم الحالي: ${num.length} ارقام)`
    );
  }

  // 2. التحقق من البداية: يجب أن يبدأ بـ "01"
  if (!num.startsWith("01")) {
    errors.push(
      `- يجب أن يبدأ ب '01'. (الرقم الحالي يبدأ بـ '${num.substring(0, 2)}')`
    );
  }

  // 3. التحقق من الأرقام فقط
  if (!/^\d+$/.test(num)) {
    errors.push("- يجب أن يحتوي الرقم على أرقام فقط.");
  }

  return errors;
}

/**
 * دالة التحقق العامة: تعرض التنبيهات وتُرجع boolean
 * يتم استدعاؤها قبل توليد QR
 * @param {string} num - الرقم المراد التحقق منه.
 * @returns {boolean} - true إذا كان الرقم صحيحًا، false وإلا.
 */
function validatePhone(num) {
  const errors = getPhoneValidationErrors(num);

  if (errors.length > 0) {
    // عرض رسالة خطأ مفصلة إذا وُجدت أخطاء
    alert("❌ فشل التحقق من الرقم المدخل:\n" + errors.join("\n"));
    return false;
  }

  return true;
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

  // إخفاء القائمة المخصصة عند بدء التوليد
  hideSavedNumbersDropdown();

  // 1. التحقق من صحة الإدخال
  if (!validatePhone(phone)) {
    // استخدام الدالة التي تعرض التنبيه
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
  loadSavedNumbers(); // تحديث القائمة بعد الحفظ
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
  loadSavedNumbers(true); // تمرير true للإشارة إلى التحميل الأولي
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
