const fs = require("fs")
const https = require("https")
const airtable = require("airtable")
const crypto = require('crypto')
require('dotenv').config()

airtableData = []

airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: process.env.AIRTABLE_API_KEY
});

let base = airtable.base(process.env.AIRTABLE_BASE_ID);

projectData = {
    projects: [],
    topics: new Set(),
    tags: new Set(),
    tagsMap: {},
}

const basePromise = new Promise((resolve, reject) => {
    base(process.env.AIRTABLE_BASE_PROJECTS_NAME).select({
        maxRecords: 500,
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            record = record.fields;
            if(record['Image Link'] && record['Mentee Name']){
                airtableData.push(record)
            }
        });
        fetchNextPage();

    }, function done(err) {
        if (err) { 
            console.error(err); 
            reject(err)
            return; 
        }
        airtableData = airtableData.filter(item => !item.Permissions.includes("I would not like my work to be showcased on the Inspirit AI website"));
        airtableData = airtableData.filter(item => item.Permissions.includes("Project Title and Abstract"));
        airtableData.forEach((item, index, array) => {
            if(!item.Permissions.includes("Research paper")){
                array[index]["Research Paper Link"] = undefined;
            }
            if(!item.Permissions.includes("Github/codebase link")){
                array[index]["Github Repo/Other Code File Links (optional)"] = undefined;
            }
            if(item["Github Repo/Other Code File Links (optional)"])
                if(item["Github Repo/Other Code File Links (optional)"].search(/colab/i) > -1)
                    array[index]["Github Repo/Other Code File Links (optional)"] = undefined;

            if(!item.Permissions.includes("Web application")){
                array[index]["Link to Project Webpage (optional)"] = undefined;
            }
            if(!item["Mentee Picture Link (optional)"]){
                item["Mentee Picture Link (optional)"] = "missing"//"assets/images/missing_image.png";
            }
            if(!item["Mentor Picture Link (optional)"]){
                item["Mentor Picture Link (optional)"] = "missing"//"assets/images/missing_image.png";
            } 

            let tempObj = {};
            tempObj["student_name"] = `${item["Mentee Name"].split(" ")[0]} ${item["Mentee Name"].split(" ")[1][0]}.`;
            tempObj["mentor_name"] = item["Mentor Name"];
            tempObj["mentor_title"] = item["Mentor Title"];
            tempObj["mentor_image"] = item["Mentor Picture Link (optional)"];
            tempObj["student_image"] = item["Mentee Picture Link (optional)"];
            tempObj["domains"] = [item["Domain 1"], item["Domain 2"]].filter(item=>item);
            tempObj["project_title"] = item["Project Title"];
            tempObj["project_desc"] = item["Project Description"];
            tempObj["research_paper"] = item["Research Paper Link"];
            tempObj["project_yr"] = item["Project Completed Year"];
            tempObj["project_quarter"] = item["Project Completed Season"];
            tempObj["github"] = item["Github Repo/Other Code File Links (optional)"];
            tempObj["project_webpage"] = item["Link to Project Webpage (optional)"];
            tempObj["graphic_link"] = item["Image Link"];
            tempObj["headline"] = item["Headline"];
            tempObj["project_id"] = crypto.createHash('sha1').update(`${item["Project Title"]}${item["Mentee Name"]}`).digest('hex');
            tempObj["expand"] = item["Project Title"].length > 75 ? true : false;
            tempObj["tags"] = item["Tags"];
            projectData.projects.push(tempObj);

            // tempObj.domains.forEach(topic => projectData.topics.add(topic));
            tempObj.tags.forEach(tag => projectData.tags.add(tag));
        })
        function getRandomInt(max) {
          return Math.floor(Math.random() * max);
        }

        function shuffle(array) {
            let currentIndex = array.length, randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
            }
            return array;
        }

        let projData = {}
        projData.projects = projectData.projects.map((item, curr_index) => {
          let related = [];
          projectData.projects.forEach((entry, rel_index) =>{
            if(item.domains.filter(value => entry.domains.includes(value)).length > 0){
              if(curr_index != rel_index)
                  related.push(rel_index);
            }
          });
          related = shuffle(related).splice(0, 3);
          let rand_index = 0;
          while(related.length < 3){
            rand_index = getRandomInt(projectData.projects.length);
            if(!related.includes(projectData.projects[rand_index]) && curr_index != rand_index)
                related.push(rand_index);
          }
          item["related_proj"] = related;
          return item;
        });
        projectData.topics = Array.from(projectData.topics).sort();
        projectData.tags = Array.from(projectData.tags).sort();

        // fs.writeFileSync('./data.json', JSON.stringify(projectData, null, 2) , 'utf-8');
        resolve();
    });
});


let domainsPromise = new Promise((resolve, reject) => { setTimeout(() => {}, 10000); resolve(); });

Promise.all([basePromise]).then(() => { 
    domainsPromise = new Promise((resolve, reject) => {
        base(process.env.AIRTABLE_BASE_DOMAINS_NAME).select({
            maxRecords: 500,
            view: "Grid view" 
        }).eachPage(function page(records, fetchNextPage) {
            records.forEach(function(record) {
                record = record.fields;
                projectData.tagsMap[record["Name"]] = record["Tags"].sort()
                projectData.topics.push(record["Name"])
            });
            projectData.topics = projectData.topics.sort()
            fetchNextPage();

        }, function done(err) {
            if (err) { 
                console.error(err); 
                reject();
                return; 
            }
            resolve();
        });
    });
});

Promise.all([domainsPromise, basePromise]).then(() => {
    let image_promises = []

    projectData.projects.forEach((project, index, array) => {
        if(index % 5 == 0) setTimeout(() => {}, 1000)
        if(project.mentor_image == "missing"){
            array[index].mentor_image = "assets/images/missing_image.png"
        } else {
            let mentor_img_url = project.mentor_image
            let mentor_img_id = mentor_img_url.substr(mentor_img_url.indexOf("/d/") + 3, 33)
            let mentor_api_link = `https://www.googleapis.com/drive/v3/files/${mentor_img_id}?alt=media&key=${process.env.GOOGLE_API_KEY}`

            let mentor_promise = new Promise((resolve, reject) => {
                https.get(mentor_api_link, res => {
                    const local_id = crypto.createHash('sha1').update(`${mentor_img_id}${mentor_img_id}`).digest('hex');
                    const mentor_local_url = `./src/assets/images/mentor_imgs/${local_id}.png`
                    const file = fs.createWriteStream(mentor_local_url)
                    res.pipe(file)
                    file.on('finish', () => {
                        file.close()
                        console.log(`File downloaded!`)
                        array[index].mentor_image = `assets/images/mentor_imgs/${local_id}.png`
                        resolve()
                    });
                }).on('error', (e) => {
                    console.error(e);
                    reject()
                });
            })
            image_promises.push(mentor_promise)
        }

        if(project.student_image == "missing"){
            array[index].student_image = "assets/images/missing_image.png"
        } else {
            let student_img_url = project.student_image
            let student_img_id = student_img_url.substring(student_img_url.indexOf("id=") + 3)
            let student_api_link = `https://www.googleapis.com/drive/v3/files/${student_img_id}?alt=media&key=${process.env.GOOGLE_API_KEY}`

            let student_promise = new Promise((resolve, reject) => {
                https.get(student_api_link, res => {
                    const local_id = crypto.createHash('sha1').update(`${student_img_id}${student_img_id}`).digest('hex');
                    const student_local_url = `./src/assets/images/student_imgs/${local_id}.png`
                    const file = fs.createWriteStream(student_local_url)
                    res.pipe(file)
                    file.on('finish', () => {
                        file.close()
                        console.log(`File downloaded!`)
                        array[index].student_image = `assets/images/student_imgs/${local_id}.png`
                        resolve()
                    });
                }).on('error', (e) => {
                    console.error(e);
                    reject()
                });
            })
            image_promises.push(student_promise)
        }
        if(project.research_paper != undefined){
            let research_paper_url = project.research_paper
            let research_paper_id = research_paper_url.substring(research_paper_url.indexOf("id=") + 3)
            let research_paper_api_link = `https://www.googleapis.com/drive/v3/files/${research_paper_id}?key=${process.env.GOOGLE_API_KEY}&alt=media`


            let research_paper_promise = new Promise((resolve, reject) => {
                https.get(research_paper_api_link, res => {
                    const local_id = crypto.createHash('sha1').update(`${research_paper_id}${research_paper_id}`).digest('hex');
                    const research_paper_local_url = `./src/assets/pdfs/${local_id}.pdf`
                    const file = fs.createWriteStream(research_paper_local_url)
                    res.pipe(file)
                    file.on('finish', () => {
                        file.close()
                        console.log(`PDF downloaded!`)
                        array[index].research_paper = `assets/pdfs/${local_id}.pdf`
                        resolve()
                    });
                }).on('error', (e) => {
                    console.error(e);
                    reject()
                });
            })
            image_promises.push(research_paper_promise)
        }
    })
    Promise.all(image_promises).then(() => {
        fs.writeFileSync('./data.json', JSON.stringify(projectData, null, 2) , 'utf-8');
    })
});


