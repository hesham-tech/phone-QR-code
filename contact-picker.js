document.addEventListener("DOMContentLoaded", () => {
  // =============================================
  // نظام التنبيهات المرئية للتتبع
  // =============================================
  let debugDiv = document.getElementById("debugLog");

  // إنشاء div للتتبع إذا لم يكن موجوداً
  if (!debugDiv) {
    debugDiv = document.createElement("div");
    debugDiv.id = "debugLog";
    debugDiv.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0,0,0,0.9);
      color: #0f0;
      padding: 10px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 11px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 99999;
      direction: ltr;
      text-align: left;
    `;
    document.body.appendChild(debugDiv);
  }

  function log(message, type = "info") {
    const now = new Date().toLocaleTimeString();
    const colors = {
      info: "#0ff",
      success: "#0f0",
      error: "#f00",
      warning: "#ff0",
    };

    const entry = document.createElement("div");
    entry.style.color = colors[type] || "#0ff";
    entry.textContent = `[${now}] ${message}`;
    debugDiv.appendChild(entry);
    debugDiv.scrollTop = debugDiv.scrollHeight;

    console.log(message);
  }

  // =============================================
  // 1. تعريف العناصر
  // =============================================
  const contactPickerBtn = document.getElementById("contactPickerBtn");
  const phoneInput = document.getElementById("phone");
  const numbersDialog = document.getElementById("numbersDialog");
  const contactNumbersList = document.getElementById("contactNumbersList");
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogCancelBtn = document.getElementById("dialogCancelBtn");

  if (
    !contactPickerBtn ||
    !phoneInput ||
    !numbersDialog ||
    !contactNumbersList ||
    !dialogTitle ||
    !dialogCancelBtn
  ) {
    log("❌ بعض العناصر غير موجودة", "error");
    alert("خطأ: بعض عناصر HTML غير موجودة");
    return;
  }

  log("✅ جميع العناصر موجودة", "success");

  // =============================================
  // 2. التحقق من دعم Contact Picker
  // =============================================
  const isContactSupported =
    "contacts" in navigator && "select" in navigator.contacts;

  log(
    "📱 Contact Picker: " + (isContactSupported ? "مدعوم" : "غير مدعوم"),
    isContactSupported ? "success" : "error"
  );

  if (!isContactSupported) {
    contactPickerBtn.disabled = true;
    contactPickerBtn.style.opacity = "0.5";
    alert("جهازك لا يدعم اختيار جهات الاتصال");
    return;
  }

  // =============================================
  // 3. دالة تنظيف رقم الهاتف
  // =============================================
  function cleanPhoneNumber(num) {
    if (!num) return "";

    let cleaned = num.replace(/\s+/g, "").replace(/^\+/, "");
    cleaned = cleaned.replace(
      /^(20|966|971|962|965|968|973|974|212|218|249|963|90|1|44|33|49|380|39|34|351|355|357|358|359|36|420|421|43|45|46|47|48|52|53|54|55|56|57|58|60|61|62|63|64|65|66|81|82|84|86|27|234|237|254|255|256|260|263|264|265|266|267|268)/,
      ""
    );

    return cleaned;
  }

  // =============================================
  // 4. دوال Dialog
  // =============================================
  function closeDialog() {
    numbersDialog.classList.add("hidden");
    log("🚪 Dialog مغلق", "info");
  }

  function showDialog(numbers, name) {
    log(`📋 فتح Dialog مع ${numbers.length} رقم`, "info");

    dialogTitle.textContent = name
      ? `اختر رقم الهاتف (${name})`
      : "اختر رقم الهاتف";

    contactNumbersList.innerHTML = "";

    numbers.forEach((num, idx) => {
      const li = document.createElement("li");
      li.textContent = num;
      li.style.cursor = "pointer";
      li.style.padding = "12px";
      li.style.borderBottom = "1px solid #eee";

      li.addEventListener("click", () => {
        log(`✅ رقم مختار: ${num}`, "success");
        phoneInput.value = num;
        closeDialog();

        if (typeof clearQR === "function") {
          clearQR();
        }
      });

      contactNumbersList.appendChild(li);
    });

    numbersDialog.classList.remove("hidden");
    log("🎉 Dialog مفتوح", "success");
  }

  // =============================================
  // 5. دالة اختيار جهة الاتصال
  // =============================================
  async function pickContact() {
    log("🚀 بدء pickContact", "info");

    try {
      const properties = ["tel", "name"];
      const options = { multiple: false };

      log("📞 فتح منتقي الجهات...", "info");

      const contacts = await navigator.contacts.select(properties, options);

      log(`📊 عدد النتائج: ${contacts ? contacts.length : 0}`, "info");

      if (!contacts || contacts.length === 0) {
        log("⚠️ لا توجد نتائج", "warning");
        alert("لم يتم اختيار جهة اتصال");
        return;
      }

      const contact = contacts[0];
      log(`📇 جهة الاتصال: ${JSON.stringify(contact.name)}`, "info");
      log(`📱 عدد الأرقام: ${contact.tel ? contact.tel.length : 0}`, "info");

      if (!contact.tel || contact.tel.length === 0) {
        log("❌ لا توجد أرقام", "error");
        alert("جهة الاتصال لا تحتوي على أرقام");
        return;
      }

      const cleanedNumbers = contact.tel.map(cleanPhoneNumber);
      const name =
        contact.name && contact.name.length > 0 ? contact.name[0] : "";

      log(`🧹 أرقام نظيفة: ${cleanedNumbers.join(", ")}`, "success");

      if (cleanedNumbers.length === 1) {
        log(`✅ رقم واحد - تعيين مباشر: ${cleanedNumbers[0]}`, "success");
        phoneInput.value = cleanedNumbers[0];

        if (typeof clearQR === "function") {
          clearQR();
        }

        // تنبيه مرئي
        alert("✅ تم تعيين الرقم: " + cleanedNumbers[0]);
      } else {
        log(`📋 ${cleanedNumbers.length} رقم - فتح Dialog`, "info");
        showDialog(cleanedNumbers, name);
      }
    } catch (error) {
      log(`❌ خطأ: ${error.name} - ${error.message}`, "error");

      if (error.name === "AbortError") {
        log("ℹ️ تم الإلغاء", "warning");
      } else {
        alert("خطأ: " + error.message);
      }
    }
  }

  // =============================================
  // 6. ربط الأحداث
  // =============================================
  contactPickerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    log("🖱️ نقرة على الزر", "info");
    pickContact();
  });

  dialogCancelBtn.addEventListener("click", () => {
    log("🚫 نقرة إلغاء", "info");
    closeDialog();
  });

  numbersDialog.addEventListener("click", (e) => {
    if (e.target === numbersDialog) {
      closeDialog();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !numbersDialog.classList.contains("hidden")) {
      closeDialog();
    }
  });

  log("✅✅✅ النظام جاهز!", "success");

  // رسالة ترحيبية
  setTimeout(() => {
    log("💡 انقر على زر جهات الاتصال للبدء", "info");
  }, 1000);
});
