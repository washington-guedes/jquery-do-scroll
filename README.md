# jquery-scroll-custom
Creates an scroll-y with touchmove and mousemove events.

HTML:

    <div class="scroll">
        <img src="imgs/scroll.png">
    </div>
    <div class="scroll-bar"></div>

CSS:

    .scroll {
        position: absolute;
        margin: 418px 0 0 122px;
        width: 1804px;
        height: 868px;
        overflow: hidden;
    }
    
    .scroll-bar {
        width: 14px;
        border: 1px solid #ffe600;
        border-radius: 7px;
        background-color: #ffe600;
        display: none;
        height: 170px;
    }

JS:

    var div = $('.scroll');
    var fnCtrl = div.scroll({
        bar: '.scroll-bar',
        arrayFnSpaces: [fnAction, 594, 1414, 2162, 3022, 3514],
        elastic: true,
    });

    function fnAction(currentSpace) {
        console.log(currentSpace);
    };
