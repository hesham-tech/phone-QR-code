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
    typeof window !== "undefined" &&
    "contacts" in navigator &&
    typeof navigator.contacts.select === "function";

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
   * نفس المنطق الموجود في Vue.js
   */
  function cleanPhoneNumber(num) {
    if (!num) return "";

    // حذف جميع المسافات وعلامة +
    let cleaned = num.replace(/\s+/g, "").replace(/^\+/, "");

    // إزالة البادئات الدولية المعروفة (نفس regex الموجود في Vue)
    cleaned = cleaned.replace(
      /^(2|966|971|962|965|968|973|974|21|212|218|249|963|90|1|44|33|49|7|380|39|34|351|355|357|358|359|36|420|421|43|45|46|47|48|52|53|54|55|56|57|58|60|61|62|63|64|65|66|81|82|84|86|7|27|234|237|254|255|256|260|263|264|265|266|267|268|20)/,
      ""
    );

    return cleaned;
  }

  /**
   * اختيار رقم من الـ Dialog وتعيينه في حقل الإدخال
   */
  function selectNumberFromDialog(number) {
    phoneNumber = cleanPhoneNumber(number);
    phoneInput.value = phoneNumber;
    closeDialog();

    // مسح الـ QR إذا كانت الدالة موجودة
    if (typeof clearQR === "function") {
      clearQR();
    }

    console.log("✅ تم اختيار الرقم:", phoneNumber);
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
  // 3. منطق اختيار جهة الاتصال (نفس منطق Vue.js)
  // =============================================

  let phoneNumber = ""; // متغير لحفظ رقم الهاتف
  let contactNumbers = []; // قائمة أرقام جهة الاتصال
  let contactName = ""; // اسم جهة الاتصال

  /**
   * فتح منتقي جهات الاتصال واختيار جهة واحدة
   * نفس المنطق الموجود في Vue.js بالضبط
   */
  async function pickContact() {
    if (!isContactSupported) {
      alert("❌ جهازك لا يدعم اختيار جهات الاتصال");
      return;
    }

    try {
      const props = ["tel", "name"];
      const opts = { multiple: false }; // اختيار جهة اتصال واحدة فقط

      console.log("📱 فتح منتقي جهات الاتصال...");

      // فتح منتقي جهات الاتصال
      const contacts = await navigator.contacts.select(props, opts);

      console.log("✅ تم اختيار جهة الاتصال:", contacts);

      // التحقق من وجود جهة اتصال وأرقام (نفس شروط Vue)
      if (
        contacts &&
        contacts.length &&
        contacts[0].tel &&
        contacts[0].tel.length
      ) {
        const contact = contacts[0];

        // 🎯 المنطق الأساسي من Vue.js:
        // إذا كان هناك رقم واحد فقط → تعيينه مباشرة
        if (contact.tel.length === 1) {
          phoneNumber = cleanPhoneNumber(contact.tel[0]);
          phoneInput.value = phoneNumber;

          // مسح الـ QR إذا كانت الدالة موجودة
          if (typeof clearQR === "function") {
            clearQR();
          }

          console.log("✅ تم تعيين الرقم مباشرة:", phoneNumber);
        }
        // إذا كان هناك أكثر من رقم → فتح Dialog
        else {
          contactNumbers = contact.tel.map(cleanPhoneNumber);
          contactName =
            contact.name && contact.name.length > 0 ? contact.name[0] : "";

          console.log("📋 عرض Dialog مع الأرقام:", contactNumbers);

          displayNumbersDialog(contactNumbers, contactName);
        }
      } else {
        alert("❌ لم يتم العثور على رقم هاتف في جهة الاتصال");
      }
    } catch (error) {
      // المستخدم ألغى الاختيار
      console.log("ℹ️ تم إلغاء اختيار جهة الاتصال أو حدث خطأ:", error);
      alert("⚠️ تم إلغاء اختيار جهة الاتصال أو حدث خطأ");
    }
  }

  // =============================================
  // 4. منطق عرض الـ Dialog
  // =============================================

  /**
   * عرض الـ Dialog مع أرقام جهة الاتصال
   */
  function displayNumbersDialog(numbers, name) {
    // تحديث عنوان الـ Dialog مع اسم جهة الاتصال (نفس Vue)
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

      // دعم لوحة المفاتيح (Enter)
      listItem.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectNumberFromDialog(num);
        }
      });

      contactNumbersList.appendChild(listItem);
    });

    // فتح الـ Dialog
    numbersDialog.classList.remove("hidden");

    // التركيز على أول رقم
    const firstItem = contactNumbersList.querySelector("li");
    if (firstItem) {
      setTimeout(() => firstItem.focus(), 100);
    }

    console.log("🎉 تم فتح Dialog بنجاح");
  }

  // =============================================
  // 5. ربط الأحداث
  // =============================================

  // ربط زر اختيار جهة الاتصال
  contactPickerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pickContact();
  });

  // ربط زر إلغاء الـ Dialog
  dialogCancelBtn.addEventListener("click", (e) => {
    e.preventDefault();
    closeDialog();
  });

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
  console.log("📱 الجهاز يدعم Contact Picker:", isContactSupported);
});
