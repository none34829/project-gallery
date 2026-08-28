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

    // The project image used to be stretched and cropped to end level with the last
    // line of the description - height driven by the text, which is what Ronil asked
    // us to stop doing. It now keeps its own proportions, set purely in CSS, so the
    // picture decides its height and nothing is cut off.
});
