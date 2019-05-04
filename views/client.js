let uploadToken;
let file = {};
var partSize;
var userID = 12345;

const socket = io.connect('http://localhost:3030', {
    'reconnection': true,
    'reconnectionDelay': 100,
    'reconnectionDelayMax': 500,
    'reconnectionAttempts': 5
});



const xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
        console.log(this);
    } else {
        console.log(this);
    }
};
function sendRequest(method, url) {
    xhttp.open(method, url, true);
    xhttp.send();
}
function readerReady(reader) {
    console.log(reader.readyState, FileReader.DONE)
    return reader.readyState === FileReader.DONE || reader.readyState === FileReader.EMPTY
}

function handleImage() {
    file = document.getElementById('file').files[0];
    const fileName = file.name;
    let fileSize = file.size;
    let path = (window.URL || window.webkitURL).createObjectURL(file);
    console.log('file path ::: ', path);

    socket.emit('start', { fileName: fileName, fileSize: fileSize, userid: userID });
}

socket.on('uploadToken1', (data) => {
    uploadToken = data;
    console.log("this is the token =====>", data)
    startUpload();
});

socket.on("nextChunkResume", (data) => {
    // console.log("After refresh the page upload token :::: ======== > ", data)
    if (data) {
        // here we need to write the continuation code 
        uploadToken = data["uploadID"];

        let chunksUploaded = Number(data["totalChunks"]) - Number(data["remainingChunks"]);
        // let chunksUploaded = Number(data["nextStartChunk"]);
        //   document.getElementById("file").disabled = true;
        console.log("user was present in backend :",data);
        startUpload({
            'chunksUploaded': chunksUploaded,
            "remainingChunks": Number(data["remainingChunks"])
        })
    }
});

socket.on("finish",()=>{
    console.log("finsih was called=====++++++++++");
    socket.emit('end',userID);
})

function startUpload(chunksUploaded) {
    document.getElementById("file").disabled = true;
    console.log('file details ::: ', file);
    console.log("this is value of chunksUploaded ", chunksUploaded)

    let reader = new FileReader();
    let partNum = 0;
    let fileSize = file.size;
    const fileName = file.name;
    // var totalSizeMB = fileSize / Math.pow(1024, 2);
    partSize = 1024 * 1024 * 5;

    let chunkSize = partSize;
    let byteProcessed = 0;
    let leftBytes = fileSize;
    var numPartsLeft = Math.ceil(fileSize / partSize);

    var  start;
        var  chunksProcessed ;

    console.log('number of parts left in client js ::: ', numPartsLeft);
    if(chunksUploaded == undefined){

        console.log("this is partnum :",partNum)
        console.log("this is numPartsLeft :",numPartsLeft)

        if (partNum <= numPartsLeft) {
            reader.onloadend = function (evt) {
                partNum += 1;
    
                console.log("evt No :: ", partNum);
    
                console.log('buffer value ::: ', evt.target.result);
                socket.emit('data', {
                    fileKey: fileName,
                    buffer: evt.target.result,
                    multipart: uploadToken,
                    partNum: partNum,
                    fileSize: fileSize,
                    numPartsLeft: numPartsLeft,
                    userid: userID
                })
            }
        }
        ({ start, chunksProcessed } = initRead(reader, file, fileSize, 0, chunkSize, leftBytes, byteProcessed));
        leftBytes = leftBytes - chunksProcessed;
        byteProcessed += chunksProcessed;
        console.log("leftBytes : ", leftBytes, " byteprocessed ", byteProcessed)
    }

 

    // new code

    
    // new code

    if (chunksUploaded != undefined) {

        
        byteProcessed = chunksUploaded["chunksUploaded"];
        leftBytes = fileSize - (chunksUploaded["chunksUploaded"]*partSize) ;

       partNum = chunksUploaded["chunksUploaded"];
       console.log("this is partnum :",partNum)
       console.log("this is numPartsLeft :",numPartsLeft)
       if (partNum <= numPartsLeft) {
           
        //    let reader = new FileReader();
           reader.onloadend = function (evt) {
               partNum += 1;
               let event = evt.target.result;
               console.log("evt No :: ", partNum);
               console.log('buffer value in client :::::::: ', evt.target.result);
               if (event && partNum <= numPartsLeft) {
                   console.log("***********emittting from the client side***************");
                   
                   socket.emit('data', {
                       fileKey: fileName,
                       buffer: evt.target.result,
                       multipart: uploadToken,
                       partNum: partNum,
                       fileSize: fileSize,
                       numPartsLeft: numPartsLeft,
                       userid: userID
                   })
               }

           }
       }

       ({ start, chunksProcessed } = initRead(reader, file, fileSize, partNum, chunkSize, leftBytes, byteProcessed));
       //({ start, chunksLeft, complete } = initRead(reader, file, fileSize, chunksUploaded, chunkSize, leftBytes, byteProcessed));
       leftBytes = leftBytes - chunksProcessed;
       byteProcessed += chunksProcessed;
       console.log("leftBytes : ", leftBytes, " byteprocessed ", byteProcessed)
   }


        
    // ===========


    socket.on('nextChunk', (remainingChunks) => {

          console.log("hurray this is remainng number of chunks=======================>",remainingChunks) ;
        ({ start, chunksProcessed, complete } = initRead(reader, file, fileSize, start, chunkSize, leftBytes, byteProcessed));
        
        if (complete || remainingChunks==0) {
            socket.emit('end', userID);
            document.getElementById("file").disabled = false;
            //location.reload();
        } else if(leftBytes >0) {
            leftBytes = leftBytes - chunksProcessed;
            byteProcessed += chunksProcessed;
        }
    });

};

function initRead(reader, file, fileSize, start, chunkSize, leftBytes, byteProcessed) {
    let currentChunkSize;
    if (byteProcessed != fileSize) {

        if ((leftBytes - chunkSize) >= 0) {
            currentChunkSize = chunkSize;
        } else {
            currentChunkSize = leftBytes;
        }

        start = readFile(file, reader, start, currentChunkSize);
        console.log('init read file in client js file ::::: ', start);
        return { start, chunksProcessed: currentChunkSize, complete: false };
    } else {
        return { start, chunksProcessed: currentChunkSize, complete: true };
    }

}
function readFile(file, reader, start = 0, chunkSize) {
    let blob = file.slice(start, start + chunkSize);
    reader.readAsArrayBuffer(blob);
    return start + chunkSize;
}

