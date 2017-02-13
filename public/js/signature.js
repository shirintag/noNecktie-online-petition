var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var draw = false;

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

document.getElementById('signature').addEventListener('submit', function(e){
    if (draw == false) {
        e.preventDefault();
        alert('Pleas sign the petition!');
        return;
    }

    document.getElementById('hidden-input').value = canvas.toDataURL();
    console.log(canvas.toDataURL());

});

// if you clear signature and submit, doesn't submit and ask for sign again
document.getElementById('clear').addEventListener('click', function(){
    console.log();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw = false;
});
