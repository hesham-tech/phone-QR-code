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
  // 3. دالة تنظيف رقم الهاتف
  // =============================================
  function cleanPhoneNumber(num) {
    if (!num) return "";

    // إزالة المسافات وعلامة +
    let cleaned = num.replace(/\s+/g, "").replace(/^\+/, "");

    // إزالة البادئات الدولية
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
    // هذا الاستدعاء مهم ليقوم بتحديث القائمة المخصصة الجديدة
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

      const cleanedNumbers = contact.tel
        .map(cleanPhoneNumber)
        .filter((n) => n.length > 0);

      if (cleanedNumbers.length === 0) {
        alert("لا توجد أرقام صالحة في جهة الاتصال");
        return;
      }

      const name =
        contact.name && contact.name.length > 0 ? contact.name[0] : "";

      if (cleanedNumbers.length === 1) {
        setPhoneNumber(cleanedNumbers[0]);
      } else {
        showDialog(cleanedNumbers, name);
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
