import styles from "../css/index.scss";
import din_condensed from "../assets/fonts/DIN Condensed Bold.ttf";
import din_condensed2 from "../assets/fonts/DIN Condensed Bold.otf";
import fatfrank from "../assets/fonts/FatFrank-Regular.otf";
import fatfrank2 from "../assets/fonts/FatFrank-Regular.ttf";

// import 'bootstrap';

const topics = TOPICS.topics
const tags = TAGS.tags
const tagsMap = TAGSMAP.tagsMap
const projects = PROJECTS.projects

let active_filters = []
let current_category = "Published Papers and Science Fairs"

window.addEventListener('load', (event) => {
  executeSearch("")
  console.log("HI!!!!")

  if (event.timeStamp) {
    console.log('time!')
    executeSearch("")
  }

  document.addEventListener('click', event => {
    const box = document.querySelector('.searchBarContainer');
    if (!box.contains(event.target)) {
      document.querySelector(".searchSuggestions").style.display = 'none';
    }
  });
  document.querySelector("#searchCategories").onchange = () => {
    console.log("change!")
    document.getElementById('searchBar').value = ""
    current_category = document.querySelector("#searchCategories").value
    executeSearch("")
    console.log(current_category)
  }

  document.getElementById('searchBar').onclick = (e) => {
    document.querySelector(".searchSuggestions").style.display = "flex";
    let queryString = e.target.value;

    let autocompleteResults = []
    if(current_category != "" && current_category != "No Domain"){
      autocompleteResults = tagsMap[current_category].filter(x => 
        x.toLowerCase().startsWith(queryString.toLowerCase().trim()) ||
        x.toLowerCase().split(" ").includes(queryString.toLowerCase().trim())
      )
    }
    else{
      autocompleteResults =  tags.filter(x => 
        x.toLowerCase().startsWith(queryString.toLowerCase().trim()) ||
        x.toLowerCase().split(" ").includes(queryString.toLowerCase().trim())
      )
    }
    renderSuggestions(autocompleteResults)
  }
  document.getElementById('searchBar').onkeyup = document.getElementById('searchBar').onclick 


  function executeSearch(queryString) {
    console.log("here...")
    let hasFilter = false
    active_filters.forEach((filter, index) => {
      if(filter.value == queryString){
        hasFilter = true
      }
    })

    console.log("no if...")
    if(hasFilter) return;
    if((current_category == "No Domain" || current_category == "Misc" || current_category == "Specific Technologies") && queryString == ""){
      active_filters.forEach((filter, index, array) => {
        if(topics.includes(filter.value))
          array.splice(index, 1)
      })
      console.log("hi! first if")
    }
    else if(queryString == ""){
        console.log("second if!")
      active_filters.forEach((filter, index, array) => {
        if(topics.includes(filter.value))
          array.splice(index, 1)
      })
      active_filters.push({
        value: current_category,
      })
    } else {
        console.log("third if")
      active_filters.push({
        value: queryString,
      })
    }
    document.querySelector("#searchBar").value = "";
    renderFilters();
    renderResults();
  }

  function deleteFilter(e){
    let value = e.path[1].getAttribute("data-value")
    active_filters.forEach((filter, index) => {
      if(filter.value == value){
        active_filters.splice(index, 1)
      }
    })
    // console.log(active_filters)
    renderFilters();
    renderResults();
  }

  function renderFilters() {
    document.querySelector(".activeFilters").innerHTML = ""

    active_filters.forEach(filter => {
      console.log(filter.value)
      if(filter.value == "" || topics.includes(filter.value)) return;
      document.querySelector(".activeFilters").innerHTML += `
        <div class="searchPill pr-2" data-value='${filter.value}'>
          ${filter.value} 
          <img class="closeIcon" src="assets/images/x_icon.svg" />
        </div>`;
    })
    Array.from(document.getElementsByClassName("closeIcon")).forEach(elem => {
      elem.onclick = (e) => {deleteFilter(e)};
    })
  }

  function renderResults() {
    let noResults = true
    Array.from(document.getElementsByClassName("projectContainer")).forEach(elem => {
      let deleted = false;
      active_filters.forEach(filter => {
        if(deleted) return; 

        if(
          !projects[elem.getAttribute("data-id")].domains.includes(filter.value) &&
          !projects[elem.getAttribute("data-id")].tags.includes(filter.value)
        ){
          deleted = true
        }

      })
      if(deleted) elem.style.display = "none"
      else {
        elem.style.display = "block";
        noResults = false;
      }
    })
    if(noResults) document.querySelector(".galleryError").style.display = "block"
    else document.querySelector(".galleryError").style.display = "none"
  }

  function renderSuggestions(items) {
    let target = document.querySelector(".searchSuggestions");
    target.innerHTML = "";

    if(items.length == 0){
      target.innerHTML = "No Results Found";
    }
    items.forEach(item => {
      target.innerHTML += `<div class='searchPill'>${item}</div>`;
    })
    Array.from(document.querySelectorAll(".searchSuggestions > .searchPill")).forEach(elem => {
      elem.onclick = () => {executeSearch(elem.innerHTML)};
    })
  }

});