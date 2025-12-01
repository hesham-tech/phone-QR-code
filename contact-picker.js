// ==========================================
// Contact Picker Module
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // DOM Elements
  // ==========================================
  const elements = {
    contactPickerBtn: document.getElementById("contactPickerBtn"),
    phoneInput: document.getElementById("phone"),
    numbersDialog: document.getElementById("numbersDialog"),
    contactNumbersList: document.getElementById("contactNumbersList"),
    dialogTitle: document.getElementById("dialogTitle"),
    dialogCancelBtn: document.getElementById("dialogCancelBtn"),
  };

  // ==========================================
  // Validation
  // ==========================================
  function validateElements() {
    const missing = Object.entries(elements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

    if (missing.length > 0) {
      console.error("❌ Missing Contact Picker elements:", missing);
      return false;
    }

    return true;
  }

  if (!validateElements()) return;

  // ==========================================
  // Check Contact Picker Support
  // ==========================================
  const isContactSupported =
    "contacts" in navigator && "select" in navigator.contacts;

  if (!isContactSupported) {
    elements.contactPickerBtn.style.display = "none";
    console.warn("⚠️ Contact Picker API not supported");
    return;
  }

  console.log("✅ Contact Picker API supported");

  // ==========================================
  // Phone Number Cleaner
  // ==========================================
  const PhoneCleaner = {
    // International prefixes to remove
    PREFIXES: [
      "20", // Egypt
      "966", // Saudi Arabia
      "971", // UAE
      "962", // Jordan
      "965", // Kuwait
      "968", // Oman
      "973", // Bahrain
      "974", // Qatar
      "212", // Morocco
      "218", // Libya
      "249", // Sudan
      "963", // Syria
      "90", // Turkey
      "1", // USA/Canada
      "44", // UK
      "33", // France
      "49", // Germany
      "380", // Ukraine
      "39", // Italy
      "34", // Spain
      "351", // Portugal
      "355", // Albania
      "357", // Cyprus
      "358", // Finland
      "359", // Bulgaria
      "36", // Hungary
      "420", // Czech Republic
      "421", // Slovakia
      "43", // Austria
      "45", // Denmark
      "46", // Sweden
      "47", // Norway
      "48", // Poland
      "52", // Mexico
      "53", // Cuba
      "54", // Argentina
      "55", // Brazil
      "56", // Chile
      "57", // Colombia
      "58", // Venezuela
      "60", // Malaysia
      "61", // Australia
      "62", // Indonesia
      "63", // Philippines
      "64", // New Zealand
      "65", // Singapore
      "66", // Thailand
      "67", // Kazakhstan
      "68", // East Timor
    ],

    clean(number) {
      if (!number) return "";

      // Remove all non-digits
      let cleaned = number.replace(/\D/g, "");

      // Remove international prefixes if number is too long
      if (cleaned.length > 11) {
        const prefixPattern = `^(${this.PREFIXES.join("|")})`;
        cleaned = cleaned.replace(new RegExp(prefixPattern), "");
      }

      // Fix 10-digit numbers starting with '1' (add leading zero)
      if (cleaned.length === 10 && cleaned.startsWith("1")) {
        cleaned = "0" + cleaned;
      }

      return cleaned;
    },
  };

  // ==========================================
  // Dialog Manager
  // ==========================================
  const DialogManager = {
    show(numbers, name = "") {
      elements.dialogTitle.innerHTML = `
                <i class="fas fa-phone"></i>
                ${name ? `اختر رقم (${name})` : "اختر رقم الهاتف"}
            `;

      this.renderNumbers(numbers);
      elements.numbersDialog.classList.remove("hidden");
    },

    close() {
      elements.numbersDialog.classList.add("hidden");
    },

    renderNumbers(numbers) {
      elements.contactNumbersList.innerHTML = "";

      numbers.forEach((number) => {
        const li = document.createElement("li");
        li.textContent = number;
        li.setAttribute("dir", "ltr");

        li.addEventListener("click", () => {
          this.selectNumber(number);
        });

        elements.contactNumbersList.appendChild(li);
      });
    },

    selectNumber(number) {
      elements.phoneInput.value = number;

      // Call external functions from script.js
      if (typeof window.clearQR === "function") {
        window.clearQR();
      }

      if (typeof window.saveNumber === "function") {
        window.saveNumber(number);
      }

      if (typeof window.loadSavedNumbers === "function") {
        window.loadSavedNumbers();
      }

      this.close();
    },
  };

  // ==========================================
  // Contact Picker
  // ==========================================
  const ContactPicker = {
    async pick() {
      try {
        // Verify validation function exists
        if (typeof window.getPhoneValidationErrors !== "function") {
          this.showError("دالة التحقق غير متوفرة. تأكد من تحميل script.js");
          return;
        }

        // Request contact
        const contacts = await navigator.contacts.select(["tel", "name"], {
          multiple: false,
        });

        if (!contacts || contacts.length === 0) {
          return;
        }

        const contact = contacts[0];

        // Check if contact has phone numbers
        if (!contact.tel || contact.tel.length === 0) {
          this.showError("جهة الاتصال لا تحتوي على أرقام هاتف");
          return;
        }

        // Clean and validate numbers
        const cleanedNumbers = contact.tel
          .map((num) => PhoneCleaner.clean(num))
          .filter((num) => num.length > 0);

        const validNumbers = cleanedNumbers.filter((num) => {
          const errors = window.getPhoneValidationErrors(num);
          return errors.length === 0;
        });

        if (validNumbers.length === 0) {
          this.showError("لا توجد أرقام صالحة (11 رقم تبدأ بـ 01)");
          return;
        }

        // Get contact name
        const name =
          contact.name && contact.name.length > 0 ? contact.name[0] : "";

        // Show dialog or select directly
        if (validNumbers.length === 1) {
          DialogManager.selectNumber(validNumbers[0]);
        } else {
          DialogManager.show(validNumbers, name);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Contact Picker error:", error);
          this.showError("حدث خطأ أثناء اختيار جهة الاتصال");
        }
      }
    },

    showError(message) {
      alert(`⚠️ ${message}`);
    },
  };

  // ==========================================
  // Event Listeners
  // ==========================================
  elements.contactPickerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    ContactPicker.pick();
  });

  elements.dialogCancelBtn.addEventListener("click", () => {
    DialogManager.close();
  });

  elements.numbersDialog.addEventListener("click", (e) => {
    if (e.target === elements.numbersDialog) {
      DialogManager.close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      !elements.numbersDialog.classList.contains("hidden")
    ) {
      DialogManager.close();
    }
  });

  console.log("✅ Contact Picker initialized");
});
