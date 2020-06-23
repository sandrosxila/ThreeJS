$(document).on('click', '.keep-open .dropdown-menu', function (e) {
    e.stopPropagation();
});




function readFileContent(file) {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result)
        reader.onerror = error => reject(error)
        reader.readAsText(file)
    })
}




let startI,startJ,finalI,finalJ,clickedOnCell=false;

function visualiseArray(height,width){
    const cells = document.getElementById('cells');
    cells.innerHTML = "";
    for(let i = 1; i <= height; i++){
        let lineDiv = document.createElement('div');
        lineDiv.style.flexWrap = 'nowrap';
        lineDiv.style.justifyContent = 'left';
        lineDiv.setAttribute('class','container');
        for(let j = 1; j <= width; j++){
            let cellDiv = document.createElement('div');
            cellDiv.setAttribute('class','cell');
            cellDiv.setAttribute('id',(i).toString() + '-' + (j).toString());
            cellDiv.setAttribute('title','(' + (i).toString() + ' , ' + (j).toString() + ')');
            lineDiv.appendChild(cellDiv);
            cellDiv.addEventListener('click',() => {
                if(clickedOnCell){
                    clickedOnCell = false;

                    document.getElementById('fieldFromI').value = startI;
                    document.getElementById('fieldFromJ').value = startJ;
                    document.getElementById('fieldToI').value= i;
                    document.getElementById('fieldToJ').value= j;
                }
                else {
                    if(finalI!==-1 && finalJ !== -1){
                        console.log('hey!!!');
                        for(let I = Math.min(startI,finalI); I <= Math.max(startI,finalI); I++){
                            for(let J = Math.min(startJ,finalJ); J <= Math.max(startJ,finalJ); J++){
                                let c = document.getElementById((I).toString() + '-' + (J).toString());
                                c.style.backgroundColor = 'white';
                            }
                        }
                    }
                    if(finalI === -1 && finalJ === -1){
                        let c = document.getElementById((startI).toString() + '-' + (startJ).toString());
                        c.style.backgroundColor = 'white';
                    }
                    cellDiv.style.backgroundColor = 'black';
                    startI = i;
                    startJ = j;
                    finalJ = -1;
                    finalI = -1;
                    clickedOnCell = true;
                    console.log("clicked on ",i,j);
                }
            });
            cellDiv.addEventListener('mouseover',() => {
                // console.log(i,j);
                if(clickedOnCell && i >= startI && j >= startJ) {
                    if(finalI === -1)finalI = startI;
                    if(finalJ === -1)finalJ = startJ;
                    if((Math.min(startI,finalI)<=i && i<=Math.max(startI,finalI)) && (Math.min(startJ,finalJ)<=j && j<=Math.max(startJ,finalJ))){
                        for(let I = Math.min(i,finalI) + 1; I <= Math.max(i,finalI); I++){
                            for(let J = startJ; J<= finalJ; J++){
                                let c = document.getElementById((I).toString() + '-' + (J).toString());
                                c.style.backgroundColor = 'white';
                            }
                        }
                        finalI = i;
                        for(let J = Math.min(j,finalJ) + 1; J <= Math.max(j,finalJ); J++) {
                            for (let I = startI; I <= finalI; I++) {
                                let c = document.getElementById((I).toString() + '-' + (J).toString());
                                c.style.backgroundColor = 'white';
                            }
                        }
                        finalJ = j;
                    }
                    else{
                        for(let I = Math.min(i,finalI); I <= Math.max(i,finalI); I++){
                            for(let J = startJ; J<= j; J++){
                                let c = document.getElementById((I).toString() + '-' + (J).toString());
                                if((I>=Math.min(startI,i) && I<=Math.max(startI,i)) && (J>=Math.min(startJ,j) && J<=Math.max(startJ,j)))
                                    c.style.backgroundColor = 'black';
                                else c.style.backgroundColor = 'white';
                            }
                        }
                        for(let J = Math.min(j,finalJ); J <= Math.max(j,finalJ); J++){
                            for(let I = startI; I <= i; I++){
                                let c = document.getElementById((I).toString() + '-' + (J).toString());
                                if((I>=Math.min(startI,i) && I<=Math.max(startI,i)) && (J>=Math.min(startJ,j) && J<=Math.max(startJ,j)))
                                    c.style.backgroundColor = 'black';
                                else c.style.backgroundColor = 'white';
                            }
                        }
                        finalJ = j;
                        finalI = i;
                    }
                }
            });
        }
        cells.appendChild(lineDiv);
    }
}
