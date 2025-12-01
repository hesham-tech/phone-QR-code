document.addEventListener("DOMContentLoaded", () => {
  // =============================================
  // 1. تعريف العناصر
  // =============================================
  const contactPickerBtn = document.getElementById("contactPickerBtn");
  const phoneInput = document.getElementById("phone");
  const numbersDialog = document.getElementById("numbersDialog");
  const contactNumbersList = document.getElementById("contactNumbersList");
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogCancelBtn = document.getElementById("dialogCancelBtn");

  // التحقق من وجود العناصر
  if (
    !contactPickerBtn ||
    !phoneInput ||
    !numbersDialog ||
    !contactNumbersList ||
    !dialogTitle ||
    !dialogCancelBtn
  ) {
    console.error("❌ بعض عناصر Contact Picker غير موجودة في HTML");
    return;
  }

  // =============================================
  // 2. التحقق من دعم Contact Picker API
  // =============================================
  const isContactSupported =
    "contacts" in navigator && "select" in navigator.contacts;

  if (!isContactSupported) {
    contactPickerBtn.style.display = "none";
    console.warn("⚠️ جهازك لا يدعم Contact Picker API");
    return;
  }

  // =============================================
  // 3. دالة تنظيف رقم الهاتف (تنظيف وإصلاح التنسيق)
  // =============================================
  function cleanPhoneNumber(num) {
    if (!num) return "";

    // 1. إزالة أي شيء غير الأرقام
    let cleaned = num.replace(/\D/g, "");

    // 2. إزالة البادئات الدولية الشائعة إذا كان الرقم طويلاً جداً
    if (cleaned.length > 11) {
      cleaned = cleaned.replace(
        /^(20|966|971|962|965|968|973|974|212|218|249|963|90|1|44|33|49|380|39|34|351|355|357|358|359|36|420|421|43|45|46|47|48|52|53|54|55|56|57|58|60|61|62|63|64|65|66|67|68)/,
        ""
      );
    }

    // 3. المنطق الجديد للإصلاح: إذا كان الرقم 10 أرقام ويبدأ بـ '1' (مثل 1234567890)،
    // نفترض أنه ينقصه الصفر الافتتاحي (01...) ونضيفه.
    if (cleaned.length === 10 && cleaned.startsWith("1")) {
      cleaned = "0" + cleaned;
    }

    return cleaned;
  }

  // =============================================
  // 4. دالة تعيين الرقم + استدعاء دوال script.js
  // =============================================
  function setPhoneNumber(number) {
    // 1. تعيين الرقم في حقل الإدخال
    phoneInput.value = number;

    // 2. مسح QR (دالة من script.js)
    if (typeof clearQR === "function") {
      clearQR();
    }

    // 3. حفظ الرقم في savedNumbers (دالة من script.js)
    if (typeof saveNumber === "function") {
      saveNumber(number);
    }

    // 4. تحديث قائمة savedNumbers (دالة من script.js)
    if (typeof loadSavedNumbers === "function") {
      loadSavedNumbers();
    }
  }

  // =============================================
  // 5. دوال Dialog
  // =============================================
  function closeDialog() {
    numbersDialog.classList.add("hidden");
    numbersDialog.style.display = "none";
  }

  function showDialog(numbers, name) {
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
      li.setAttribute("dir", "ltr"); // إجبار اتجاه الأرقام

      li.addEventListener("click", () => {
        setPhoneNumber(num);
        closeDialog();
      });

      contactNumbersList.appendChild(li);
    });

    numbersDialog.classList.remove("hidden");
    numbersDialog.style.display = "flex";
  }

  // =============================================
  // 6. دالة اختيار جهة الاتصال
  // =============================================
  async function pickContact() {
    try {
      // التأكد من وجود دالة التحقق قبل المتابعة
      // هذه الدالة موجودة في script.js
      if (typeof getPhoneValidationErrors !== "function") {
        alert(
          "خطأ: دالة التحقق (getPhoneValidationErrors) غير متوفرة. تأكد من تحميل script.js أولاً."
        );
        return;
      }

      const properties = ["tel", "name"];
      const options = { multiple: false };

      const contacts = await navigator.contacts.select(properties, options);

      if (!contacts || contacts.length === 0) {
        return;
      }

      const contact = contacts[0];

      if (!contact.tel || contact.tel.length === 0) {
        alert("جهة الاتصال لا تحتوي على أرقام");
        return;
      }

      // 1. تنظيف الأرقام
      const cleanedNumbers = contact.tel
        .map(cleanPhoneNumber)
        .filter((n) => n.length > 0);

      // 2. تصفية الأرقام للتأكد من أنها تتبع قواعد التحقق الموحدة (11 رقمًا، تبدأ بـ 01)
      const validNumbers = cleanedNumbers.filter(
        (n) => getPhoneValidationErrors(n).length === 0
      );

      if (validNumbers.length === 0) {
        alert(
          "بعد التنظيف، لا توجد أرقام صالحة (11 رقم وتبدأ بـ 01) في جهة الاتصال."
        );
        return;
      }

      const name =
        contact.name && contact.name.length > 0 ? contact.name[0] : "";

      if (validNumbers.length === 1) {
        setPhoneNumber(validNumbers[0]);
      } else {
        showDialog(validNumbers, name);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("خطأ في Contact Picker:", error);
      }
    }
  }

  // =============================================
  // 7. ربط الأحداث
  // =============================================
  contactPickerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    pickContact();
  });

  dialogCancelBtn.addEventListener("click", () => {
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
});
