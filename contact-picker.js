document.addEventListener("DOMContentLoaded", () => {
  // =============================================
  // 1. تعريف العناصر والتحقق من الدعم
  // =============================================
  const contactPickerBtn = document.getElementById("contactPickerBtn");
  const phoneInput = document.getElementById("phone");
  const numbersDialog = document.getElementById("numbersDialog");
  const contactNumbersList = document.getElementById("contactNumbersList");
  const dialogTitle = document.getElementById("dialogTitle");
  const dialogCancelBtn = document.getElementById("dialogCancelBtn");

  // يجب التحقق من وجود جميع عناصر الـ Dialog قبل البدء
  if (
    !contactPickerBtn ||
    !phoneInput ||
    !numbersDialog ||
    !contactNumbersList ||
    !dialogTitle ||
    !dialogCancelBtn
  ) {
    console.error(
      "عناصر الإدخال أو الزر (phoneInput/contactPickerBtn/Dialog components) غير موجودة. تأكد من إضافتها لملف index.html."
    );
    return;
  }

  // التحقق من دعم Contact Picker API
  const isContactSupported =
    "contacts" in navigator && typeof navigator.contacts.select === "function";

  // تهيئة الزر بناءً على الدعم
  if (!isContactSupported) {
    contactPickerBtn.style.cursor = "not-allowed";
    contactPickerBtn.style.opacity = "0.5";
  }

  // =============================================
  // 2. دوال المساعدة
  // =============================================

  function cleanPhoneNumber(num) {
    if (!num) return "";
    // حذف المسافات وعلامة + وأي رموز أخرى
    let cleaned = num.replace(/[\s\(\)\-+]/g, "");

    // إزالة بادئات دولية (تم تبسيط regex قليلاً للحفاظ على المنطق)
    cleaned = cleaned.replace(
      /^(20|966|971|962|965|968|973|974|21|212|218|249|963|90|1|44|33|49|7|380|39|34|351|355|357|358|359|36|420|421|43|45|46|47|48|52|53|54|55|56|57|58|60|61|62|63|64|65|66|81|82|84|86|7|27|234|237|254|255|256|260|263|264|265|266|267|268)/,
      ""
    );
    return cleaned;
  }

  // ✅ دالة اختيار الرقم وتحديث الحقل وإغلاق الدايلوج
  function selectNumberFromDialog(number) {
    phoneInput.value = cleanPhoneNumber(number);
    numbersDialog.classList.add("hidden");
    // مسح الـ QR (إذا كانت الدالة معرفة)
    if (typeof clearQR === "function") clearQR();
  }

  // ✅ معالج النقر الموحد لعناصر القائمة
  function handleNumberSelection(event) {
    const listItem = event.target.closest("li");
    // التأكد من أن النقر كان على عنصر قائمة (li) يحتوي على رقم
    if (listItem && listItem.dataset.number) {
      selectNumberFromDialog(listItem.dataset.number);
    }
  }

  // =============================================
  // 3. منطق اختيار جهة الاتصال (Pick Contact)
  // =============================================
  async function pickContact() {
    if (!isContactSupported) {
      alert("خطأ: جهازك لا يدعم اختيار جهات الاتصال.");
      return;
    }

    try {
      const props = ["tel", "name"];
      const opts = { multiple: false };
      const contacts = await navigator.contacts.select(props, opts);

      if (
        contacts &&
        contacts.length &&
        contacts[0].tel &&
        contacts[0].tel.length
      ) {
        const contact = contacts[0];
        const cleanTels = contact.tel.map(cleanPhoneNumber);
        const contactName =
          contact.name && contact.name.length ? contact.name[0] : "";

        // حالة رقم واحد فقط
        if (contact.tel.length === 1) {
          phoneInput.value = cleanTels[0];
          if (typeof clearQR === "function") clearQR();
        }
        // حالة أرقام متعددة (عرض الـ Dialog)
        else {
          displayNumbersDialog(cleanTels, contactName);
        }
      } else {
        alert("خطأ: لم يتم العثور على رقم هاتف في جهة الاتصال.");
      }
    } catch (e) {
      alert("خطأ: تم إلغاء اختيار جهة الاتصال أو حدث خطأ.");
    }
  }

  // =============================================
  // 4. منطق عرض الـ Dialog
  // =============================================
  function displayNumbersDialog(numbers, name) {
    dialogTitle.textContent = `اختر رقم الهاتف ${name ? "(" + name + ")" : ""}`;

    // مسح القائمة القديمة
    contactNumbersList.innerHTML = "";

    // ✅ إضافة معالج النقر مرة واحدة للقائمة بالكامل
    // (للتأكد من عدم تكرار ربط الأحداث)
    contactNumbersList.removeEventListener("click", handleNumberSelection);
    contactNumbersList.addEventListener("click", handleNumberSelection);

    // ملء القائمة بالأرقام الجديدة
    numbers.forEach((num) => {
      const listItem = document.createElement("li");
      listItem.textContent = num;
      // ✅ إضافة الرقم كخاصية بيانات (Data Attribute) للعنصر
      listItem.dataset.number = num;

      // التنسيق (لضمان ظهور مؤشر النقر)
      listItem.style.cursor = "pointer";

      // لا نحتاج لربط حدث النقر هنا، سيتم معالجته بواسطة handleNumberSelection

      contactNumbersList.appendChild(listItem);
    });

    numbersDialog.classList.remove("hidden");
  }

  // =============================================
  // 5. ربط الأحداث
  // =============================================
  contactPickerBtn.addEventListener("click", pickContact);

  // ربط زر إلغاء الـ Dialog
  dialogCancelBtn.addEventListener("click", () => {
    numbersDialog.classList.add("hidden");
  });
});
