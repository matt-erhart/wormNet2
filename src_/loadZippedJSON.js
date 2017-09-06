var JSZip = require("jszip");
var zip = new JSZip();


module.exports =

fetch('./assets/data/full_json.zip')       // 1) fetch the url
.then(function (response) {                       // 2) filter on 200 OK
    if (response.status === 200 || response.status === 0) {
        return Promise.resolve(response.blob());
    } else {
        return Promise.reject(new Error(response.statusText));
    }
})
.then(JSZip.loadAsync)                            // 3) chain with the zip promise
.then(function (zip) {
    return zip.file("full_json.json").async("string"); // 4) chain with the text content promise
})
.then(function success(text) {                    // 5) display the result
    console.log(text)
}, function error(e) {
    console.log(e)
});