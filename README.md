# jquery-scroll-custom
Creates an scroll-y like action.

HTML:

    <div class="wrapper">
        <div class="space">
        <div class="space">
        <div class="space">
        <div class="space">
        <div class="space">
    </div>
    <div class="scroll-bar"></div>

CSS:

    .space {
        height: 150px;
    }
    
    div.wrapper {
        height: 400px;
        width: 700px;
        background-color: yellow;
        padding-right: 15px;
    }
    
    .scrollbar {
        border: 2px solid transparent;
        height: 75px;
        width: 10px;
        border-radius: 15px;
        background-color: #000;
        margin-left: 20px;
    }

JS:

    $('.wrapper').handleScroll({
        scrollbar: '.scrollbar',
        arrayFnSpaces: [fnAction, '.space'],
        initialSpace: 1,
        smoothEffect: true,
    });

    function fnAction() {
        console.log(this.space);
    };
