import styles from "../css/project.scss";
import din_condensed from "../assets/fonts/DIN Condensed Bold.ttf";
import din_condensed2 from "../assets/fonts/DIN Condensed Bold.otf";
import fatfrank from "../assets/fonts/FatFrank-Regular.otf";
import fatfrank2 from "../assets/fonts/FatFrank-Regular.ttf";


function showModal(){
    console.log("thing")
    document.querySelector(".pdfModal").classList.add("pdfModal--show")
}

function hideModal(){
    console.log("thing2")
    document.querySelector(".pdfModal").classList.remove("pdfModal--show")
}

window.addEventListener('load', (event) => {
    document.querySelector('.research_button').onclick = () => {
        showModal()
    }   

    document.querySelector('.close').onclick = () => {
        hideModal()
    }

    document.onkeydown = (e) => {
        if(e.key === "Escape" || e.key === "Esc")
            hideModal()
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

        const descBox = descP.getBoundingClientRect();
        const cs = window.getComputedStyle(descP);
        const paddingBottom = parseFloat(cs.paddingBottom) || 0;
        const borderBottom = parseFloat(cs.borderBottomWidth) || 0;

        // Align to the content box bottom of the description (not including padding).
        const textBottom = descBox.bottom - paddingBottom - borderBottom + window.scrollY;

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
        if (getLastParagraph()) ro.observe(getLastParagraph());
    }
});
