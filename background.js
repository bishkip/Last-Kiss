
chrome.webNavigation.onCompleted.addListener(function(details) {
    if(!RegExp('inc/embed').test(details.url))
    {
        Main(details.url);
    }
}, {url: [{urlMatches : 'https://kisscartoon.info/episode/*'}, {urlMatches : 'https://www.thewatchcartoononline.tv/*'}]});

async function Main(pageUrl){    
    //Match url with pattern
    let site;
    let folderId;
    let name;
    let episode;
    let regexObj;

    new Promise((resolve, reject) => {
        //Find which site
        if (RegExp('kisscartoon').exec(pageUrl) == 'kisscartoon'){
            site = "KissCartoon";
        }
        else{
            site = "WatchCartoonOnline";
        }
        //Excecute function
        Folder(site).then(x => resolve(x));
    })
    .then((result) => {
        folderId = result;
        //Return next Promise
        return new Promise((resolve, reject) => {
            if (site == 'KissCartoon'){
                var regex = new RegExp('episode\/(.*?)-((?:sub|dub|season|episode)(?:.*?))\/');
                GetRegex(regex, pageUrl).then(x => resolve(x));
            }
            else{
                var regex = new RegExp('\.tv\/(.*?)-(episode-.+)');
                GetRegex(regex, pageUrl).then(x => resolve(x));
            }
        });
    })
    .then((result) => {
        regexObj = result;
        //Set variable so promise can access it
        //Clean up name
        return new Promise((resolve, reject) => {
            
            if(regexObj != null){
                name = regexObj[1];
            }
            else{
                reject("Not an episode");
            }
            name = result[1];
            if(name == ""){
                reject("Name is blank");
            }
            CleanUp(name).then(x => {
                name = x;
                resolve();
            });
        });
    })
    .then(() => {
        //Clean up episode
        return new Promise((resolve, reject) => {
            if(regexObj != null){
                episode = regexObj[2];
            }
            else{
                reject("Not an episode");
            }
            CleanUp(episode).then(x => {
                episode = x;
                resolve();
            });
        });
    })
    .then(() => {
        //Remove existing matches
        return new Promise((resolve, reject) => {
            chrome.bookmarks.search(name, (results)=> {
                if(results.length > 0) {
                    console.log("Removed "+results[0].title);
                    chrome.bookmarks.remove(results[0].id);
                }
                resolve();
            });
        });
    })
    .then(() => {
        //Save as bookmark within folder
        console.log("Saved "+name+' - '+episode);
        chrome.bookmarks.create({parentId: folderId, title: name+' - '+episode, url: pageUrl});
    }).catch(function(error) {
        console.error(error);
      });
}

async function Folder(name){
    return new Promise((resolve) => {
        chrome.bookmarks.search(name, function(results) {
            if (results.length == 0){
                //create new folder
                chrome.bookmarks.create({'parentId': chrome.bookmarks.getTree.id,
                'title': name},
                function(newFolder) {
                    resolve(newFolder.id);
                });
            }
            else{
                //Use folder
                resolve(results[0].id);
            }
        })
    });
}

async function GetRegex(regex, pageUrl){
    return new Promise((resolve) => {
            resolve(regex.exec(pageUrl));
    });
}

async function CleanUp(text){
    return new Promise((resolve) => {
        resolve(text.replace(/-/g, ' ').replace(/(^\w{1})|(\s{1}\w{1})/g, (c) => {return c.toUpperCase()}));
    });
}
