// =============================================
// منطق Contact Picker API
// =============================================

const contactPickerBtn = document.getElementById("contactPickerBtn");
const phoneInput = document.getElementById("phone");

// ----------------------------------------------------
// 1. وظيفة تنظيف الرقم من الرموز والمسافات
// ----------------------------------------------------
function cleanPhoneNumber(number) {
  if (!number) return "";
  // حذف أي مسافات، أقواس، شرطات، علامات + (عدا علامة # التي قد يستخدمها المستخدم لـ USSD)
  return number.replace(/[\s\(\)\-+]/g, "");
}

// ----------------------------------------------------
// 2. وظيفة اختيار جهة الاتصال
// ----------------------------------------------------
async function selectContact() {
  // التحقق من دعم المتصفح لـ Contact Picker API
  if (!("contacts" in navigator && "select" in navigator.contacts)) {
    alert(
      "وظيفة اختيار جهات الاتصال غير مدعومة في متصفحك أو بيئة التشغيل هذه (يتطلب هاتف محمول)."
    );
    return;
  }

  // تحديد الخصائص المطلوبة (الاسم ورقم الهاتف)
  const properties = ["name", "tel"];

  // خيارات متعددة لاختيار أكثر من رقم إن وجد
  const options = { multiple: false };

  try {
    // فتح منتقي جهات الاتصال
    const contacts = await navigator.contacts.select(properties, options);

    if (contacts.length === 0) {
      console.log("لم يتم اختيار أي جهة اتصال.");
      return;
    }

    const selectedContact = contacts[0];

    // إذا كان هناك رقم واحد فقط
    if (selectedContact.tel.length === 1) {
      phoneInput.value = cleanPhoneNumber(selectedContact.tel[0]);
    }
    // إذا كان هناك أكثر من رقم (عرض الأرقام للاختيار)
    else if (selectedContact.tel.length > 1) {
      // بناء رسالة لطلب اختيار الرقم الصحيح
      let promptMessage = `تم العثور على أرقام متعددة لـ ${selectedContact.name}:\nالرجاء اختيار الرقم الصحيح:\n\n`;
      selectedContact.tel.forEach((num, index) => {
        promptMessage += `${index + 1}. ${num}\n`;
      });

      // استخدام prompt (واجهة بسيطة) لطلب اختيار الرقم
      const choice = prompt(promptMessage);

      // التأكد من أن الإدخال رقمي وصحيح
      const index = parseInt(choice) - 1;

      if (index >= 0 && index < selectedContact.tel.length) {
        phoneInput.value = cleanPhoneNumber(selectedContact.tel[index]);
      } else if (choice !== null) {
        alert("اختيار غير صحيح.");
      }
    }

    // تنظيف الـ QR بعد وضع الرقم الجديد
    // نفترض أن دالة clearQR موجودة في script.js
    if (typeof clearQR === "function") {
      clearQR();
    }
  } catch (error) {
    // يمكن أن يحدث خطأ إذا تم رفض الأذونات
    console.error("فشل اختيار جهة الاتصال:", error);
    alert("فشل في الوصول إلى جهات الاتصال. تأكد من منح الإذن.");
  }
}

// ----------------------------------------------------
// 3. ربط الحدث
// ----------------------------------------------------
contactPickerBtn.addEventListener("click", selectContact);
