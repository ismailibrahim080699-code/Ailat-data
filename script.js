// AILAT DATA - Interactive Script
document.addEventListener("DOMContentLoaded", () => {
    // Dauko duk abubuwan dake cikin navigation da menu
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.addEventListener("click", function() {
            // Cire ajin active daga duka sannan a saka wa wanda aka danna
            navItems.forEach(nav => nav.classList.remove("active"));
            this.classList.add("active");
        });
    });
});
