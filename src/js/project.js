import styles from "../css/project.scss";
import din_condensed from "../assets/fonts/DIN Condensed Bold.ttf";
import din_condensed2 from "../assets/fonts/DIN Condensed Bold.otf";
import fatfrank from "../assets/fonts/FatFrank-Regular.otf";
import fatfrank2 from "../assets/fonts/FatFrank-Regular.ttf";


function showModal(){
    const m = document.querySelector(".pdfModal")
    if (m) m.classList.add("pdfModal--show")
}

function hideModal(){
    const m = document.querySelector(".pdfModal")
    if (m) m.classList.remove("pdfModal--show")
}

window.addEventListener('load', (event) => {
    // Projects without a research paper render neither the button nor the modal, so
    // these were throwing on null and aborting the rest of this load handler - which
    // also killed the dead-image gradient fallback further down.
    const researchButton = document.querySelector('.research_button')
    if (researchButton) {
        researchButton.onclick = () => {
            showModal()
        }
    }

    const closeButton = document.querySelector('.close')
    if (closeButton) {
        closeButton.onclick = () => {
            hideModal()
        }
    }

    document.onkeydown = (e) => {
        if(e.key === "Escape" || e.key === "Esc")
            hideModal()
    }  
    // A dead Airtable graphic_link renders as a broken-image icon and leaves a hole in
    // the layout. Replace the <img> outright with a div carrying the project's subject
    // gradient - the same treatment the cards on the front page use. Restyling the dead
    // <img> instead leaves Chrome's broken glyph and tiles the gradient at the image's
    // intrinsic width, so the element has to go.
    var heroImg = document.querySelector('.projectGraphic');
    if (heroImg) {
        var swapHero = function () {
            if (!heroImg || !heroImg.parentNode) return;
            var grad = heroImg.getAttribute('data-fallback');
            if (!grad) { heroImg.style.display = 'none'; return; }
            var box = document.createElement('div');
            box.className = heroImg.className + ' is-missing';
            box.style.background = grad;
            box.setAttribute('aria-hidden', 'true');
            heroImg.parentNode.replaceChild(box, heroImg);
            heroImg = null;
        };
        heroImg.addEventListener('error', swapHero);
        if (heroImg.complete && heroImg.naturalWidth === 0) swapHero();
    }

    // Equalize project image height to match the last paragraph bottom on wide screens
    const img = document.querySelector('.projectGraphic');
    const body = document.querySelector('.projectBody');
    // Pick the actual long description paragraph (the <p> right after the divider),
    // not the later "Explore More!" paragraph.
    const getDescriptionPara = () => {
        if (!body) return null;
        const divider = body.querySelector('.projectDivider');
        if (divider && divider.nextElementSibling && divider.nextElementSibling.tagName === 'P') {
            return divider.nextElementSibling;
        }
        // Fallback: choose the longest <p> inside projectBody that isn’t .projectDesc
        const paras = Array.from(body.querySelectorAll('p'))
            .filter(p => !p.classList.contains('projectDesc'));
        return paras.sort((a,b) => (b.textContent||'').length - (a.textContent||'').length)[0] || null;
    };

    const isMobile = () => window.matchMedia('(max-width: 991.98px)').matches;

    const resizeImageToText = () => {
        if (!img || !body) return;
        const descP = getDescriptionPara();
        if (!descP) return;

        // Reset on mobile/narrow layouts
        if (isMobile()) {
            img.style.height = '';
            img.style.maxHeight = '';
            img.style.objectFit = '';
            return;
        }

        const imgBox = img.getBoundingClientRect();
        const imgTop = imgBox.top + window.scrollY;

        // Align to the last rendered line of the description using Range line boxes.
        const getLastLineBottom = (el) => {
            try {
                const rng = document.createRange();
                rng.selectNodeContents(el);
                const rects = rng.getClientRects();
                if (rects && rects.length) {
                    return rects[rects.length - 1].bottom + window.scrollY;
                }
            } catch (e) { /* fallback below */ }
            const r = el.getBoundingClientRect();
            return r.bottom + window.scrollY;
        };

        const textBottom = getLastLineBottom(descP);

        let target = Math.round(textBottom - imgTop);
        // Shave a pixel to avoid sub-pixel rounding overshoot.
        target = Math.max(0, target - 1);

        if (Number.isFinite(target) && target > 0) {
            img.style.height = `${target}px`;
            img.style.maxHeight = 'none';
            img.style.objectFit = 'cover';
            img.style.objectPosition = 'right bottom';
            img.style.marginBottom = '0';
        }
    };

    // Initial run (after fonts/layout stabilized)
    setTimeout(resizeImageToText, 0);
    window.addEventListener('resize', resizeImageToText);

    // Keep in sync if content reflows (e.g., fonts load, dynamic content)
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(resizeImageToText);
        ro.observe(document.body);
        // was getLastParagraph() - that function does not exist, so this threw a
        // ReferenceError and aborted the handler, leaving the observer unregistered
        const descPara = getDescriptionPara();
        if (descPara) ro.observe(descPara);
    }
});
