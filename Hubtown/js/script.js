// AOS init
AOS.init({ once: true, offset: 80, duration: 700, easing: 'ease-out-cubic' });

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 60,
                behavior: "smooth"
            });
        }
    });
});

// Number counter animation when in viewport
const counters = document.querySelectorAll('.counter');
const animateCounter = (el) => {
    const target = +el.getAttribute('data-target');
    const duration = 1500;
    const start = performance.now();
    const step = (timestamp) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(step);
};
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.6 });
counters.forEach(counter => observer.observe(counter));

// Forms + Modal logic
document.addEventListener("DOMContentLoaded", function () {
    /* ---------------------------
       FORM SUBMISSION + VALIDATION
    ---------------------------- */
    document.querySelectorAll("form").forEach(form => {
        form.addEventListener("submit", e => {
            e.preventDefault();

            const nameInput = form.querySelector("input[name='entry.751095666']");
            const emailInput = form.querySelector("input[name='entry.954606011']");
            const phoneInput = form.querySelector("input[name='entry.1307352382']");
            const cityInput = form.querySelector("input[name='entry.1783753412']");
            const configInput = form.querySelector("select[name='entry.1069655918']");
            const msg = form.querySelector(".successMsg");

            // Reset styles/messages
            [nameInput, emailInput, phoneInput, cityInput, configInput].forEach(input => {
                if (input) input.classList.remove("border-red-500", "focus:ring-red-500");
            });
            if (msg) {
                msg.classList.add("hidden");
                msg.classList.remove("text-green-600", "text-red-600");
            }

            // Regex rules
            const nameRegex = /^[A-Za-z\s]{2,50}$/;
            const phoneRegex = /^[0-9]{10}$/;
            const cityRegex = /^[A-Za-z\s]{2,50}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            let hasError = false;
            let errorText = "";

            if (!nameRegex.test((nameInput?.value || "").trim())) {
                nameInput?.classList.add("border-red-500", "focus:ring-red-500");
                errorText = "❌ Please enter a valid name (letters and spaces only, 2–50 characters).";
                hasError = true;
            } else if (!emailRegex.test((emailInput?.value || "").trim())) {
                emailInput?.classList.add("border-red-500", "focus:ring-red-500");
                errorText = "❌ Please enter a valid email address.";
                hasError = true;
            } else if (!phoneRegex.test((phoneInput?.value || "").trim())) {
                phoneInput?.classList.add("border-red-500", "focus:ring-red-500");
                errorText = "❌ Please enter a valid 10-digit mobile number (without country code).";
                hasError = true;
            } else if (!cityRegex.test((cityInput?.value || "").trim())) {
                cityInput?.classList.add("border-red-500", "focus:ring-red-500");
                errorText = "❌ Please enter a valid city name (letters and spaces only).";
                hasError = true;
            } else if (configInput && (configInput.value || "").trim() === "") {
                configInput.classList.add("border-red-500", "focus:ring-red-500");
                errorText = "❌ Please select a configuration.";
                hasError = true;
            }

            if (hasError) {
                if (msg) {
                    msg.textContent = errorText;
                    msg.classList.remove("hidden");
                    msg.classList.add("text-red-600");
                }
                return;
            }

            // Submit via fetch
            const data = new FormData(form);
            fetch(form.action, { method: "POST", body: data, mode: "no-cors" })
                .then(() => {
                    // Modal form: special handling
                    if (form.id === "enquiryFormModal") {
                        modalFormDirty = false;
                        modalFormSubmitted = true;
                        form.reset();
                        reallyCloseEnquire();
                        const successConfirm = document.getElementById("successConfirm");
                        if (successConfirm) successConfirm.classList.remove("hidden");
                    } else {
                        if (msg) {
                            msg.textContent = "✅ Thank you! Your enquiry has been submitted.";
                            msg.classList.remove("hidden");
                            msg.classList.add("text-green-600");
                        }
                        form.reset();
                    }
                })
                .catch(err => {
                    console.error("Error submitting form", err);
                    if (msg) {
                        msg.textContent = "❌ Something went wrong. Please try again.";
                        msg.classList.remove("hidden");
                        msg.classList.add("text-red-600");
                    }
                });
        });
    });

    /* ---------------------------
       MODAL AUTO-OPEN + SAFE CLOSE
    ---------------------------- */
    const enquireModal = document.getElementById('enquireModal');
    const enquireClose = document.getElementById('enquireClose');
    const enquireBackdrop = document.getElementById('enquireBackdrop');
    const enquireStickyBtn = document.getElementById('enquireStickyBtn');
    const enquireMobileBtn = document.getElementById('enquireMobileBtn');
    const bookNowBtn = document.getElementById('bookNowBtn');

    const heroForm = document.getElementById('heroForm');
    const footerForm = document.getElementById('footerForm');
    const modalForm = document.getElementById('enquiryFormModal');

    const unsavedConfirm = document.getElementById("unsavedConfirm");
    const discardBtn = document.getElementById("discardBtn");
    const keepEditingBtn = document.getElementById("keepEditingBtn");
    const successConfirm = document.getElementById("successConfirm");
    const successOkBtn = document.getElementById("successOkBtn");

    let modalTimer;
    let modalShouldOpen = true;
    let modalFormDirty = false;
    let modalFormSubmitted = false;

    function openEnquire() {
        enquireModal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }
    function reallyCloseEnquire() {
        enquireModal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        modalFormDirty = false;
        modalFormSubmitted = false;
        if (modalForm) modalForm.reset();
    }
    function attemptCloseEnquire() {
        const isModalOpen = !enquireModal.classList.contains("hidden");
        if (isModalOpen && modalFormDirty && !modalFormSubmitted) {
            unsavedConfirm.classList.remove("hidden");
            return;
        }
        reallyCloseEnquire();
    }

    // Confirmation actions
    if (discardBtn) {
        discardBtn.addEventListener("click", () => {
            unsavedConfirm.classList.add("hidden");
            reallyCloseEnquire();
        });
    }
    if (keepEditingBtn) {
        keepEditingBtn.addEventListener("click", () => {
            unsavedConfirm.classList.add("hidden");
        });
    }
    if (successOkBtn) {
        successOkBtn.addEventListener("click", () => {
            successConfirm.classList.add("hidden");
        });
    }

    // Open from sticky/mobile/book buttons
    if (enquireStickyBtn) enquireStickyBtn.addEventListener('click', e => { e.preventDefault(); openEnquire(); });
    if (enquireMobileBtn) enquireMobileBtn.addEventListener('click', e => { e.preventDefault(); openEnquire(); });
    if (bookNowBtn) bookNowBtn.addEventListener('click', e => { e.preventDefault(); openEnquire(); });

    // Close modal: icon, backdrop, Esc
    if (enquireClose) enquireClose.addEventListener('click', attemptCloseEnquire);
    if (enquireBackdrop) enquireBackdrop.addEventListener('click', attemptCloseEnquire);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') attemptCloseEnquire(); });

    // Cancel auto-popup if user interacts with hero/footer forms (includes select)
    function cancelAutoPopup() {
        modalShouldOpen = false;
        if (modalTimer) clearTimeout(modalTimer);
    }
    [heroForm, footerForm].forEach(form => {
        if (form) {
            form.querySelectorAll("input, textarea, select").forEach(input => {
                input.addEventListener("focus", cancelAutoPopup, { once: true });
                input.addEventListener("input", cancelAutoPopup, { once: true });
                input.addEventListener("change", cancelAutoPopup, { once: true });
            });
        }
    });

    // Track if modal form is dirty (inputs + selects)
    if (modalForm) {
        modalForm.querySelectorAll("input, textarea, select").forEach(input => {
            const markDirty = () => {
                modalFormDirty = Array.from(modalForm.elements).some(el => {
                    const val = (el.value || "").trim();
                    return val !== "";
                });
            };
            input.addEventListener("input", markDirty);
            input.addEventListener("change", markDirty);
        });
    }

    // Auto-open after 5s if allowed
    modalTimer = setTimeout(() => {
        if (!modalShouldOpen) return;
        const activeEl = document.activeElement;
        const userInModal = modalForm && modalForm.contains(activeEl);
        const alreadyOpen = enquireModal && !enquireModal.classList.contains("hidden");
        if (!userInModal && !alreadyOpen) openEnquire();
    }, 5000);
});