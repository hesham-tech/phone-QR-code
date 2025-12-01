// ==========================================
// Constants & Configuration
// ==========================================
const CONFIG = {
  DEFAULT_PREFIX: "*9*7*",
  PREFIX_STORAGE_KEY: "ussd_prefix",
  SAVED_NUMBERS_KEY: "saved_numbers",
  MAX_SAVED_NUMBERS: 10,
  PHONE_LENGTH: 11,
  QR_SIZE: 300,
};

// ==========================================
// DOM Elements
// ==========================================
const DOM = {
  phoneInput: document.getElementById("phone"),
  amountInput: document.getElementById("amount"),
  savedNumbersDropdown: document.getElementById("savedNumbersDropdown"),
  savedNumbersList: document.getElementById("savedNumbersList"),
  qrBox: document.getElementById("qrBox"),
  codeInfo: document.getElementById("codeInfo"),
  ussdCodeSpan: document.getElementById("ussdCode"),
  ussdCodeBottom: document.getElementById("ussdCodeBottom"),
  ussdCodeBottomContainer: document.getElementById("ussdCodeBottomContainer"),
  copyButton: document.getElementById("copyBtn"),
  callButton: document.getElementById("callBtn"),
  genButton: document.getElementById("gen"),
  genFixedButton: document.getElementById("genFixed"),
  settingsDialog: document.getElementById("settingsDialog"),
  settingsBtn: document.getElementById("settingsBtn"),
  prefixInput: document.getElementById("prefixInput"),
  savePrefixBtn: document.getElementById("savePrefixBtn"),
};

// ==========================================
// Storage Manager
// ==========================================
const StorageManager = {
  getPrefix() {
    return (
      localStorage.getItem(CONFIG.PREFIX_STORAGE_KEY) || CONFIG.DEFAULT_PREFIX
    );
  },

  setPrefix(prefix) {
    localStorage.setItem(CONFIG.PREFIX_STORAGE_KEY, prefix);
  },

  getSavedNumbers() {
    const data = localStorage.getItem(CONFIG.SAVED_NUMBERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  setSavedNumbers(numbers) {
    localStorage.setItem(CONFIG.SAVED_NUMBERS_KEY, JSON.stringify(numbers));
  },

  addNumber(number) {
    let numbers = this.getSavedNumbers();
    numbers = numbers.filter((n) => n !== number);

    if (numbers.length >= CONFIG.MAX_SAVED_NUMBERS) {
      numbers.shift();
    }

    numbers.push(number);
    this.setSavedNumbers(numbers);
  },
};

// ==========================================
// Validation
// ==========================================
const Validator = {
  getPhoneValidationErrors(phone) {
    const errors = [];

    if (phone.length !== CONFIG.PHONE_LENGTH) {
      errors.push(
        `يجب أن يحتوي على ${CONFIG.PHONE_LENGTH} رقماً (الحالي: ${phone.length})`
      );
    }

    if (!phone.startsWith("01")) {
      errors.push(`يجب أن يبدأ بـ '01' (الحالي: '${phone.substring(0, 2)}')`);
    }

    if (!/^\d+$/.test(phone)) {
      errors.push("يجب أن يحتوي على أرقام فقط");
    }

    return errors;
  },

  validatePhone(phone) {
    const errors = this.getPhoneValidationErrors(phone);

    if (errors.length > 0) {
      this.showError("خطأ في رقم الهاتف", errors);
      return false;
    }

    return true;
  },

  showError(title, messages) {
    const errorText = messages.map((msg) => `• ${msg}`).join("\n");
    alert(`❌ ${title}:\n\n${errorText}`);
  },

  showSuccess(message) {
    alert(`✅ ${message}`);
  },
};

// Expose for contact-picker.js
window.getPhoneValidationErrors =
  Validator.getPhoneValidationErrors.bind(Validator);

// ==========================================
// QR Manager
// ==========================================
const QRManager = {
  clear() {
    DOM.qrBox.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>سيظهر كود QR هنا بعد إدخال البيانات</p>
            </div>
        `;
    DOM.codeInfo.classList.add("hidden");
    DOM.ussdCodeSpan.textContent = "";
    DOM.ussdCodeBottom.textContent = "";
    DOM.ussdCodeBottomContainer.classList.add("hidden");
  },

  generate(text) {
    DOM.qrBox.innerHTML = "";
    DOM.qrBox.classList.add("fade-in");

    new QRCode(DOM.qrBox, {
      text: text,
      width: CONFIG.QR_SIZE,
      height: CONFIG.QR_SIZE,
      colorDark: "#e60000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    setTimeout(() => DOM.qrBox.classList.remove("fade-in"), 500);
  },

  displayCode(ussdCode) {
    DOM.ussdCodeSpan.textContent = ussdCode;
    DOM.codeInfo.classList.remove("hidden");
    DOM.ussdCodeBottom.textContent = ussdCode;
    DOM.ussdCodeBottomContainer.classList.remove("hidden");
  },
};

// ==========================================
// Saved Numbers Manager
// ==========================================
const SavedNumbersManager = {
  load(initialLoad = false) {
    const numbers = StorageManager.getSavedNumbers();

    if (initialLoad && numbers.length > 0 && !DOM.phoneInput.value) {
      DOM.phoneInput.value = numbers[numbers.length - 1];
    }

    this.render(numbers);
  },

  render(numbers) {
    DOM.savedNumbersList.innerHTML = "";

    if (numbers.length === 0) {
      this.hide();
      return;
    }

    numbers.forEach((number) => {
      const li = document.createElement("li");
      li.textContent = number;
      li.setAttribute("dir", "ltr");

      li.addEventListener("click", () => {
        DOM.phoneInput.value = number;
        QRManager.clear();
        this.hide();
      });

      DOM.savedNumbersList.appendChild(li);
    });

    this.filter();
  },

  filter() {
    const searchTerm = DOM.phoneInput.value.trim();
    const items = Array.from(DOM.savedNumbersList.children);
    let hasMatches = false;

    items.forEach((item) => {
      const number = item.textContent;
      const matches = !searchTerm || number.startsWith(searchTerm);

      item.style.display = matches ? "" : "none";
      if (matches) hasMatches = true;
    });

    if (searchTerm && hasMatches) {
      this.show();
    } else {
      this.hide();
    }
  },

  show() {
    DOM.savedNumbersDropdown.classList.remove("hidden");
  },

  hide() {
    DOM.savedNumbersDropdown.classList.add("hidden");
  },
};

// ==========================================
// Settings Manager
// ==========================================
const SettingsManager = {
  open() {
    DOM.prefixInput.value = StorageManager.getPrefix();
    DOM.settingsDialog.classList.remove("hidden");
  },

  close() {
    DOM.settingsDialog.classList.add("hidden");
  },

  save() {
    const newPrefix = DOM.prefixInput.value.trim();

    if (!newPrefix) {
      Validator.showError("خطأ", ["الرجاء إدخال رمز كود USSD صالح"]);
      return;
    }

    StorageManager.setPrefix(newPrefix);
    QRManager.clear();
    this.close();
    Validator.showSuccess("تم حفظ رمز الكود بنجاح!");
  },
};

// ==========================================
// Code Generator
// ==========================================
const CodeGenerator = {
  build(includeAmount = true) {
    const phone = DOM.phoneInput.value.trim();
    const amount = DOM.amountInput.value.trim();
    const prefix = StorageManager.getPrefix();

    SavedNumbersManager.hide();

    // Validate phone
    if (!Validator.validatePhone(phone)) {
      return;
    }

    // Validate amount if required
    if (includeAmount && (!amount || Number(amount) <= 0)) {
      Validator.showError("خطأ في المبلغ", ["يجب إدخال مبلغ صحيح أكبر من صفر"]);
      return;
    }

    // Build USSD code
    const ussdCode = includeAmount
      ? `${prefix}${phone}*${amount}#`
      : `${prefix}${phone}*`;

    const telUri = `tel:${encodeURIComponent(ussdCode)}`;

    // Generate QR and display
    QRManager.generate(telUri);
    QRManager.displayCode(ussdCode);

    // Save number
    StorageManager.addNumber(phone);
    SavedNumbersManager.load();
  },
};

// ==========================================
// Copy Manager
// ==========================================
const CopyManager = {
  async copy() {
    const code = DOM.ussdCodeSpan.textContent;

    try {
      await navigator.clipboard.writeText(code);
      this.showSuccess();
    } catch (err) {
      console.error("Copy failed:", err);
      Validator.showError("فشل النسخ", ["حاول نسخ الكود يدوياً"]);
    }
  },

  showSuccess() {
    const originalHTML = DOM.copyButton.innerHTML;
    DOM.copyButton.innerHTML =
      '<i class="fas fa-check"></i><span>تم النسخ!</span>';
    DOM.copyButton.style.background = "var(--success)";

    setTimeout(() => {
      DOM.copyButton.innerHTML = originalHTML;
      DOM.copyButton.style.background = "";
    }, 1500);
  },
};

// ==========================================
// Call Manager
// ==========================================
const CallManager = {
  makeCall() {
    const ussdCode = DOM.ussdCodeSpan.textContent.trim();

    if (!ussdCode) {
      Validator.showError("خطأ", ["لا يوجد كود USSD للاتصال"]);
      return;
    }

    const telUri = `tel:${encodeURIComponent(ussdCode)}`;
    window.location.href = telUri;
  },
};

// ==========================================
// Event Listeners
// ==========================================
function initEventListeners() {
  // Input changes clear QR
  DOM.phoneInput.addEventListener("input", () => {
    QRManager.clear();
    SavedNumbersManager.filter();
  });

  DOM.amountInput.addEventListener("input", () => {
    QRManager.clear();
  });

  // Phone input focus
  DOM.phoneInput.addEventListener("focus", () => {
    SavedNumbersManager.load();
    SavedNumbersManager.filter();
  });

  // Generate buttons
  DOM.genButton.addEventListener("click", () => CodeGenerator.build(true));
  DOM.genFixedButton.addEventListener("click", () =>
    CodeGenerator.build(false)
  );

  // Copy button
  DOM.copyButton.addEventListener("click", () => CopyManager.copy());

  // Call button
  DOM.callButton.addEventListener("click", () => CallManager.makeCall());

  // Settings
  DOM.settingsBtn.addEventListener("click", () => SettingsManager.open());
  DOM.savePrefixBtn.addEventListener("click", () => SettingsManager.save());

  // Settings dialog backdrop
  DOM.settingsDialog.addEventListener("click", (e) => {
    if (e.target === DOM.settingsDialog) {
      SettingsManager.close();
    }
  });

  // Click outside to close dropdown
  document.addEventListener("click", (e) => {
    const isClickInside =
      DOM.savedNumbersDropdown.contains(e.target) ||
      DOM.phoneInput.contains(e.target);
    if (!isClickInside) {
      SavedNumbersManager.hide();
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      SettingsManager.close();
      SavedNumbersManager.hide();
    }
  });
}

// ==========================================
// Initialization
// ==========================================
function init() {
  SavedNumbersManager.load(true);
  initEventListeners();
  console.log("✅ USSD QR Generator initialized");
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Expose functions for contact-picker.js
window.clearQR = QRManager.clear.bind(QRManager);
window.saveNumber = StorageManager.addNumber.bind(StorageManager);
window.loadSavedNumbers = SavedNumbersManager.load.bind(SavedNumbersManager);
