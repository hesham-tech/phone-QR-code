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
      padding: 35px 10px 10px 10px;
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

    // إنشاء زر النسخ
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋 نسخ";
    copyBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: #0f0;
      color: #000;
      border: none;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      z-index: 100000;
    `;

    // وظيفة نسخ محتوى الـ Log
    copyBtn.addEventListener("click", () => {
      const logText = Array.from(debugDiv.querySelectorAll("div"))
        .map((entry) => entry.textContent)
        .join("\n");

      navigator.clipboard
        .writeText(logText)
        .then(() => {
          copyBtn.textContent = "✅ تم النسخ!";
          copyBtn.style.background = "#0ff";
          setTimeout(() => {
            copyBtn.textContent = "📋 نسخ";
            copyBtn.style.background = "#0f0";
          }, 2000);
        })
        .catch((err) => {
          console.error("فشل النسخ:", err);
          copyBtn.textContent = "❌ فشل";
          setTimeout(() => {
            copyBtn.textContent = "📋 نسخ";
          }, 2000);
        });
    });

    debugDiv.appendChild(copyBtn);
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
    contactPickerBtn.style.display = "none";
    return;
  }

  // =============================================
  // 3. دالة تنظيف رقم الهاتف
  // =============================================
  function cleanPhoneNumber(num) {
    if (!num) return "";

    let cleaned = num.replace(/\s+/g, "").replace(/^\+/, "");
    cleaned = cleaned.replace(
      /^(20|966|971|962|965|968|973|974|212|218|249|963|90|1|44|33|49|380|39|34|351|355|357|358|359|36|420|421|43|45|46|47|48|52|53|54|55|56|57|58|60|61|62|63|64|65|66|67|68)/,
      ""
    );

    return cleaned;
  }

  // =============================================
  // 4. دالة تعيين الرقم + استدعاء دوال script.js
  // =============================================
  function setPhoneNumber(number) {
    log(`📞 تعيين الرقم: ${number}`, "info");

    // 1. تعيين الرقم في حقل الإدخال
    phoneInput.value = number;

    // 2. مسح QR (دالة من script.js)
    if (typeof clearQR === "function") {
      clearQR();
      log("🧹 تم استدعاء clearQR", "success");
    } else {
      log("⚠️ دالة clearQR غير موجودة", "warning");
    }

    // 3. حفظ الرقم في savedNumbers (دالة من script.js)
    if (typeof saveNumber === "function") {
      saveNumber(number);
      log("💾 تم استدعاء saveNumber", "success");
    } else {
      log("⚠️ دالة saveNumber غير موجودة", "warning");
    }

    // 4. تحديث قائمة savedNumbers (دالة من script.js)
    if (typeof loadSavedNumbers === "function") {
      loadSavedNumbers();
      log("🔄 تم استدعاء loadSavedNumbers", "success");
    } else {
      log("⚠️ دالة loadSavedNumbers غير موجودة", "warning");
    }
  }

  // =============================================
  // 5. دوال Dialog
  // =============================================
  function closeDialog() {
    numbersDialog.classList.add("hidden");
    numbersDialog.style.display = "none";
    log("🚪 Dialog مغلق", "info");
  }

  function showDialog(numbers, name) {
    log(`📋 فتح Dialog مع ${numbers.length} رقم`, "info");

    dialogTitle.textContent = name
      ? `اختر رقم الهاتف (${name})`
      : "اختر رقم الهاتف";

    contactNumbersList.innerHTML = "";

    numbers.forEach((num) => {
      const li = document.createElement("li");
      li.textContent = num;
      li.style.cursor = "pointer";
      li.style.padding = "12px";
      li.style.borderBottom = "1px solid #eee";

      li.addEventListener("click", () => {
        log(`✅ رقم مختار من Dialog: ${num}`, "success");
        setPhoneNumber(num); // استخدام الدالة الموحدة
        closeDialog();
      });

      contactNumbersList.appendChild(li);
    });

    numbersDialog.classList.remove("hidden");
    numbersDialog.style.display = "flex";
    log("🎉 Dialog مفتوح", "success");
  }

  // =============================================
  // 6. دالة اختيار جهة الاتصال
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
        return;
      }

      const contact = contacts[0];
      log(`📇 جهة الاتصال: ${JSON.stringify(contact.name)}`, "info");
      log(
        `📱 عدد الأرقام الخام: ${contact.tel ? contact.tel.length : 0}`,
        "info"
      );

      if (!contact.tel || contact.tel.length === 0) {
        log("❌ لا توجد أرقام", "error");
        alert("جهة الاتصال لا تحتوي على أرقام");
        return;
      }

      const cleanedNumbers = contact.tel
        .map(cleanPhoneNumber)
        .filter((n) => n.length > 0);

      if (cleanedNumbers.length === 0) {
        log("❌ لا توجد أرقام صالحة بعد التنظيف", "error");
        alert("لا توجد أرقام صالحة في جهة الاتصال");
        return;
      }

      const name =
        contact.name && contact.name.length > 0 ? contact.name[0] : "";

      log(
        `🧹 أرقام نظيفة (${cleanedNumbers.length}): ${cleanedNumbers.join(
          ", "
        )}`,
        "success"
      );

      if (cleanedNumbers.length === 1) {
        log(`✅ رقم واحد - تعيين مباشر: ${cleanedNumbers[0]}`, "success");
        setPhoneNumber(cleanedNumbers[0]); // استخدام الدالة الموحدة
        alert("✅ تم تعيين الرقم: " + cleanedNumbers[0]);
      } else {
        log(`📋 ${cleanedNumbers.length} رقم - فتح Dialog`, "info");
        showDialog(cleanedNumbers, name);
      }
    } catch (error) {
      log(`❌ خطأ: ${error.name} - ${error.message}`, "error");

      if (error.name === "AbortError") {
        log("ℹ️ المستخدم ألغى الاختيار", "warning");
      } else {
        alert("خطأ: " + error.message);
      }
    }
  }

  // =============================================
  // 7. ربط الأحداث
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

  log("✅✅✅ Contact Picker جاهز!", "success");

  setTimeout(() => {
    log("💡 انقر على زر جهات الاتصال للبدء", "info");
  }, 1000);
});
