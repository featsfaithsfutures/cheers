/**
 * Created by smclean on 27-Mar-14.
 */
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context;
var bufferLoader;
var cheerBuffer = null;
var cheerGain = null;

$(function(){
    preloadSounds();
})


function preloadSounds() {
    context = new AudioContext();

    bufferLoader = new BufferLoader(
        context,
        [
            '/public/sounds/Sports_Crowd.mp3'
        ],
        finishedLoading
    );

    bufferLoader.load();
}

function finishedLoading(bufferList) {
    cheerBuffer = bufferList[0];
    startCheer();
}

function startCheer()
{
    var source = context.createBufferSource();
    source.buffer = cheerBuffer;

    source.connect(context.destination);
    source.loop = true;
    // Create a gain node.
    cheerGain = context.createGain();
    // Connect the source to the gain node.
    source.connect(cheerGain);
    // Connect the gain node to the destination.
    cheerGain.connect(context.destination);

    // automatically start cheering at volume 0 until we get a update from server
    updateVolume(0);
    if (!source.start)
        source.start = source.noteOn;
    source.start(0);
}

function updateVolume(volume){
    console.log('playing sound at volume: ' + volume);
    var fraction = volume / 100;
    cheerGain.gain.value = fraction;
}
