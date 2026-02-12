import * as THREE from 'three';

// ═══════════════════════════════════════════════════
// THREE.JS PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════
function initParticles() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create particles
    const particleCount = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const colorAccent = new THREE.Color('#d4a054');
    const colorDim = new THREE.Color('#c4b8a8');
    const colorPurple = new THREE.Color('#b8a4d8');

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 80;
        positions[i3 + 1] = (Math.random() - 0.5) * 60;
        positions[i3 + 2] = (Math.random() - 0.5) * 50;

        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.15) {
            color = colorAccent;
        } else if (colorChoice < 0.25) {
            color = colorPurple;
        } else {
            color = colorDim;
        }

        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = Math.random() * 2.5 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for soft particles
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: `
            attribute float size;
            varying vec3 vColor;
            uniform float uTime;
            uniform float uPixelRatio;

            void main() {
                vColor = color;
                vec3 pos = position;
                pos.y += sin(uTime * 0.3 + position.x * 0.1) * 0.5;
                pos.x += cos(uTime * 0.2 + position.y * 0.08) * 0.4;

                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * uPixelRatio * (20.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;

            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;

                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha *= 0.35;
                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.NormalBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Connection lines
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#c4a67a'),
        transparent: true,
        opacity: 0.06,
        blending: THREE.NormalBlending,
        depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse tracking
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    });

    // Animation loop
    const clock = new THREE.Clock();
    let lineUpdateCounter = 0;

    function animate() {
        requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        material.uniforms.uTime.value = elapsed;

        // Subtle mouse follow
        particles.rotation.y += (mouseX * 0.05 - particles.rotation.y) * 0.02;
        particles.rotation.x += (mouseY * 0.03 - particles.rotation.x) * 0.02;

        // Slow rotation
        particles.rotation.z = elapsed * 0.015;

        // Update connection lines every few frames for performance
        lineUpdateCounter++;
        if (lineUpdateCounter % 3 === 0) {
            const posArray = geometry.attributes.position.array;
            const lineArray = lineGeometry.attributes.position.array;
            let lineIndex = 0;
            const maxDist = 8;
            const maxLines = 300;
            let lineCount = 0;

            for (let i = 0; i < Math.min(particleCount, 150); i++) {
                if (lineCount >= maxLines) break;
                for (let j = i + 1; j < Math.min(particleCount, 150); j++) {
                    if (lineCount >= maxLines) break;
                    const dx = posArray[i * 3] - posArray[j * 3];
                    const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                    const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist < maxDist) {
                        lineArray[lineIndex++] = posArray[i * 3];
                        lineArray[lineIndex++] = posArray[i * 3 + 1];
                        lineArray[lineIndex++] = posArray[i * 3 + 2];
                        lineArray[lineIndex++] = posArray[j * 3];
                        lineArray[lineIndex++] = posArray[j * 3 + 1];
                        lineArray[lineIndex++] = posArray[j * 3 + 2];
                        lineCount++;
                    }
                }
            }

            // Clear remaining
            for (let i = lineIndex; i < lineArray.length; i++) {
                lineArray[i] = 0;
            }

            lineGeometry.attributes.position.needsUpdate = true;
            lineGeometry.setDrawRange(0, lineCount * 2);
        }

        renderer.render(scene, camera);
    }

    animate();
}

// ═══════════════════════════════════════════════════
// DOM INTERACTIONS
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // --- Three.js ---
    initParticles();

    // --- Navigation scroll state ---
    const header = document.getElementById('site-header');
    const setScrollState = () => {
        if (!header) return;
        header.classList.toggle('scrolled', window.scrollY > 30);
    };
    setScrollState();
    window.addEventListener('scroll', setScrollState, { passive: true });

    // --- Active nav link tracking ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const updateActiveLink = () => {
        const scrollPos = window.scrollY + 150;
        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };
    window.addEventListener('scroll', updateActiveLink, { passive: true });

    // --- Hamburger menu ---
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('open');
            document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Close mobile menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Scroll-reveal animations ---
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger animation
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, index * 80);
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px',
        }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
        observer.observe(el);
    });

    // --- Contact form handler ---
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                <span>Sending...</span>
            `;
            btn.disabled = true;

            setTimeout(() => {
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Message Sent!</span>
                `;
                btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                    form.reset();
                }, 2500);
            }, 1500);
        });
    }

    // --- Smooth anchor scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Add spin keyframe dynamically ---
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
});
