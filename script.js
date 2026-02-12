document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.nav');
    const setNavState = () => {
        if (!nav) {
            return;
        }
        if (window.scrollY > 20) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
    };

    setNavState();
    window.addEventListener('scroll', setNavState);

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        }
    );

    document.querySelectorAll('[data-animate]').forEach(element => {
        observer.observe(element);
    });
});
