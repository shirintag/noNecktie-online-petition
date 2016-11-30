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

document.getElementById('submitButton').addEventListener('click', function(){
    if (draw == false) {
    //     document.getElementsByClassNam('box').style.display="block";
    //     ok.addEventListener(('click', function(){
    //         document.getElementsByClassNam('box').style.display="none";

    // }
        alert('Pleas sign the petition!');
        return;
    }

    document.getElementById('hidden-input').value = canvas.toDataURL();
    console.log(canvas.toDataURL());

});

document.getElementById('clear').addEventListener('click', function(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
