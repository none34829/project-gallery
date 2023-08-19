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
});