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

  // التحقق من وجود جميع العناصر المطلوبة
  if (
    !contactPickerBtn ||
    !phoneInput ||
    !numbersDialog ||
    !contactNumbersList ||
    !dialogTitle ||
    !dialogCancelBtn
  ) {
    console.error(
      "⚠️ عناصر الإدخال أو الـ Dialog غير موجودة. تأكد من إضافتها في ملف HTML."
    );
    return;
  }

  // التحقق من دعم Contact Picker API
  const isContactSupported =
    "contacts" in navigator && typeof navigator.contacts.select === "function";

  // تعطيل الزر إذا لم يكن مدعوماً
  if (!isContactSupported) {
    contactPickerBtn.style.cursor = "not-allowed";
    contactPickerBtn.style.opacity = "0.5";
    contactPickerBtn.disabled = true;
    contactPickerBtn.title = "جهازك لا يدعم اختيار جهات الاتصال";
  }

  // =============================================
  // 2. دوال المساعدة
  // =============================================

  /**
   * تنظيف رقم الهاتف من المسافات والرموز والبادئات الدولية
   */
  function cleanPhoneNumber(num) {
    if (!num) return "";

    // إزالة المسافات والرموز الخاصة
    let cleaned = num.replace(/[\s\(\)\-+]/g, "");

    // إزالة البادئات الدولية الشائعة
    cleaned = cleaned.replace(
      /^(20|966|971|962|965|968|973|974|21|212|218|249|963|90|1|44|33|49|7|380|39|34|351|355|357|358|359|36|420|421|43|45|46|47|48|52|53|54|55|56|57|58|60|61|62|63|64|65|66|81|82|84|86|27|234|237|254|255|256|260|263|264|265|266|267|268)/,
      ""
    );

    return cleaned;
  }

  /**
   * اختيار رقم من الـ Dialog وتعيينه في حقل الإدخال
   */
  function selectNumberFromDialog(number) {
    phoneInput.value = cleanPhoneNumber(number);
    closeDialog();

    // مسح الـ QR إذا كانت الدالة موجودة
    if (typeof clearQR === "function") {
      clearQR();
    }
  }

  /**
   * إغلاق الـ Dialog
   */
  function closeDialog() {
    numbersDialog.classList.add("hidden");
  }

  /**
   * معالج النقر الموحد لعناصر القائمة
   */
  function handleNumberSelection(event) {
    const listItem = event.target.closest("li");

    // التأكد من أن النقر كان على عنصر قائمة يحتوي على رقم
    if (listItem && listItem.dataset.number) {
      selectNumberFromDialog(listItem.dataset.number);
    }
  }

  // =============================================
  // 3. منطق اختيار جهة الاتصال (Contact Picker)
  // =============================================

  /**
   * فتح منتقي جهات الاتصال واختيار جهة واحدة
   */
  async function pickContact() {
    if (!isContactSupported) {
      alert("⚠️ جهازك لا يدعم اختيار جهات الاتصال.\nيرجى إدخال الرقم يدوياً.");
      return;
    }

    try {
      const props = ["tel", "name"];
      const opts = { multiple: false }; // اختيار جهة اتصال واحدة فقط

      // 📱 فتح منتقي جهات الاتصال (يغلق تلقائياً بعد الاختيار)
      const contacts = await navigator.contacts.select(props, opts);

      // التحقق من وجود جهة اتصال وأرقام
      if (!contacts || contacts.length === 0) {
        console.log("ℹ️ لم يتم اختيار أي جهة اتصال");
        return;
      }

      const contact = contacts[0];

      // التحقق من وجود أرقام هاتف
      if (!contact.tel || contact.tel.length === 0) {
        alert("⚠️ جهة الاتصال المختارة لا تحتوي على أرقام هاتف.");
        return;
      }

      // تنظيف الأرقام
      const cleanTels = contact.tel
        .map(cleanPhoneNumber)
        .filter((num) => num.length > 0);

      if (cleanTels.length === 0) {
        alert("⚠️ لم يتم العثور على أرقام صالحة في جهة الاتصال.");
        return;
      }

      // الحصول على اسم جهة الاتصال
      const contactName =
        contact.name && contact.name.length > 0
          ? contact.name[0]
          : "جهة الاتصال";

      // 🎯 عرض الـ Dialog مع الأرقام (حتى لو كان رقم واحد)
      displayNumbersDialog(cleanTels, contactName);
    } catch (error) {
      // المستخدم ألغى الاختيار أو حدث خطأ
      if (error.name === "AbortError") {
        console.log("ℹ️ تم إلغاء اختيار جهة الاتصال");
      } else {
        console.error("❌ خطأ في اختيار جهة الاتصال:", error);
        alert("❌ حدث خطأ أثناء اختيار جهة الاتصال. يرجى المحاولة مرة أخرى.");
      }
    }
  }

  // =============================================
  // 4. منطق عرض الـ Dialog
  // =============================================

  /**
   * عرض الـ Dialog مع أرقام جهة الاتصال
   */
  function displayNumbersDialog(numbers, name) {
    // تحديث عنوان الـ Dialog مع اسم جهة الاتصال
    dialogTitle.textContent = name
      ? `اختر رقم الهاتف (${name})`
      : "اختر رقم الهاتف";

    // مسح القائمة القديمة
    contactNumbersList.innerHTML = "";

    // إزالة معالج الحدث السابق لتجنب التكرار
    contactNumbersList.removeEventListener("click", handleNumberSelection);

    // إضافة معالج النقر للقائمة
    contactNumbersList.addEventListener("click", handleNumberSelection);

    // ملء القائمة بالأرقام
    numbers.forEach((num, index) => {
      const listItem = document.createElement("li");
      listItem.textContent = num;
      listItem.dataset.number = num;
      listItem.style.cursor = "pointer";
      listItem.setAttribute("role", "button");
      listItem.setAttribute("tabindex", "0");

      // إضافة تسمية إذا كان هناك أكثر من رقم
      if (numbers.length > 1) {
        listItem.setAttribute("aria-label", `رقم ${index + 1}: ${num}`);
      }

      // دعم لوحة المفاتيح (Enter أو Space)
      listItem.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectNumberFromDialog(num);
        }
      });

      contactNumbersList.appendChild(listItem);
    });

    // 🎉 فتح الـ Dialog
    numbersDialog.classList.remove("hidden");

    // التركيز على أول رقم
    const firstItem = contactNumbersList.querySelector("li");
    if (firstItem) {
      firstItem.focus();
    }
  }

  // =============================================
  // 5. ربط الأحداث
  // =============================================

  // ربط زر اختيار جهة الاتصال
  contactPickerBtn.addEventListener("click", pickContact);

  // ربط زر إلغاء الـ Dialog
  dialogCancelBtn.addEventListener("click", closeDialog);

  // إغلاق الـ Dialog عند الضغط على خلفية الـ Dialog
  numbersDialog.addEventListener("click", (e) => {
    if (e.target === numbersDialog) {
      closeDialog();
    }
  });

  // إغلاق الـ Dialog عند الضغط على ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !numbersDialog.classList.contains("hidden")) {
      closeDialog();
    }
  });

  console.log("✅ Contact Picker تم تهيئته بنجاح");
});
