var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var draw = false;
// var ok = document.getElementById('ok');
// var box = document.getElementById('box');

canvas.addEventListener("mousedown", pointerDown, false);
canvas.addEventListener("mouseup", pointerUp, false);

function pointerDown(evt) {
    draw = true;
    ctx.beginPath();
    ctx.moveTo(evt.offsetX, evt.offsetY);
    canvas.addEventListener("mousemove", paint, false);
}

function pointerUp(evt) {
    canvas.removeEventListener("mousemove", paint);
    paint(evt);
}

function paint(evt) {
    ctx.lineTo(evt.offsetX, evt.offsetY);
    ctx.stroke();
}

document.getElementsByClassNam('ggg').addEventListener('submit', function(e){
    if (draw == false) {
    //     document.getElementsByClassNam('box').style.display="block";
    //     ok.addEventListener(('click', function(){
    //         document.getElementsByClassNam('box').style.display="none";

    // }
        e.preventDefault();
        //Cancels the event if it is cancelable, without stopping further propagation of the event.
        alert('Pleas sign the petition!');
        return;
    }

    document.getElementById('hidden-input').value = canvas.toDataURL();
    console.log(canvas.toDataURL());

});

document.getElementById('clear').addEventListener('click', function(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw = false;
    // if you clear signature and submit doesn't submit and ask for sign again
});
